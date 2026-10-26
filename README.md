# 我叫MT：崛起 · 攻略站 / MT: Rise Fan Guide Site

## 简介 / About

「我叫MT：崛起 · 攻略站」是一个面向卡牌放置手游《我叫MT：崛起》的**纯静态、零依赖**中文玩家攻略站，收录：

- **英雄图鉴**（heroes.html）—— 全英雄的阵营、定位、技能与培养建议；
- **阵容推荐**（lineup.html）—— 从开荒队到毕业体系的分档阵容速查；
- **新手入门**（beginner.html）—— 开局英雄、升级路线与千抽策略；
- **游戏资源**（resource.html）—— 养成优先级与钻石金币规划；
- **交流区**（forum.html）与**反馈页**（feedback.html）。

"MT: Rise Fan Guide Site" is a **pure-static, zero-dependency** Chinese guide site for the mobile card game *我叫MT：崛起* (MT: Rise), covering hero encyclopedia, team compositions, beginner guide, resource planning, a community board, and a feedback page. Built with vanilla HTML/CSS/JS only.

## 目录结构 / Structure

```
mt-site/
├── index.html          # 首页 / Home
├── heroes.html         # 英雄图鉴 / Heroes
├── lineup.html         # 阵容推荐 / Lineups
├── beginner.html       # 新手入门 / Beginner Guide
├── resource.html       # 游戏资源 / Resources
├── forum.html          # 交流区 / Community Board
├── feedback.html       # 反馈页（中英双语）/ Feedback (bilingual)
├── README.md
├── assets/
│   ├── css/style.css   # 全站唯一样式 / Site-wide stylesheet
│   ├── js/common.js    # 页头/页脚/悬浮按钮注入 / Shared header, footer & FAB
│   ├── js/heroes.js
│   └── img/            # 图标与英雄头像 / Icons & hero portraits
└── data/               # 数据脚本（英雄/阵容/攻略）/ Data (heroes, lineups, guides)
```

## 本地打开 / Run Locally

**方式一（最简单）/ Option 1 (simplest)**：双击 `index.html` 即可在浏览器中打开，无需安装任何东西。
Double-click `index.html` — the site runs fully offline in any modern browser, nothing to install.

**方式二（推荐，体验更佳）/ Option 2 (recommended)**：起一个本地静态服务器：

```bash
# 在本目录执行 / run inside this directory
python -m http.server 8080
# 然后访问 / then open  http://localhost:8080
```

或 / or: `npx serve .`

> 页头导航、页脚与右下角「反馈」悬浮按钮由 `assets/js/common.js` 统一注入，全部页面生效。
> The header nav, footer and the bottom-right floating "反馈" button are injected by `assets/js/common.js` on every page.

## 反馈渠道 / Feedback

发现内容错误、Bug 或有建议？欢迎通过以下方式联系我们（全部入口见 `feedback.html`，页面支持中英双语）：

Found an error, a bug, or have a suggestion? Reach us via any of the following (all entries are on `feedback.html`, bilingual):

| 渠道 / Channel | 地址 / Address | 说明 / Notes |
| --- | --- | --- |
| 📮 主邮箱 / Primary | **898249759@qq.com** | QQ 邮箱，反馈页可一键预填主题与模板 / one-click pre-filled mailto |
| 📧 次邮箱 / Secondary | **yangfan.070312@gmail.com** | 支持 Gmail 网页写信链接 / Gmail web-compose link |
| 🐙 GitHub Issues | <https://github.com/yangfanwudi/mt-site/issues> | 需 GitHub 账号 / GitHub account required |

> 💡 **必看 / Must-read**：反馈邮件主题请以 **【我叫MT：崛起攻略站】** 开头 —— 站长已设置自动星标，带此前缀的邮件保证会被看到。
> Start your email subject with **【我叫MT：崛起攻略站】** — the author auto-stars prefixed mail, so it's guaranteed to be seen.

## 免责声明 / Disclaimer

本站为玩家非营利攻略站，数据整理自网络公开攻略，与游戏官方无关，仅供学习交流。
This is a non-profit fan-made guide site. Data is compiled from public sources and is not affiliated with the game's official team. For learning and exchange only.
