// ====== 2048 游戏逻辑（原生微信小程序版）======
// 与 web 版 2048.html 算法一致：棋盘用 tiles 数组保存带唯一 id 的方块，
// 滑动分两阶段 —— 先平移(setData 触发 CSS 过渡)，SLIDE_MS 后落定合并/生成/判定。

const SIZE = 4;
const SLIDE_MS = 110;          // 滑动动画时长（与 WXSS transition 匹配）
const CELL = 150;              // 格子边长(rpx)
const GAP = 20;                // 格子间距(rpx)
const STEP = CELL + GAP;       // 相邻格中心步长 = 170rpx

// 蓝紫家族渐变配色（与全站统一）
const COLORS = {
  2: '#34406e', 4: '#3f4d8c', 8: '#4d5fb0', 16: '#6c8cff',
  32: '#7d7bff', 64: '#9b6cff', 128: '#b56cff', 256: '#c56cd0',
  512: '#d76cae', 1024: '#ff7eb6', 2048: '#ff9ec4'
};

function colorFor(v) {
  if (v === 0) return '#11162a';
  return COLORS[v] || '#3c3a32';
}
function textColor() {
  return '#eef2ff';
}
function fontSizeFor(v) {
  const len = String(v).length;
  return len <= 2 ? 64 : len === 3 ? 52 : 40;
}

// 方向 -> 物理坐标：i 为线索引，j 为该线上位置(0 为移动方向最前)
function cellRC(i, dir, j) {
  if (dir === 'left')  return { r: i, c: j };
  if (dir === 'right') return { r: i, c: SIZE - 1 - j };
  if (dir === 'up')    return { r: j, c: i };
  if (dir === 'down')  return { r: SIZE - 1 - j, c: i };
}

// 安全调用震动反馈（合并/胜负提示）
function vibrate(type) {
  try { wx.vibrateShort({ type: type || 'light' }); } catch (e) {}
}

Page({
  data: {
    tiles: [],
    score: 0,
    best: 0,
    cells: new Array(16).fill(0),   // 仅用于渲染 16 个背景格
    overlay: { show: false, title: '', sub: '', type: 'fail' }
  },

  onLoad() {
    const best = wx.getStorageSync('best2048') || 0;
    this.best = best;
    this.setData({ best });
    this.init();
  },

  // 重置整局
  init() {
    this.tiles = [];
    this.score = 0;
    this.won = false;
    this.over = false;
    this.animating = false;
    this.nextId = 1;
    this.touchX = 0;
    this.touchY = 0;
    this.setData({
      score: 0,
      tiles: [],
      overlay: { show: false, title: '', sub: '', type: 'fail' }
    });
    this.spawn();
    this.spawn();
  },

  // 由 tiles 推导二维棋盘（用于空位检测与胜负判定）
  toGrid() {
    const g = [];
    for (let r = 0; r < SIZE; r++) g.push(new Array(SIZE).fill(0));
    this.tiles.forEach(t => { g[t.r][t.c] = t.value; });
    return g;
  },

  makeTile(r, c, value, isNew) {
    return {
      id: this.nextId++,
      value, r, c,
      tx: c * STEP, ty: r * STEP,
      color: colorFor(value),
      textColor: textColor(),
      fontSize: fontSizeFor(value),
      anim: isNew ? 'appear' : ''   // 'appear' 弹出淡入，'' 仅平移
    };
  },

  syncTiles() {
    this.setData({ tiles: this.tiles });
  },

  // 在随机空位生成一个新方块
  spawn() {
    const empty = [];
    const grid = this.toGrid();
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] === 0) empty.push([r, c]);
    if (!empty.length) return;
    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const value = Math.random() < 0.9 ? 2 : 4;
    this.tiles.push(this.makeTile(r, c, value, true));
    this.syncTiles();
  },

  // 收集某条线上的方块（按移动方向顺序，最前在前）
  lineTiles(i, dir) {
    const arr = [];
    for (let j = 0; j < SIZE; j++) {
      const { r, c } = cellRC(i, dir, j);
      const t = this.tiles.find(t => t.r === r && t.c === c);
      if (t) arr.push(t);
    }
    return arr;
  },

  removeTile(t) {
    const i = this.tiles.indexOf(t);
    if (i >= 0) this.tiles.splice(i, 1);
  },

  // 处理一次滑动
  move(dir) {
    if (this.over || this.animating) return;
    if (this.won) this.hideOverlay();   // 胜利后可继续挑战

    let moved = false;
    let gained = 0;
    const merges = [];   // 待合并项：{r,c,value,a,b}

    for (let i = 0; i < SIZE; i++) {
      const lt = this.lineTiles(i, dir);
      let tgt = 0;
      for (let k = 0; k < lt.length; k++) {
        const pos = cellRC(i, dir, tgt);
        if (k + 1 < lt.length && lt[k].value === lt[k + 1].value) {
          // 合并 lt[k] 与 lt[k+1]
          lt[k].r = pos.r;     lt[k].c = pos.c;
          lt[k + 1].r = pos.r; lt[k + 1].c = pos.c;
          lt[k].tx = pos.c * STEP;     lt[k].ty = pos.r * STEP;
          lt[k + 1].tx = pos.c * STEP; lt[k + 1].ty = pos.r * STEP;
          merges.push({ r: pos.r, c: pos.c, value: lt[k].value * 2, a: lt[k], b: lt[k + 1] });
          gained += lt[k].value * 2;
          moved = true;
          k++;
        } else {
          if (lt[k].r !== pos.r || lt[k].c !== pos.c) moved = true;
          lt[k].r = pos.r; lt[k].c = pos.c;
          lt[k].tx = pos.c * STEP; lt[k].ty = pos.r * STEP;
        }
        tgt++;
      }
    }

    if (!moved) return;

    this.animating = true;
    this.syncTiles();   // 触发滑动过渡

    // 更新分数与最高分
    this.score += gained;
    if (gained > 0) vibrate('light');
    if (this.score > this.best) {
      this.best = this.score;
      wx.setStorageSync('best2048', this.best);
    }
    this.setData({ score: this.score, best: this.best });

    // 滑动结束后落定：移除合并源、生成合并结果、生成新方块、判定状态
    setTimeout(() => {
      merges.forEach(m => {
        this.removeTile(m.a);
        this.removeTile(m.b);
        const t = this.makeTile(m.r, m.c, m.value, true);
        t.anim = 'pop';   // 合并结果用放大弹出动画
        this.tiles.push(t);
      });
      this.spawn();
      this.rebuildAndCheck();
      this.animating = false;
      this.syncTiles();
    }, SLIDE_MS);
  },

  rebuildAndCheck() {
    const grid = this.toGrid();
    let win = false;
    for (let r = 0; r < SIZE && !win; r++)
      for (let c = 0; c < SIZE; c++)
        if (grid[r][c] === 2048) { win = true; break; }

    if (!this.won && win) {
      this.won = true;
      this.showOverlay('你赢了!', '继续滑动挑战更高分', 'win');
      vibrate('medium');
    } else if (!this.hasMoves(grid)) {
      this.over = true;
      this.showOverlay('游戏结束', '得分 ' + this.score, 'fail');
      vibrate('heavy');
    }
  },

  hasMoves(b) {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (b[r][c] === 0) return true;
        if (c < SIZE - 1 && b[r][c] === b[r][c + 1]) return true;
        if (r < SIZE - 1 && b[r][c] === b[r + 1][c]) return true;
      }
    }
    return false;
  },

  showOverlay(title, sub, type) {
    this.setData({ overlay: { show: true, title, sub, type } });
  },
  hideOverlay() {
    this.setData({ overlay: { show: false, title: '', sub: '', type: 'fail' } });
  },

  // 触摸滑动支持（移动端）
  onTouchStart(e) {
    const t = e.touches[0];
    this.touchX = t.clientX;
    this.touchY = t.clientY;
  },
  onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchX;
    const dy = t.clientY - this.touchY;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (Math.max(ax, ay) < 24) return;   // 滑动阈值
    if (ax > ay) this.move(dx > 0 ? 'right' : 'left');
    else this.move(dy > 0 ? 'down' : 'up');
  },

  // 分享给微信好友：标题带上当前分数，path 深链到本游戏页，好友点卡片直接进游戏
  onShareAppMessage() {
    const score = this.score || 0;
    return {
      title: '我在「椒哥休闲游戏」2048 拿了 ' + score + ' 分，来挑战！',
      path: 'pages/game2048/game2048'
    };
  },
  // 分享到朋友圈
  onShareTimeline() {
    const score = this.score || 0;
    return {
      title: '我在「椒哥休闲游戏」2048 拿了 ' + score + ' 分！'
    };
  },
  onReset() { this.init(); },
  goBack() { wx.navigateBack(); }
});
