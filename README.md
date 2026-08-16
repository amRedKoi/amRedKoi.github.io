# amRedKoi 个人小站

amRedKoi 的个人静态博客，记录科研、生活与随笔。纯 HTML + CSS + JavaScript 构建，无后端依赖，部署于 GitHub Pages。

## 本地预览

```bash
pnpm install
pnpm start   # 等价于 python -m http.server 8000
```

然后访问 http://localhost:8000

## 目录结构

```
.
├── index.html            # 首页（文章列表、PID 仿真、顶刊链接）
├── about.html            # 关于我
├── post.html             # 文章详情页（post.html?id=<文章id>）
├── 随笔模板.html          # 新增随笔页的复制模板
├── assets/
│   ├── css/style.css     # 全站样式（莫兰迪配色 + 深浅主题）
│   ├── js/posts.js       # ★ 文章数据（新增文章改这里）
│   ├── js/projects.js    # 首页项目数据
│   ├── js/main.js        # 主题切换、每日一句、回到顶部等
│   └── js/pid-sim.js     # 首页 PID 仿真
├── scripts/
│   └── generate-feed.mjs # ★ 自动生成 feed.xml / sitemap.xml 的脚本
├── .github/workflows/
│   └── deploy.yml        # ★ 部署 workflow：生成 feed + 部署 Pages
├── feed.xml              # RSS 订阅源（自动生成）
├── sitemap.xml           # 站点地图（自动生成）
└── robots.txt
```

## 发布新文章

1. 在 `assets/js/posts.js` 的 `window.posts` 数组新增一条记录（`id`、`title`、`category`、`date`、`excerpt`、`content`）
2. `git add` 并 `git commit`、`git push` 到 `main`
3. GitHub Actions 自动完成：重新生成 `feed.xml` / `sitemap.xml` → 部署到 GitHub Pages

## 部署说明（GitHub Pages）

- 仓库 Settings → Pages → **Build and deployment** 来源选择 **GitHub Actions**（使用 `.github/workflows/deploy.yml` 部署）
- workflow 每次推送时自动运行：生成 feed/sitemap → 上传产物 → 部署
- 若之后改用了其他部署方式（如直接指定分支部署），`feed.xml` 与 `sitemap.xml` 需手动运行 `node scripts/generate-feed.mjs` 保持同步

## 订阅与收录

- RSS 订阅源：`https://amRedKoi.github.io/feed.xml`
- 站点地图：`https://amRedKoi.github.io/sitemap.xml`
- 可在 Google Search Console / Bing Webmaster 提交 sitemap 主动收录

## 许可证

MIT
