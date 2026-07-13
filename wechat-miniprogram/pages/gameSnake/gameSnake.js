// ====== 贪吃蛇游戏逻辑（原生微信小程序版）======
// 与 web 版 snake.html 算法一致：Canvas 2D 渲染，20x20 网格。
// 快速变化的画面只画在 canvas 上（不进 setData），仅分数/最高分/遮罩走 setData。

const GRID_SIZE = 20;

// 安全调用震动反馈
function vibrate(type) {
  try { wx.vibrateShort({ type: type || 'light' }); } catch (e) {}
}

Page({
  data: {
    score: 0,
    best: 0,
    showDpad: false,
    overlay: { show: false, title: '', sub: '', type: 'fail' }
  },

  onLoad() {
    const best = wx.getStorageSync('snakeBest') || 0;
    this.best = best;
    this.setData({ best });
    // 仅在触摸设备显示虚拟方向键
    try {
      const info = (wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync());
      this.setData({ showDpad: info.platform === 'ios' || info.platform === 'android' });
    } catch (e) {}
  },

  onReady() {
    wx.createSelectorQuery()
      .select('#gameCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0]) return;
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        let dpr = 2;
        try { const w = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()); dpr = w.pixelRatio || 2; } catch (e) {}
        const w = res[0].width;
        const h = res[0].height;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
        this.canvas = canvas;
        this.ctx = ctx;
        this.W = w;
        this.H = h;
        this.cell = w / GRID_SIZE;
        this.boundLoop = this.loop.bind(this);
        this.init();
      });
  },

  onUnload() { this.stopLoop(); },
  onHide() { this.stopLoop(); },

  init() {
    this.snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.score = 0;
    this.speed = 180;
    this.gameOver = false;
    this.paused = false;
    this.lastMoveTime = 0;
    this.setData({ score: 0, overlay: { show: false, title: '', sub: '', type: 'fail' } });
    this.spawnFood();
    this.draw();
    this.startLoop();
  },

  spawnFood() {
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (this.snake.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    this.food = newFood;
  },

  drawCell(x, y, color) {
    const s = this.cell;
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * s + 1, y * s + 1, s - 2, s - 2);
  },

  drawGrid() {
    const s = this.cell;
    this.ctx.strokeStyle = '#1c2433';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * s, 0);
      this.ctx.lineTo(i * s, this.H);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * s);
      this.ctx.lineTo(this.W, i * s);
      this.ctx.stroke();
    }
  },

  draw() {
    const s = this.cell;
    this.ctx.fillStyle = '#0a0a15';
    this.ctx.fillRect(0, 0, this.W, this.H);
    this.drawGrid();

    // 食物（带闪烁）
    const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 200);
    this.ctx.fillStyle = 'rgba(181, 108, 255, ' + pulse + ')';
    this.ctx.fillRect(this.food.x * s + 2, this.food.y * s + 2, s - 4, s - 4);

    // 蛇身
    this.snake.forEach((seg, idx) => {
      if (idx === 0) {
        this.drawCell(seg.x, seg.y, '#8a9bff');
      } else {
        const ratio = 1 - idx / (this.snake.length + 5);
        this.ctx.fillStyle = 'rgba(124, 123, 255, ' + (0.5 + ratio * 0.5) + ')';
        this.ctx.fillRect(seg.x * s + 2, seg.y * s + 2, s - 4, s - 4);
      }
    });

    // 蛇头眼睛
    const head = this.snake[0];
    this.ctx.fillStyle = '#0a0a15';
    const ex = head.x * s, ey = head.y * s;
    if (this.direction.x === 1) {
      this.ctx.fillRect(ex + 13, ey + 4, 3, 3);
      this.ctx.fillRect(ex + 13, ey + 13, 3, 3);
    } else if (this.direction.x === -1) {
      this.ctx.fillRect(ex + 4, ey + 4, 3, 3);
      this.ctx.fillRect(ex + 4, ey + 13, 3, 3);
    } else if (this.direction.y === 1) {
      this.ctx.fillRect(ex + 4, ey + 13, 3, 3);
      this.ctx.fillRect(ex + 13, ey + 13, 3, 3);
    } else {
      this.ctx.fillRect(ex + 4, ey + 4, 3, 3);
      this.ctx.fillRect(ex + 13, ey + 4, 3, 3);
    }
  },

  update() {
    this.direction = this.nextDirection;
    const head = { x: this.snake[0].x + this.direction.x, y: this.snake[0].y + this.direction.y };

    // 撞墙
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      this.endGame();
      return;
    }
    // 撞自身
    if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
      this.endGame();
      return;
    }

    this.snake.unshift(head);

    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      vibrate('light');
      this.setData({ score: this.score });
      if (this.speed > 80) this.speed -= 2;   // 每吃一个略提速
      this.spawnFood();
    } else {
      this.snake.pop();
    }
  },

  loop(timestamp) {
    if (this.gameOver || this.paused) return;
    if (timestamp - this.lastMoveTime >= this.speed) {
      this.update();
      this.lastMoveTime = timestamp;
      if (this.gameOver) return;   // update 内已 endGame 并停循环
    }
    this.draw();
    if (this.canvas) this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
  },

  startLoop() {
    this.lastMoveTime = 0;
    if (this.canvas) this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
  },
  stopLoop() {
    if (this.canvas && this.rafId) {
      this.canvas.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  },

  endGame() {
    this.gameOver = true;
    this.best = Math.max(this.best, this.score);
    wx.setStorageSync('snakeBest', this.best);
    this.setData({ best: this.best });
    this.setData({ overlay: { show: true, title: '游戏结束!', sub: '得分: ' + this.score, type: 'fail' } });
    vibrate('heavy');
    this.stopLoop();
  },

  setDirection(x, y) {
    if (this.gameOver || this.paused) return;
    if (x !== 0 && this.nextDirection.x === -x) return;
    if (y !== 0 && this.nextDirection.y === -y) return;
    this.nextDirection = { x, y };
  },

  togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.setData({ overlay: { show: true, title: '已暂停', sub: '', type: 'pause' } });
      this.stopLoop();
    } else {
      this.setData({ overlay: { show: false, title: '', sub: '', type: 'fail' } });
      this.startLoop();
    }
  },

  // ---- 输入 ----
  onDir(e) {
    const map = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const d = map[e.currentTarget.dataset.dir];
    if (d) this.setDirection(d[0], d[1]);
  },
  onTouchStart(e) {
    const t = e.touches[0];
    this.touchX = t.clientX;
    this.touchY = t.clientY;
  },
  onTouchEnd(e) {
    if (this.gameOver) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchX;
    const dy = t.clientY - this.touchY;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) this.setDirection(dx > 0 ? 1 : 0, 0);
    else this.setDirection(0, dy > 0 ? 1 : 0);
  },
  onReset() { if (!this.canvas) return; this.init(); },
  onResume() { this.togglePause(); },
  // 遮罩按钮：失败→重开，暂停→继续
  onOverlayBtn() {
    if (this.gameOver) this.onReset();
    else this.togglePause();
  },
  goBack() { wx.navigateBack(); }
});
