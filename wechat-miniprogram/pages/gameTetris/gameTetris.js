// ====== 俄罗斯方块游戏逻辑（原生微信小程序版）======
// 与 web 版 tetris.html 算法一致：Canvas 2D 渲染 10x20，7 种方块下落消除、等级加速。

const COLS = 10;
const ROWS = 20;

// 方块形状定义
const SHAPES = {
  I: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
  O: [[1,1],[1,1]],
  T: [[0,1,0],[1,1,1],[0,0,0]],
  S: [[0,1,1],[1,1,0],[0,0,0]],
  Z: [[1,1,0],[0,1,1],[0,0,0]],
  J: [[1,0,0],[1,1,1],[0,0,0]],
  L: [[0,0,1],[1,1,1],[0,0,0]]
};

// 冷色霓虹家族
const COLORS = {
  I: '#7fe7ff', O: '#8a9bff', T: '#b98cff',
  S: '#7affc4', Z: '#ff8fbf', J: '#5b8bff', L: '#ffbe7a'
};

function vibrate(type) {
  try { wx.vibrateShort({ type: type || 'light' }); } catch (e) {}
}

Page({
  data: {
    score: 0, level: 1, lines: 0, best: 0, showTouch: false,
    overlay: { show: false, title: '', sub: '', type: 'fail' }
  },

  onLoad() {
    const best = wx.getStorageSync('tetrisBest') || 0;
    this.best = best;
    this.setData({ best });
    try {
      const info = (wx.getDeviceInfo ? wx.getDeviceInfo() : wx.getSystemInfoSync());
      this.setData({ showTouch: info.platform === 'ios' || info.platform === 'android' });
    } catch (e) {}
  },

  onReady() {
    wx.createSelectorQuery()
      .select('#gameCanvas').fields({ node: true, size: true })
      .select('#nextCanvas').fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[1]) return;
        const g = res[0], n = res[1];
        let pr = 2;
        try { const w = (wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()); pr = w.pixelRatio || 2; } catch (e) {}
        // 主盘
        g.node.width = g.width * pr;
        g.node.height = g.height * pr;
        const gctx = g.node.getContext('2d');
        gctx.scale(pr, pr);
        // 预览
        n.node.width = n.width * pr;
        n.node.height = n.height * pr;
        const nctx = n.node.getContext('2d');
        nctx.scale(pr, pr);

        this.canvas = g.node;
        this.ctx = gctx;
        this.W = g.width;
        this.H = g.height;
        this.BLOCK = g.width / COLS;
        this.nextCanvas = n.node;
        this.nextCtx = nctx;
        this.NEXT_W = n.width;
        this.NEXT_H = n.height;
        this.boundLoop = this.loop.bind(this);
        this.init();
      });
  },

  onUnload() { this.stopLoop(); },
  onHide() { this.stopLoop(); },

  initBoard() {
    this.board = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
  },

  createPiece() {
    const types = Object.keys(SHAPES);
    const type = types[Math.floor(Math.random() * types.length)];
    return {
      shape: SHAPES[type].map(row => [...row]),
      color: COLORS[type],
      type,
      x: Math.floor(COLS / 2) - Math.floor(SHAPES[type][0].length / 2),
      y: 0
    };
  },

  drawBlock(ctx, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.fillRect(x * size, y * size, size, size);
    ctx.strokeStyle = '#1c2433';
    ctx.lineWidth = 2;
    ctx.strokeRect(x * size, y * size, size, size);
  },

  drawBoard() {
    const ctx = this.ctx, block = this.BLOCK;
    ctx.clearRect(0, 0, this.W, this.H);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 1;
    for (let i = 0; i <= COLS; i++) {
      ctx.beginPath(); ctx.moveTo(i * block, 0); ctx.lineTo(i * block, this.H); ctx.stroke();
    }
    for (let i = 0; i <= ROWS; i++) {
      ctx.beginPath(); ctx.moveTo(0, i * block); ctx.lineTo(this.W, i * block); ctx.stroke();
    }
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (this.board[row][col]) this.drawBlock(ctx, col, row, this.board[row][col], block);
      }
    }
  },

  drawPiece(piece, ctx, block) {
    piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) this.drawBlock(ctx, piece.x + x, piece.y + y, piece.color, block);
      });
    });
  },

  drawNextPiece() {
    const ctx = this.nextCtx;
    const block = this.NEXT_W / 4;
    ctx.clearRect(0, 0, this.NEXT_W, this.NEXT_H);
    if (!this.nextPiece) return;
    const offX = (4 - this.nextPiece.shape[0].length) / 2;
    const offY = (4 - this.nextPiece.shape.length) / 2;
    this.nextPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) this.drawBlock(ctx, offX + x, offY + y, this.nextPiece.color, block);
      });
    });
  },

  movePiece(dx, dy) {
    if (this.gameOver || this.paused) return false;
    this.currentPiece.x += dx;
    this.currentPiece.y += dy;
    if (this.collides()) {
      this.currentPiece.x -= dx;
      this.currentPiece.y -= dy;
      return false;
    }
    return true;
  },

  rotatePiece() {
    vibrate('light');
    if (this.gameOver || this.paused) return;
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece.shape.map(row => row[i]).reverse());
    const original = this.currentPiece.shape;
    this.currentPiece.shape = rotated;
    if (this.collides()) {
      this.currentPiece.x += 1;
      if (this.collides()) {
        this.currentPiece.x -= 2;
        if (this.collides()) {
          this.currentPiece.x += 1;
          this.currentPiece.shape = original;
        }
      }
    }
  },

  collides() {
    const p = this.currentPiece;
    for (let y = 0; y < p.shape.length; y++) {
      for (let x = 0; x < p.shape[y].length; x++) {
        if (p.shape[y][x]) {
          const nx = p.x + x, ny = p.y + y;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && this.board[ny][nx]) return true;
        }
      }
    }
    return false;
  },

  lockPiece() {
    this.currentPiece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value) {
          const by = this.currentPiece.y + y;
          const bx = this.currentPiece.x + x;
          if (by >= 0) this.board[by][bx] = this.currentPiece.color;
        }
      });
    });
  },

  clearLines() {
    let cleared = 0;
    vibrate('medium');
    for (let y = ROWS - 1; y >= 0; y--) {
      if (this.board[y].every(cell => cell !== 0)) {
        this.board.splice(y, 1);
        this.board.unshift(Array(COLS).fill(0));
        cleared++;
        y++;
      }
    }
    if (cleared > 0) this.updateScore(cleared);
  },

  updateScore(cleared) {
    const points = [0, 100, 300, 500, 800];
    this.score += points[cleared] * this.level;
    this.lines += cleared;
    this.level = Math.floor(this.lines / 10) + 1;
    this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
    if (this.score > this.best) {
      this.best = this.score;
      wx.setStorageSync('tetrisBest', this.best);
    }
    this.setData({ score: this.score, level: this.level, lines: this.lines, best: this.best });
  },

  hardDrop() {
    vibrate('light');
    while (this.movePiece(0, 1)) {}
    this.lockAndNext();
  },

  lockAndNext() {
    this.lockPiece();
    this.clearLines();
    this.currentPiece = this.nextPiece;
    this.nextPiece = this.createPiece();
    this.drawNextPiece();
    if (this.collides()) this.endGame();
  },

  endGame() {
    this.gameOver = true;
    this.best = Math.max(this.best, this.score);
    wx.setStorageSync('tetrisBest', this.best);
    this.setData({ best: this.best });
    this.setData({ overlay: { show: true, title: '游戏结束!', sub: '得分: ' + this.score, type: 'fail' } });
    vibrate('heavy');
    this.stopLoop();
  },

  init() {
    this.initBoard();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.paused = false;
    this.dropInterval = 1000;
    this.dropCounter = 0;
    this.lastTime = 0;
    this.setData({
      score: 0, level: 1, lines: 0,
      overlay: { show: false, title: '', sub: '', type: 'fail' }
    });
    this.currentPiece = this.createPiece();
    this.nextPiece = this.createPiece();
    this.drawNextPiece();
    this.drawBoard();
    this.drawPiece(this.currentPiece, this.ctx, this.BLOCK);
    this.startLoop();
  },

  loop(time) {
    if (this.gameOver || this.paused) return;
    const delta = time - this.lastTime;
    this.lastTime = time;
    this.dropCounter += delta;
    if (this.dropCounter > this.dropInterval) {
      if (!this.movePiece(0, 1)) this.lockAndNext();
      this.dropCounter = 0;
      if (this.gameOver) return;
    }
    this.drawBoard();
    if (this.currentPiece) this.drawPiece(this.currentPiece, this.ctx, this.BLOCK);
    if (this.canvas) this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
  },

  startLoop() {
    this.lastTime = 0;
    this.dropCounter = 0;
    if (this.canvas) this.rafId = this.canvas.requestAnimationFrame(this.boundLoop);
  },
  stopLoop() {
    if (this.canvas && this.rafId) {
      this.canvas.cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
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
  onAct(e) {
    const act = e.currentTarget.dataset.act;
    if (act === 'left') this.movePiece(-1, 0);
    else if (act === 'right') this.movePiece(1, 0);
    else if (act === 'down') { if (!this.movePiece(0, 1)) this.lockAndNext(); }
    else if (act === 'rotate') this.rotatePiece();
    else if (act === 'harddrop') this.hardDrop();
    else if (act === 'pause') this.togglePause();
  },
  onTouchStart(e) {
    const t = e.touches[0];
    this.touchX = t.clientX;
    this.touchY = t.clientY;
  },
  onTouchEnd(e) {
    if (this.gameOver || this.paused) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchX;
    const dy = t.clientY - this.touchY;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;
    if (ax > ay) {
      if (dx > 0) this.movePiece(1, 0); else this.movePiece(-1, 0);
    } else {
      if (dy > 0) { if (!this.movePiece(0, 1)) this.lockAndNext(); }
      else this.rotatePiece();
    }
  },

  onReset() { if (!this.canvas) return; this.init(); },
  onResume() { this.togglePause(); },
  // 遮罩按钮：结束→重开，暂停→继续
  onOverlayBtn() {
    if (this.gameOver) this.onReset();
    else this.togglePause();
  },
  goBack() { wx.navigateBack(); }
});
