// ====== 打砖块游戏逻辑（原生微信小程序版）======
// 与 web 版 breakout.html 算法一致：Canvas 2D 渲染，挡板拖动/点击发射、砖块碰撞、生命/关卡。
// 画面只画在 canvas（不进 setData），仅分数/关卡/生命/遮罩走 setData。

const BRICK_ROWS = 5;
const BRICK_COLS = 9;
const MAX_LIVES = 3;

// 每行砖块颜色（蓝紫家族，与全站统一）
const ROW_COLORS = ['#b56cff', '#9b6cff', '#7d7bff', '#6c8cff', '#5ad1e6'];
const ROW_POINTS = [50, 40, 30, 20, 10];

function vibrate(type) {
  try { wx.vibrateShort({ type: type || 'light' }); } catch (e) {}
}

Page({
  data: {
    score: 0, level: 1, livesText: '♥♥♥', showTouch: false,
    state: 'ready',
    overlay: { show: false, title: '', sub: '', type: 'fail', btn: '' }
  },

  onLoad() {
    try {
      const info = (wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync());
      this.setData({ showTouch: info.platform === 'ios' || info.platform === 'android' });
    } catch (e) {}
  },

  onReady() {
    wx.createSelectorQuery()
      .select('#gameCanvas').fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const g = res[0];
        let pr = 2;
        try { const w = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()); pr = w.pixelRatio || 2; } catch (e) {}
        g.node.width = g.width * pr;
        g.node.height = g.height * pr;
        const ctx = g.node.getContext('2d');
        ctx.scale(pr, pr);

        this.canvas = g.node;
        this.ctx = ctx;
        this.W = g.width;
        this.H = g.height;
        // 由画布尺寸推导的关卡参数
        this.PADDLE_W = this.W * 0.18;
        this.PADDLE_H = this.H * 0.022;
        this.BALL_R = Math.max(5, this.W * 0.014);
        this.BRICK_H = this.H * 0.035;
        this.BRICK_GAP = this.W * 0.008;
        this.TOP_OFFSET = this.H * 0.09;
        this.SIDE_MARGIN = this.W * 0.03;
        this.PADDLE_SPEED = this.W * 0.04;
        this.boundLoop = this.loop.bind(this);
        this.init();
      });
  },

  onUnload() { this.stopLoop(); },
  onHide() { this.stopLoop(); },

  resetBall() {
    this.ball = {
      x: this.paddle.x + this.paddle.w / 2,
      y: this.paddle.y - this.BALL_R - 2,
      vx: 0, vy: 0, stuck: true
    };
  },

  launchBall() {
    if (!this.ball.stuck) return;
    this.ball.stuck = false;
    vibrate('light');
    this.ball.vx = this.ballSpeed * 0.35;
    this.ball.vy = -this.ballSpeed * 0.94;
    this.setState('playing');
  },

  buildBricks() {
    this.bricks = [];
    const totalW = this.W - this.SIDE_MARGIN * 2;
    const bw = (totalW - this.BRICK_GAP * (BRICK_COLS - 1)) / BRICK_COLS;
    for (let r = 0; r < BRICK_ROWS; r++) {
      for (let c = 0; c < BRICK_COLS; c++) {
        this.bricks.push({
          x: this.SIDE_MARGIN + c * (bw + this.BRICK_GAP),
          y: this.TOP_OFFSET + r * (this.BRICK_H + this.BRICK_GAP),
          w: bw, h: this.BRICK_H,
          color: ROW_COLORS[r % ROW_COLORS.length],
          points: ROW_POINTS[r % ROW_POINTS.length],
          alive: true
        });
      }
    }
  },

  setState(s) {
    this.state = s;
    this.setData({ state: s });
    this.refreshOverlay();
  },

  refreshOverlay() {
    let o;
    if (this.state === 'ready') o = { show: true, title: '准备', sub: '点击挡板发射小球', type: 'ready', btn: '' };
    else if (this.state === 'paused') o = { show: true, title: '已暂停', sub: '继续游戏', type: 'pause', btn: 'resume' };
    else if (this.state === 'over') o = { show: true, title: '游戏结束', sub: '得分 ' + this.score, type: 'fail', btn: 'reset' };
    else o = { show: false, title: '', sub: '', type: 'fail', btn: '' };
    this.setData({ overlay: o });
  },

  init() {
    this.score = 0;
    this.level = 1;
    this.lives = MAX_LIVES;
    this.ballSpeed = this.W * 0.009;   // 与画布尺寸成比例的球速
    this.paddle = { x: (this.W - this.PADDLE_W) / 2, y: this.H - this.H * 0.07, w: this.PADDLE_W, h: this.PADDLE_H };
    this.buildBricks();
    this.resetBall();
    this.updateHud();
    this.setState('ready');
    this.draw();
    this.startLoop();
  },

  updateHud() {
    this.setData({
      score: this.score,
      level: this.level,
      livesText: '♥'.repeat(Math.max(this.lives, 0)) || '—'
    });
  },

  hitBrick(b) {
    if (!b.alive) return false;
    if (this.ball.x + this.BALL_R < b.x || this.ball.x - this.BALL_R > b.x + b.w) return false;
    if (this.ball.y + this.BALL_R < b.y || this.ball.y - this.BALL_R > b.y + b.h) return false;
    const prevX = this.ball.x - this.ball.vx;
    const prevY = this.ball.y - this.ball.vy;
    const fromTop = prevY + this.BALL_R <= b.y;
    const fromBottom = prevY - this.BALL_R >= b.y + b.h;
    const fromLeft = prevX + this.BALL_R <= b.x;
    const fromRight = prevX - this.BALL_R >= b.x + b.w;
    if (fromTop || fromBottom) this.ball.vy = -this.ball.vy;
    else if (fromLeft || fromRight) this.ball.vx = -this.ball.vx;
    else { this.ball.vx = -this.ball.vx; this.ball.vy = -this.ball.vy; }
    b.alive = false;
    this.score += b.points;
    vibrate('light');
    return true;
  },

  update() {
    if (this.state !== 'playing' && this.state !== 'ready') return;

    // 挡板键盘移动
    let dir = 0;
    if (this.keys && (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A'])) dir -= 1;
    if (this.keys && (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D'])) dir += 1;
    if (dir !== 0) {
      this.paddle.x += dir * this.PADDLE_SPEED;
      this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));
    }

    if (this.ball.stuck) {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      this.ball.y = this.paddle.y - this.BALL_R - 2;
      return;
    }

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.x - this.BALL_R < 0) { this.ball.x = this.BALL_R; this.ball.vx = -this.ball.vx; }
    if (this.ball.x + this.BALL_R > this.W) { this.ball.x = this.W - this.BALL_R; this.ball.vx = -this.ball.vx; }
    if (this.ball.y - this.BALL_R < 0) { this.ball.y = this.BALL_R; this.ball.vy = -this.ball.vy; }

    if (this.ball.y - this.BALL_R > this.H) {
      this.lives--;
      this.updateHud();
      vibrate('heavy');
      if (this.lives <= 0) {
        this.setState('over');
        this.stopLoop();
        return;
      } else {
        this.setState('ready');
        this.resetBall();
        return;
      }
    }

    // 挡板碰撞
    if (this.ball.vy > 0 &&
        this.ball.y + this.BALL_R >= this.paddle.y &&
        this.ball.y - this.BALL_R <= this.paddle.y + this.paddle.h &&
        this.ball.x >= this.paddle.x && this.ball.x <= this.paddle.x + this.paddle.w) {
      this.ball.y = this.paddle.y - this.BALL_R;
      let hit = (this.ball.x - (this.paddle.x + this.paddle.w / 2)) / (this.paddle.w / 2);
      hit = Math.max(-0.75, Math.min(0.75, hit));
      const sp = Math.hypot(this.ball.vx, this.ball.vy);
      this.ball.vx = hit * sp;
      this.ball.vy = -Math.sqrt(Math.max(sp * sp - this.ball.vx * this.ball.vx, 0));
    }

    for (const b of this.bricks) {
      if (this.hitBrick(b)) { this.updateHud(); break; }
    }

    // 过关
    if (this.bricks.every(b => !b.alive)) {
      this.level++;
      this.ballSpeed *= 1.08;
      this.buildBricks();
      this.resetBall();
      this.setState('ready');
      this.updateHud();
    }
  },

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.W, this.H);
    for (const b of this.bricks) {
      if (!b.alive) continue;
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    }
    ctx.fillStyle = '#6c8cff';
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.BALL_R, 0, Math.PI * 2);
    ctx.fillStyle = '#e8ecf4';
    ctx.fill();
  },

  loop() {
    if (this.state === 'over') return;
    this.update();
    this.draw();
    if (this.canvas && this.state !== 'over') {
      this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
    }
  },

  startLoop() {
    if (this.canvas) this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
  },
  stopLoop() {
    if (this.canvas && this.rafId) {
      this.canvas.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  // ---- 输入 ----
  onTouchStart(e) {
    const t = e.touches[0];
    // 以画布内坐标定位挡板
    this.movePaddleTo(t.x);
    if (this.state === 'ready') this.launchBall();
  },
  onTouchMove(e) {
    const t = e.touches[0];
    this.movePaddleTo(t.x);
  },
  onTap() {
    if (this.state === 'ready') this.launchBall();
    else if (this.state === 'paused') this.resume();
  },
  movePaddleTo(x) {
    if (x == null) return;
    this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, x - this.paddle.w / 2));
  },
  onMove(e) {
    const d = Number(e.currentTarget.dataset.dir);
    this.paddle.x += d * this.PADDLE_SPEED * 2;
    this.paddle.x = Math.max(0, Math.min(this.W - this.paddle.w, this.paddle.x));
  },
  onLaunch() {
    if (this.state === 'ready') this.launchBall();
    else if (this.state === 'paused') this.resume();
    else if (this.state === 'playing') this.pause();
  },
  pause() {
    if (this.state !== 'playing') return;
    this.setState('paused');
    this.stopLoop();
  },
  resume() {
    if (this.state !== 'paused') return;
    this.setState('playing');
    this.startLoop();
  },

  onReset() { if (this.canvas) this.init(); },
  // 遮罩按钮：结束→重开，暂停→继续
  onOverlayBtn() {
    if (this.state === 'over') this.onReset();
    else if (this.state === 'paused') this.resume();
  },
  goBack() { wx.navigateBack(); }
});
