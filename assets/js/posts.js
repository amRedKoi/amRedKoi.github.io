/**
 * 博客文章数据
 * 每篇文章字段：
 *  - id: 唯一标识，用于详情页路由
 *  - title: 标题
 *  - category: 分类（用于筛选）
 *  - tags: 标签数组（用于标签云与筛选）
 *  - date: 发布日期
 *  - excerpt: 首页展示的摘要
 *  - file: 文章正文对应的 Markdown 文件（放在 posts/ 目录）
 *          （可选 content: 直接内联的 HTML，优先级高于 file）
 */
window.posts = [
  {
    id: "minimum-phase-elements",
    title: "最小相位环节的各种形式",
    category: "控制",
    tags: ["自动控制", "频率分析", "传递函数", "最小相位"],
    date: "2026-08-16",
    excerpt:
      "最小相位系统是经典自动控制原理频率分析法的基石。本文系统梳理比例、积分、微分、惯性、一阶微分、振荡、二阶微分等最小相位环节的传递函数、幅频特性与相频特性，并总结其共性规律。",
    file: "posts/minimum-phase-elements.md",
  },
  {
    id: "hello-world",
    title: "欢迎来到我的博客",
    category: "随笔",
    tags: ["博客", "随笔"],
    date: "2026-08-16",
    excerpt:
      "这是博客的第一篇文章。我搭建了这个静态博客，记录技术、生活与思考，希望这里能成为我沉淀内容的一方小天地。",
    file: "posts/hello-world.md",
  },
  {
    id: "build-static-blog",
    title: "零服务器搭建静态博客全攻略",
    category: "技术",
    tags: ["静态博客", "HTML", "CSS", "JavaScript"],
    date: "2026-08-10",
    excerpt:
      "为什么选择静态博客？如何用 HTML、CSS、JavaScript 在几分钟内搭建一个快速、安全、免费托管的博客站点？本文手把手教你。",
    file: "posts/build-static-blog.md",
  },
  {
    id: "css-grid-layout",
    title: "用 CSS Grid 打造响应式卡片布局",
    category: "前端",
    tags: ["CSS", "Grid", "布局", "响应式"],
    date: "2026-07-28",
    excerpt:
      "CSS Grid 是现代布局的利器。这篇文章用简单的几行代码，实现自动适配不同屏幕尺寸的卡片网格布局。",
    file: "posts/css-grid-layout.md",
  },
  {
    id: "js-array-methods",
    title: "JavaScript 数组方法实用指南",
    category: "前端",
    tags: ["JavaScript", "数组", "前端"],
    date: "2026-07-15",
    excerpt:
      "map、filter、reduce、find……这些数组方法是日常开发的高频工具。用实际例子一次讲清楚它们的用法与区别。",
    file: "posts/js-array-methods.md",
  },
  {
    id: "learning-notes",
    title: "编程新手的学习方法与心路历程",
    category: "随笔",
    tags: ["学习", "经验", "编程"],
    date: "2026-06-30",
    excerpt:
      "从零基础到能独立完成项目，我踩过不少坑。分享几条让我受益最大的学习经验，送给正在路上的你。",
    file: "posts/learning-notes.md",
  },
  {
    id: "github-pages-deploy",
    title: "用 GitHub Pages 免费部署你的网站",
    category: "技术",
    tags: ["GitHub Pages", "部署", "免费托管"],
    date: "2026-06-12",
    excerpt:
      "不花一分钱，把静态网站托管到 GitHub Pages，并绑定自己的域名。详细的图文步骤在这里。",
    file: "posts/github-pages-deploy.md",
  },
  {
    id: "blog-test",
    title: "测试博客",
    category: "技术",
    tags: ["测试"],
    date: "2026-08-16",
    excerpt:
      "测试博客的发布流程",
    file: "posts/blog-test.md",
  },
];
