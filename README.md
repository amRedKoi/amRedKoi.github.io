# amRedKoi 个人小站

amRedKoi 的个人静态博客，记录科研、生活与随笔。纯 HTML + CSS + JavaScript 构建，无后端依赖，部署于 GitHub Pages。

## 本地预览

```bash
pnpm install
pnpm run vendor   # 首次安装后：把 markdown-it / KaTeX 资源同步到 assets/vendor/
pnpm start        # 等价于 python -m http.server 8000
```

然后访问 http://localhost:8000

## 目录结构

```
.
├── index.html            # 首页（文章列表、PID 仿真、顶刊链接）
├── about.html            # 关于我
├── post.html             # 文章详情页（post.html?id=<文章id>）
├── 随笔模板.html          # 独立静态页的复制模板（新增文章推荐用 posts/*.md，见下）
├── posts/                # ★ Markdown 文章目录（新增文章正文放这里）
│   ├── hello-world.md
│   └── ...
├── assets/
│   ├── css/style.css     # 全站样式（莫兰迪配色 + 深浅主题，含公式排版）
│   ├── js/posts.js       # ★ 文章元数据（id/title/category/date/excerpt/file）
│   ├── js/markdown.js    # ★ Markdown 渲染器（markdown-it + KaTeX 主引擎，零依赖渲染器兜底）
│   ├── js/projects.js    # 首页项目数据
│   ├── js/main.js        # 主题切换、每日一句、回到顶部等
│   ├── js/pid-sim.js     # 首页 PID 仿真
│   └── vendor/           # ★ 第三方浏览器资源（markdown-it / KaTeX，由脚本同步，勿手改）
├── scripts/
│   ├── generate-feed.mjs # ★ 自动生成 feed.xml / sitemap.xml 的脚本
│   └── vendor-assets.mjs # ★ 把 markdown-it / KaTeX 资源复制到 assets/vendor/
├── .github/workflows/
│   └── deploy.yml        # ★ 部署 workflow：安装依赖、同步 vendor、生成 feed + 部署 Pages
├── feed.xml              # RSS 订阅源（自动生成）
├── sitemap.xml           # 站点地图（自动生成）
└── robots.txt
```

## 发布新文章（Markdown 工作流）

1. 在 `posts/` 目录下新建 `xxx.md`，用 Markdown 书写正文（语法见下方速查）
2. 在 `assets/js/posts.js` 的 `window.posts` 数组新增一条记录：

   ```js
   {
     id: "xxx",                    // 唯一标识，用于 post.html?id=xxx
     title: "文章标题",
     category: "随笔",             // 或 技术 / 前端 等
     date: "2026-08-16",           // YYYY-MM-DD
     excerpt: "一句话摘要，显示在首页卡片上",
     file: "posts/xxx.md",         // 指向 Markdown 正文文件
   }
   ```

3. `git add` 并 `git commit`、`git push` 到 `main`
4. GitHub Actions 自动完成：重新生成 `feed.xml` / `sitemap.xml` → 部署到 GitHub Pages

### Markdown 语法速查

```markdown
## 二级标题（# ~ ###### 六档）

正文段落直接书写即可，空行分段。

**加粗**、*斜体*、~~删除线~~、`行内代码`

[链接文字](https://example.com) 与 ![图片描述](图片地址)

行内公式：欧拉公式 $e^{i\pi}+1=0$

独立行显示公式（可多行）：

$$
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
$$

> 引用块

- 无序列表
1. 有序列表

```js
// 代码块：``` 后跟语言名即可自动语法高亮（零依赖实现）
const posts = await fetch("/posts/hello-world.md");
console.log(posts.text());
```
```

> 说明：
> - **公式语法**：行内公式用 `$...$`，独立成行的显示公式用 `$$...$$`（可跨多行）。公式由 KaTeX 排版（`assets/vendor/katex/`），与主流 Markdown 博客一致；内容首尾不能是空格，`\$` 可输出字面美元符。KaTeX 不支持的命令会原样显示，不会报错。
> - **渲染引擎**：优先使用 markdown-it + KaTeX（文章页引用 `assets/vendor/`，feed 生成自动 require npm 包）；若第三方库未加载（如离线直接打开 HTML），自动回退到内置零依赖渲染器，公式语法一致。
> - 代码块语法高亮支持：`js`/`ts`/`jsx`/`tsx`、`html`/`xml`/`svg`、`css`/`scss`/`less`、`json`、`python`/`py`、`bash`/`sh`/`shell`、`sql`、`java`、`c`/`cpp`/`c++`、`csharp`、`go`、`rust`、`yaml`/`yml`。未列出的语言按纯文本显示，不影响阅读。
> - 本地预览需通过 HTTP 服务访问（`fetch` 加载 .md 文件，`file://` 直接打开会受限，此时将使用兜底渲染器）。

## 部署说明（GitHub Pages）

- 仓库 Settings → Pages → **Build and deployment** 来源选择 **GitHub Actions**（使用 `.github/workflows/deploy.yml` 部署）
- workflow 每次推送时自动运行：安装依赖 → 同步 vendor 资源 → 生成 feed/sitemap → 上传产物 → 部署
- 若之后改用了其他部署方式（如直接指定分支部署），`feed.xml` 与 `sitemap.xml` 需手动运行 `node scripts/vendor-assets.mjs && node scripts/generate-feed.mjs` 保持同步

## 订阅与收录

- RSS 订阅源：`https://amRedKoi.github.io/feed.xml`
- 站点地图：`https://amRedKoi.github.io/sitemap.xml`
- 可在 Google Search Console / Bing Webmaster 提交 sitemap 主动收录

## 许可证

MIT
