# 小游戏官网 · 经典街机合集

[![GitHub stars](https://img.shields.io/github/stars/kennethfan/games?style=social)](https://github.com/kennethfan/games)
[![GitHub forks](https://img.shields.io/github/forks/kennethfan/games?style=social)](https://github.com/kennethfan/games)
[![GitHub license](https://img.shields.io/github/license/kennethfan/games)](https://github.com/kennethfan/games)

> 🌟 源码仓库：[github.com/kennethfan/games](https://github.com/kennethfan/games) · 欢迎 Star 与 Fork

一组**纯前端**（HTML + CSS + JavaScript / Canvas）实现的休闲小游戏合集。
每个游戏都是独立的单文件页面，**无需任何服务器或安装**，双击即可在浏览器中游玩，
也支持部署到任意静态托管（GitHub Pages / Vercel / Nginx 等）。

支持 **键盘、鼠标与移动端触摸** 操作，桌面与手机均可畅玩。

## 游戏列表

| 游戏 | 入口 | 说明 |
| --- | --- | --- |
| 🧱 俄罗斯方块 | [tetris.html](./tetris.html) | 7 种方块、等级加速、下个预览、最高分 |
| 🐍 贪吃蛇 | [snake.html](./snake.html) | 方向键 / 触摸控制、最高分、速度递进 |
| 🔢 2048 | [2048.html](./2048.html) | 滑动合并、瓦片动画、最佳分持久化 |
| 🎯 打砖块 | [breakout.html](./breakout.html) | 关卡递进、反弹物理、3 条命 |
| 🎲 拯救女神 | [huarongdao.html](./huarongdao.html) | 移动木块、护送女神脱身、5 大经典布局、最少步数参考 |

## 操作说明

### 🧱 俄罗斯方块
- 键盘：`←` `→` 左右移动，`↑` 旋转，`↓` 加速下落，`空格` 硬降，`P` 暂停
- 触摸：屏幕下方虚拟按键（移动 / 旋转 / 下落 / 硬降 / 暂停），或在棋盘上滑动

### 🐍 贪吃蛇
- 键盘：`↑` `↓` `←` `→` 控制方向，`空格` 暂停 / 继续，`R` 重新开始
- 触摸：屏幕下方虚拟方向键，或在棋盘上滑动（不可反向）

### 🔢 2048
- 键盘：`↑` `↓` `←` `→` 或 `W` `A` `S` `D` 合并数字
- 触摸：在棋盘上滑动
- 最佳分保存在浏览器本地（`localStorage`）

### 🎯 打砖块
- 键盘：`←` `→` / `A` `D` 移动挡板，`空格` 或点击发射，`P` 暂停，`R` 重开
- 鼠标：移动鼠标控制挡板，点击发射
- 触摸：手指拖动控制挡板，点击发射

### 🎲 拯救女神
- 点击木块：朝你点击的那一侧滑入相邻空位，把 **女神** 送到棋盘底部中央出口
- 关卡：横刀立马 / 指挥若定 / 兵分三路 / 齐头并进 / 兵临曹营，可在顶部胶囊切换
- 统计：步数、各关最佳步数（`localStorage`）、最少步数参考
- 胜利：女神占据底部出口四格即通关，达成最少步数会提示「完美」

## 技术栈

- 纯静态页面，零运行时依赖、零构建步骤
- 渲染：Canvas（俄罗斯方块 / 贪吃蛇 / 打砖块）+ DOM（2048）
- 游戏循环：`requestAnimationFrame`
- 持久化：`localStorage`（最高分 / 最佳分）

## 本地运行

直接用浏览器打开对应 HTML 文件即可。若想通过本地服务器访问（部分浏览器对 `file://` 下的某些特性更严格）：

```bash
# 任选其一
python3 -m http.server 8000
# 或
npx serve .
```

然后访问 `http://localhost:8000`。

## 项目结构

```
.
├── index.html        # 合集门户页
├── tetris.html       # 俄罗斯方块（单文件）
├── snake.html        # 贪吃蛇（单文件）
├── 2048.html         # 2048（单文件）
├── breakout.html     # 打砖块（单文件）
├── huarongdao.html   # 拯救女神（单文件，传统华容道玩法）
└── LICENSE           # Apache License 2.0
```

## 许可证

[Apache License 2.0](./LICENSE)
