// 首页：游戏合集入口，路由到各游戏页
Page({
  data: { showPrivacy: false },

  onLoad() {
    // 已同意过则不弹；否则读取微信隐私设置，需授权时弹出
    if (wx.getStorageSync('privacyAgreed')) return;
    if (wx.getPrivacySetting) {
      wx.getPrivacySetting({
        success: (res) => {
          if (res.needAuthorization) this.setData({ showPrivacy: true });
        },
        fail: () => {}
      });
    }
  },

  // 查看完整隐私协议
  openPrivacy() {
    if (wx.openPrivacyContract) wx.openPrivacyContract({ fail: () => {} });
  },

  // 同意隐私协议
  agreePrivacy() {
    if (wx.requirePrivacyAuthorize) {
      wx.requirePrivacyAuthorize({
        success: () => {
          wx.setStorageSync('privacyAgreed', true);
          this.setData({ showPrivacy: false });
        },
        fail: () => {}
      });
    } else {
      wx.setStorageSync('privacyAgreed', true);
      this.setData({ showPrivacy: false });
    }
  },

  // 暂不授权（仅关闭弹窗，用户可选择不进入游戏）
  closePrivacy() { this.setData({ showPrivacy: false }); },

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
  },
  // 分享整个游戏合集给好友
  onShareAppMessage() {
    return {
      title: '椒哥休闲游戏 · 2048 / 贪吃蛇 / 俄罗斯方块 / 打砖块，一起来玩！',
      path: 'pages/index/index'
    };
  },
  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: '椒哥休闲游戏 · 4 款小游戏合集'
    };
  }
});
