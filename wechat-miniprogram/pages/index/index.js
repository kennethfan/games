// 首页：游戏合集入口，路由到各游戏页
Page({
  go2048() {
    wx.navigateTo({ url: '/pages/game2048/game2048' });
  },
  goSnake() {
    wx.navigateTo({ url: '/pages/gameSnake/gameSnake' });
  },
  goTetris() {
    wx.navigateTo({ url: '/pages/gameTetris/gameTetris' });
  },
  goBreakout() {
    wx.navigateTo({ url: '/pages/gameBreakout/gameBreakout' });
  }
});
