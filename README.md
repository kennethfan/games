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
| 🧩 女神拼图 | [puzzle.html](./puzzle.html) | 滑块拼图、10 关难度递进、计步计时、看原图、每关最佳纪录 |
| 💣 扫雷 | [minesweeper.html](./minesweeper.html) | 逻辑推理、初级 / 中级 / 高级难度、标记雷、计时与最佳 |
| 📦 推箱子 | [sokoban.html](./sokoban.html) | 8 关递进、撤销、每关最佳步数、经典解谜 |
| 🔗 连连看 | [lianliankan.html](./lianliankan.html) | 3 关递进、图案配对、提示 / 重排、路径拐弯 ≤ 2 |

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

### 🧩 女神拼图
- 点击：点击 **空格相邻** 的图块，将其滑入空位；也支持方向键操作
- 关卡：共 10 关，难度递进（第 1–3 关 3×3 / 第 4–7 关 4×4 / 第 8–10 关 5×5），顶部胶囊切换；每关固定初始布局，便于追求最少步数
- 辅助：「序号」显示每块目标位置、「原图」按住查看完整参考图
- 统计：步数、用时，以及每关的最佳步数 / 最佳用时（`localStorage`）
- 胜利：所有图块归位即复原成功；非末关可「下一关 ▶」，末关提示「全部通关」

### 💣 扫雷
- 左键：翻开格子；右键（或开启「标记」模式后左键）：标记地雷
- 首次点击保证安全（不会踩雷），数字表示周围 8 格的地雷数，空白格会自动展开
- 难度：初级 9×9 / 中级 16×16 / 高级 16×30，顶部胶囊切换
- 统计：剩余雷数、用时，以及各难度的**最佳用时**（`localStorage`）
- 胜负：翻开所有非雷格即通关；踩雷则失败并揭示全部地雷

### 📦 推箱子
- 键盘：`↑` `↓` `←` `→` 或 `W` `A` `S` `D` 移动；`Z` 撤销，`R` 重开
- 触摸：屏幕下方虚拟方向键
- 规则：走到箱子旁推动它，把它送到 ★ 目标点；推不动（前方是墙或另一箱）时需绕路
- 关卡：共 8 关递进，顶部胶囊切换；过关后可「下一关 ▶」
- 统计：步数、各关**最佳步数**（`localStorage`）；支持逐步撤销

### 🔗 连连看
- 点击两个**相同**图案，若它们之间的连线拐弯不超过两次且路径无阻挡，即可消除
- 辅助：「💡 提示」高亮一对可消图案；「🔀 重排」打乱剩余图案（无可消时也会自动重排）
- 关卡：共 3 关递进（网格与图案种类递增），顶部胶囊切换
- 统计：配对数、用时；清盘后「下一关 ▶」

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
├── puzzle.html       # 女神拼图（单文件，滑块拼图玩法）
├── minesweeper.html  # 扫雷（单文件，逻辑推理）
├── sokoban.html      # 推箱子（单文件，经典解谜）
├── lianliankan.html  # 连连看（单文件，图案配对）
├── assets/           # 公共样式 / 脚本 / 图片（common.css、common.js、goddess.png）
└── LICENSE           # Apache License 2.0
```

## 许可证

[Apache License 2.0](./LICENSE)
