/**
 * 站点全局数据（个人资料 / 经历时间线 / 动态 / 资源 / 站点统计）
 * 所有展示数据集中在这里，修改后即可同步到首页、博客页与资源页。
 */
window.siteData = {
  /* ---------- 个人信息（首页「关于我」区块） ---------- */
  profile: {
    name: "amRedKoi",
    nickname: "锦鲤",
    avatar: "assets/favicon.svg",
    bio: "我是一名独立开发者，欢迎来到我的博客。",
    birthYear: 2003, // 出生年份：用于自动计算年龄，请按实际情况修改
    info: [
      { icon: "icon-cake", label: "生日", value: "8 August."/*"8 月 8 日"*/ },
      { icon: "icon-award", label: "年龄", value: "Secret"/*"{{age}}"*/ },
      // { icon: "icon-calendar", label: "星座", value: "天蝎座" },
      { icon: "icon-map-pin", label: "坐标", value: "湖北 · 十堰" },
      { icon: "icon-heart", label: "喜好", value: " 编程 / 音乐 / 摄影" },
      // { icon: "icon-graduation-cap", label: "目标", value: "控制科学与工程研究生" },
    ],
    tags: [ "C语言", "Python",  "JavaScript","自动控制原理","静态博客"],
    motto: {
      text: "种一棵树最好的时间是十年前，其次是现在。",
      source: "丹比萨·莫约《援助的死亡》",
    },
    socials: [
      { icon: "icon-github", label: "GitHub", url: "https://github.com/amRedKoi" },
      { icon: "icon-mail", label: "邮箱", url: "mailto:jjjgml@qq.com" },
    ],
  },

  /* ---------- 经历时间线（首页「我的经历」区块） ---------- */
  timeline: [
    {
      year: "2022",
      icon: "icon-lightbulb",
      title: "第一次接触编程",
      desc: "用 Python 写出了第一行 print('Hello World')，从此打开新世界的大门，开始自学编程基础。",
    },
    {
      year: "2023",
      icon: "icon-book",
      title: "系统学习自动控制原理",
      desc: "被反馈控制的魅力吸引，开始系统学习经典控制理论：时域分析、根轨迹、频率响应。",
    },
    {
      year: "2024",
      icon: "icon-target",
      title: "决定备考控制科学与工程",
      desc: "立下目标，进入备考节奏：数学、英语、政治、专业课四线并进，建立自己的知识体系。",
    },
    {
      year: "2025",
      icon: "icon-cpu",
      title: "开始独立开发项目",
      desc: "用 JavaScript 写了 PID 仿真、Bode 图绘制器等交互小工具，把理论变成可以动手玩的模型。",
    },
    {
      year: "2026",
      icon: "icon-award",
      title: "搭建个人小站",
      desc: "零服务器搭建了这个静态博客，开始记录学习笔记、技术文章与生活动态，持续沉淀。",
    },
  ],

  /* ---------- 站内通知（博客页顶部滚动公告，从右到左循环滚动） ---------- */
  notice: "小站已全新改版：新增动态、标签云与分页浏览；欢迎在评论区留言交流，或到 GitHub 提建议～",

  /* ---------- 动态（博客页「朋友圈」区块） ---------- */
  moments: [
    {
      id: 1,
      author: "amRedKoi",
      avatar: "assets/favicon.svg",
      time: "2 天前",
      text: "把 Bode 图绘制器重写了一遍：支持多环节叠加、自定义配色、深浅主题自适应，顺便修了手机端溢出的 bug 🐟",
      images: [],
      likes: 6,
      comments: [
        { author: "小锦", text: "图好漂亮！求教程" },
        { author: "阿控", text: "手机端那个 bug 修得好" },
      ],
    },
    {
      id: 2,
      author: "amRedKoi",
      avatar: "assets/favicon.svg",
      time: "1 周前",
      text: "种一棵树最好的时间是十年前，其次是现在。今天开始系统整理最小相位环节的知识点，做成一篇文章。",
      images: [],
      likes: 12,
      comments: [
        { author: "学习搭子", text: "这句话也是我的座右铭！" },
      ],
    },
    {
      id: 3,
      author: "amRedKoi",
      avatar: "assets/favicon.svg",
      time: "3 周前",
      text: "小站上线啦！零服务器、纯静态，用 HTML + CSS + JS 搭的，托管在 GitHub Pages 上。以后就在这里记录学习和生活。",
      images: [],
      likes: 24,
      comments: [
        { author: "路人甲", text: "恭喜开站！" },
        { author: "同学小赵", text: "博客很好看，加油！" },
      ],
    },
  ],

  /* ---------- 模型（资源页「模型」分组，右侧目录与锚点） ----------
   * id 需与 resources.html 中对应子块的 id 一致。
   */
  models: [
    {
      id: "pid-sim",
      name: "PID 闭环实时仿真",
      icon: "icon-sliders",
      desc: "交互式调整 Kp / Ki / Kd，实时观察阶跃 / 正弦 / 扰动响应。",
      target: "resources.html#pid-sim",
    },
    {
      id: "bode-plot",
      name: "Bode 图绘制器",
      icon: "icon-activity",
      desc: "零依赖 Canvas 绘制 Bode 图，支持多环节叠加与自定义参数。",
      target: "resources.html#bode-plot",
    },
  ],

  /* ---------- 资源（首页预览） ----------
   * 首页「资源与模型」区的预览卡片，target 指向 resources.html 中的锚点：
   *   #pid-sim      PID 闭环实时仿真（模型分组内）
   *   #bode-plot    Bode 图绘制器（模型分组内）
   *   #journals     顶刊（网址分组内，由 linkGroups 动态渲染）
   *   #projects     项目展示
   */
  resources: [
    {
      id: "pid-sim",
      name: "PID 闭环实时仿真",
      desc: "交互式调整 Kp / Ki / Kd，实时观察阶跃 / 正弦 / 扰动响应。",
      icon: "icon-sliders",
      tags: ["交互模型", "控制"],
      target: "resources.html#pid-sim",
    },
    {
      id: "bode-plot",
      name: "Bode 图绘制器",
      desc: "零依赖 Canvas 绘制 Bode 图，支持多环节叠加与自定义参数。",
      icon: "icon-activity",
      tags: ["频率分析", "Canvas"],
      target: "resources.html#bode-plot",
    },
    {
      id: "journals",
      name: "控制领域顶刊",
      desc: "常用控制类期刊入口收藏，方便检索文献。",
      icon: "icon-book",
      tags: ["文献", "期刊"],
      target: "resources.html#journals",
    },
    {
      id: "projects",
      name: "项目展示",
      desc: "我参与开发的一些小项目，欢迎交流。",
      icon: "icon-cpu",
      tags: ["作品集"],
      target: "resources.html#projects",
    },
  ],

  /* ---------- 网址 / 链接收藏（资源页「网址」分组） ----------
   * 每个对象对应一个可扩展的子块：id 用作锚点，items 为该子块下的网址列表。
   * 可按类型追加其他网址陈列（期刊 / 工具 / 社区等）。
   */
  linkGroups: [
    {
      id: "journals",
      icon: "icon-book",
      title: "控制领域期刊",
      desc: "常用控制类期刊入口收藏，方便检索文献。",
      items: [
        { name: "IEEE Transactions on Automatic Control", url: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=9" },
        { name: "Automatica", url: "https://www.sciencedirect.com/journal/automatica" },
        { name: "IEEE/CAA Journal of Automatica Sinica", url: "https://www.ieee-jas.net/" },
        { name: "IEEE Transactions on Control Systems Technology", url: "https://ieeexplore.ieee.org/xpl/RecentIssue.jsp?punumber=87" },
        { name: "自动化学报", url: "http://www.aas.net.cn/" },
        { name: "控制与决策", url: "http://kzyjc.alljournals.cn/" },
      ],
    },
    {
      id: "chem-journals",
      icon: "icon-flask",
      title: "化学期刊",
      desc: "常用化学类期刊入口收藏，方便检索文献。",
      items: [
        { name: "Nature Chemistry", url: "https://www.nature.com/nchem/" },
        { name: "Journal of the American Chemical Society", url: "https://pubs.acs.org/journal/jacsat" },
        { name: "Angewandte Chemie International Edition", url: "https://onlinelibrary.wiley.com/journal/15213773" },
        { name: "Chemical Reviews", url: "https://pubs.acs.org/journal/chreay" },
        { name: "Science Advances", url: "https://www.science.org/journal/sciadv" },
        { name: "化学学报", url: "http://www.hxxb.org.cn/" },
      ],
    },
  ],

  /* ---------- 站点统计（首页「关于本站」区块） ---------- */
  site: {
    /* 建站日期（用于计算建站时长） */
    launchDate: "2026-06-12",
    /* 访问量基数：无后端情况下在 localStorage 基础上叠加展示 */
    visitBase: 1024,
    /* 关于本站的一句话 */
    aboutText:
      "这是一个由 HTML + CSS + JavaScript 构建的零服务器静态博客，托管于 GitHub Pages。所有代码开源，欢迎访问交流。",
  },
};
