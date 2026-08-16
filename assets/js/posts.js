/**
 * 博客文章数据
 * 每篇文章字段：
 *  - id: 唯一标识，用于详情页路由
 *  - title: 标题
 *  - category: 分类（用于筛选）
 *  - date: 发布日期
 *  - excerpt: 首页展示的摘要
 *  - content: 文章正文（支持简化的 HTML 标记）
 */
window.posts = [
  {
    id: "hello-world",
    title: "欢迎来到我的博客",
    category: "随笔",
    date: "2026-08-16",
    excerpt:
      "这是博客的第一篇文章。我搭建了这个静态博客，记录技术、生活与思考，希望这里能成为我沉淀内容的一方小天地。",
    content: `
      <p>你好，欢迎来到我的博客！</p>
      <p>这是我用纯 HTML / CSS / JavaScript 搭建的静态博客，无需服务器、无需数据库，所有内容都以文件形式管理。</p>
      <blockquote>记录让思考更清晰，分享让知识更有价值。</blockquote>
      <h2>这里会有什么</h2>
      <ul>
        <li>技术笔记与教程</li>
        <li>项目开发心得</li>
        <li>生活随笔与思考</li>
      </ul>
      <h2>如何发布新文章</h2>
      <p>编辑 <code>assets/js/posts.js</code>，在 <code>posts</code> 数组中新增一条记录即可，非常简单。</p>
    `,
  },
  {
    id: "build-static-blog",
    title: "零服务器搭建静态博客全攻略",
    category: "技术",
    date: "2026-08-10",
    excerpt:
      "为什么选择静态博客？如何用 HTML、CSS、JavaScript 在几分钟内搭建一个快速、安全、免费托管的博客站点？本文手把手教你。",
    content: `
      <p>静态博客由预先构建好的 HTML 文件组成，访问时浏览器直接读取文件，无需后端渲染。</p>
      <h2>静态博客的优势</h2>
      <ol>
        <li><strong>极速加载</strong>：没有服务器运算，页面秒开。</li>
        <li><strong>安全稳定</strong>：无数据库、无接口，攻击面小。</li>
        <li><strong>免费托管</strong>：GitHub Pages、Vercel、Netlify 等都支持。</li>
      </ol>
      <h2>核心实现</h2>
      <p>我们把文章数据存在一个 JS 文件中：</p>
      <pre><code>// assets/js/posts.js
window.posts = [
  { id: "hello", title: "你好", category: "随笔" }
];</code></pre>
      <p>首页通过循环渲染卡片，点击后根据 <code>id</code> 找到对应文章并填充到详情页。</p>
      <blockquote>优雅的页面，不需要复杂的框架。</blockquote>
    `,
  },
  {
    id: "css-grid-layout",
    title: "用 CSS Grid 打造响应式卡片布局",
    category: "前端",
    date: "2026-07-28",
    excerpt:
      "CSS Grid 是现代布局的利器。这篇文章用简单的几行代码，实现自动适配不同屏幕尺寸的卡片网格布局。",
    content: `
      <p>CSS Grid 提供了一个基于网格的二维布局系统，非常适合卡片式页面。</p>
      <h2>基础语法</h2>
      <pre><code>/* 每列最小 240px，可伸缩 */
.posts {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}</code></pre>
      <h2>解释</h2>
      <ul>
        <li><code>auto-fill</code>：尽量多放列。</li>
        <li><code>minmax(240px, 1fr)</code>：每列至少 240px，剩余空间均分。</li>
      </ul>
      <p>这样无需任何媒体查询，卡片就会自动换行并铺满屏幕，真正做到响应式。</p>
    `,
  },
  {
    id: "js-array-methods",
    title: "JavaScript 数组方法实用指南",
    category: "前端",
    date: "2026-07-15",
    excerpt:
      "map、filter、reduce、find……这些数组方法是日常开发的高频工具。用实际例子一次讲清楚它们的用法与区别。",
    content: `
      <p>数组方法能让你用更少的代码完成更清晰的数据处理。</p>
      <h2>常用方法</h2>
      <ul>
        <li><code>map</code>：对每个元素做变换，返回新数组。</li>
        <li><code>filter</code>：筛选满足条件的元素。</li>
        <li><code>find</code>：找到第一个匹配的元素。</li>
        <li><code>reduce</code>：归约，把数组累计为单个值。</li>
      </ul>
      <h2>示例</h2>
      <pre><code>const nums = [1, 2, 3, 4, 5];

const doubled = nums.map(n => n * 2); // [2,4,6,8,10]
const evens = nums.filter(n => n % 2 === 0); // [2,4]
const total = nums.reduce((s, n) => s + n, 0); // 15</code></pre>
      <p>掌握这些方法，你的代码会更简洁、更易读。</p>
    `,
  },
  {
    id: "learning-notes",
    title: "编程新手的学习方法与心路历程",
    category: "随笔",
    date: "2026-06-30",
    excerpt:
      "从零基础到能独立完成项目，我踩过不少坑。分享几条让我受益最大的学习经验，送给正在路上的你。",
    content: `
      <p>学习编程最难的往往不是技术本身，而是坚持与方向。</p>
      <h2>我的经验</h2>
      <ol>
        <li><strong>动手优先</strong>：只看不写，进步缓慢。</li>
        <li><strong>小步快跑</strong>：把大目标拆成一个个小练习。</li>
        <li><strong>善用文档</strong>：官方文档是最好的老师。</li>
        <li><strong>坚持输出</strong>：写博客、写笔记，教是最好的学。</li>
      </ol>
      <blockquote>种一棵树最好的时间是十年前，其次是现在。</blockquote>
      <p>希望这篇随笔能给你一些力量。</p>
    `,
  },
  {
    id: "github-pages-deploy",
    title: "用 GitHub Pages 免费部署你的网站",
    category: "技术",
    date: "2026-06-12",
    excerpt:
      "不花一分钱，把静态网站托管到 GitHub Pages，并绑定自己的域名。详细的图文步骤在这里。",
    content: `
      <p>GitHub Pages 是 GitHub 提供的免费静态站点托管服务。</p>
      <h2>部署步骤</h2>
      <ol>
        <li>在 GitHub 新建仓库，命名为 <code>&lt;用户名&gt;.github.io</code>。</li>
        <li>将本地静态文件推送到仓库。</li>
        <li>访问 <code>https://&lt;用户名&gt;.github.io</code> 即可。</li>
      </ol>
      <h2>绑定自定义域名</h2>
      <p>在仓库 <code>Settings &rarr; Pages</code> 中填写自定义域名，并在 DNS 服务商添加 CNAME 记录即可。</p>
      <pre><code># CNAME 示例
www  CNAME  用户名.github.io</code></pre>
      <p>这样一个免费的博客就上线啦。</p>
    `,
  },
];
