/**
 * 站点交互脚本：主题切换、项目渲染、文章渲染、搜索、分类筛选、详情页
 */

const state = {
  category: "全部",
  keyword: "",
};

/** 获取 URL 查询参数 */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---------- 主题切换 ---------- */
const THEME_KEY = "amredkoi-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  const btn = document.querySelector("#theme-toggle");
  if (!btn) return;
  const isDark = theme === "dark";
  const use = btn.querySelector(".icon use");
  if (use) use.setAttribute("href", `assets/icons.svg#icon-${isDark ? "sun" : "moon"}`);
  const label = btn.querySelector(".label");
  if (label) label.textContent = isDark ? "浅色模式" : "深色模式";
  btn.setAttribute("aria-label", isDark ? "切换到浅色模式" : "切换到深色模式");

  // 图标切换动画：移除后强制重排再添加，保证动画重新触发
  const icon = btn.querySelector(".icon");
  if (icon) {
    icon.classList.remove("spin");
    void icon.getBoundingClientRect();
    icon.classList.add("spin");
  }
}

function initTheme() {
  let saved = null;
  try {
    saved = localStorage.getItem(THEME_KEY);
  } catch (e) {
    /* ignore */
  }
  const prefersDark =
    window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(saved || (prefersDark ? "dark" : "light"));

  const btn = document.querySelector("#theme-toggle");
  if (btn) {
    btn.addEventListener("click", () => {
      const next =
        document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch (e) {
        /* ignore */
      }
    });
  }
}

/* ---------- 项目渲染 ---------- */
function renderProjects() {
  const container = document.querySelector("#projects");
  if (!container) return;
  container.innerHTML = (window.projects || [])
    .map(
      (p) => `
      <div class="project-card">
        <div class="project-icon">${p.icon ? `<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${p.icon}"></use></svg>` : ""}</div>
        <h3>${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">${p.name}</a>` : p.name}</h3>
        <p>${p.desc}</p>
        <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </div>
    `
    )
    .join("");
}

/** 格式化日期为 YYYY年M月D日 */
function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 生成分类 chips */
function renderFilters(container, active) {
  const categories = ["全部", ...new Set(window.posts.map((p) => p.category))];
  container.innerHTML = categories
    .map(
      (c) =>
        `<button class="chip ${c === active ? "active" : ""}" data-category="${c}">${c}</button>`
    )
    .join("");

  container.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    container.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderPosts();
  });
}

/** 渲染文章卡片 */
function renderPosts() {
  const grid = document.querySelector(".posts");
  const empty = document.querySelector(".empty");
  if (!grid) return;

  const keyword = state.keyword.trim().toLowerCase();
  const filtered = window.posts.filter((p) => {
    const matchCat = state.category === "全部" || p.category === state.category;
    const matchKey =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      p.excerpt.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword);
    return matchCat && matchKey;
  });

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (empty) empty.classList.add("show");
    return;
  }

  if (empty) empty.classList.remove("show");

  grid.innerHTML = filtered
    .map(
      (p) => `
      <article class="card">
        <div class="meta">
          <span class="category">${p.category}</span>
          <time datetime="${p.date}">${formatDate(p.date)}</time>
        </div>
        <h2><a href="post.html?id=${p.id}">${p.title}</a></h2>
        <p class="excerpt">${p.excerpt}</p>
      </article>
    `
    )
    .join("");
}

/** 渲染详情页 */
function renderPost() {
  const id = getParam("id");
  const container = document.querySelector(".article-body");
  const post = window.posts.find((p) => p.id === id);

  if (!container) return;

  if (!post) {
    container.innerHTML = `
      <h2>文章不存在或已删除</h2>
      <p>你访问的文章似乎不存在。</p>
      <p><a class="back-link" href="index.html">
        <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-arrow-left"></use></svg>
        返回首页
      </a></p>
    `;
    document.title = "文章未找到";
    return;
  }

  document.title = post.title + " · amRedKoi";
  document.querySelector("#post-title").textContent = post.title;
  document.querySelector("#post-category").textContent = post.category;
  document.querySelector("#post-date").textContent = formatDate(post.date);
  container.innerHTML = post.content;
}

/* ---------- 打字机标语（首页 Hero） ---------- */
const TYPEWRITER_PHRASES = [
  "用代码把想法变成现实",
  "让系统收敛到稳定",
  "调参一时爽，调通一直爽",
  "在反馈与控制里修行",
  "记录成长，分享热爱",
  "慢一点，也没关系",
  "今天也要好好生活",
];

function initTypewriter() {
  const el = document.querySelector("#typewriter");
  if (!el) return;
  let phraseIdx = 0;
  let charIdx = 0;
  let deleting = false;

  function tick() {
    const phrase = TYPEWRITER_PHRASES[phraseIdx];
    charIdx += deleting ? -1 : 1;
    el.textContent = phrase.slice(0, charIdx);

    let delay = deleting ? 45 : 90;
    if (!deleting && charIdx === phrase.length) {
      delay = 1800; // 打完停留
      deleting = true;
    } else if (deleting && charIdx === 0) {
      deleting = false;
      phraseIdx = (phraseIdx + 1) % TYPEWRITER_PHRASES.length;
      delay = 400; // 换句停顿
    }
    setTimeout(tick, delay);
  }
  tick();
}

/* ---------- 每日一句（侧栏） ---------- */
const DAILY_QUOTES = [
  "种一棵树最好的时间是十年前，其次是现在。",
  "保持好奇，世界会为你让路。",
  "慢即是快，少即是多。",
  "把热爱做成习惯，把坚持做成日常。",
  "解决问题的第一步，是开始。",
  "你今天所有的积累，都在为未来的自己铺路。",
  "与其等待灵感，不如持续行动。",
  "好的代码，是写给未来同事的情书。",
];

function initDailyQuote() {
  const el = document.querySelector("#daily-quote");
  if (!el) return;
  // 以当天日期为种子，保证每天同一句、不随机跳动
  const now = new Date();
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  el.textContent = DAILY_QUOTES[seed % DAILY_QUOTES.length];
}

/* ---------- 移动端侧栏抽屉 ---------- */
function initSidebarDrawer() {
  const btn = document.querySelector("#menu-toggle");
  const sidebar = document.querySelector("#sidebar");
  if (!btn || !sidebar) return;

  // 动态创建遮罩
  let overlay = document.querySelector(".sidebar-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.className = "sidebar-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
  }

  const open = () => {
    sidebar.classList.add("open");
    overlay.classList.add("open");
    btn.setAttribute("aria-expanded", "true");
    btn.setAttribute("aria-label", "关闭菜单");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    btn.setAttribute("aria-label", "打开菜单");
    document.body.style.overflow = "";
  };

  btn.addEventListener("click", () => {
    if (sidebar.classList.contains("open")) close();
    else open();
  });

  overlay.addEventListener("click", close);

  // 点击抽屉内的链接后自动关闭
  sidebar.addEventListener("click", (e) => {
    if (e.target.closest("a")) close();
  });

  // Esc 关闭
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar.classList.contains("open")) close();
  });

  // 拉伸到桌面宽度时复位
  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) {
      close();
      // 复位可能残留的 body overflow
      document.body.style.overflow = "";
    }
  });
}

/* ---------- 回到顶部 ---------- */
function initBackToTop() {
  const btn = document.querySelector("#back-to-top");
  if (!btn) return;

  const update = () => {
    btn.classList.toggle("show", window.scrollY > 300);
  };
  update();
  window.addEventListener("scroll", update, { passive: true });

  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/** 初始化首页 */
function initHome() {
  renderProjects();

  const filterBox = document.querySelector(".filters");
  if (filterBox) {
    renderFilters(filterBox, state.category);
  }
  renderPosts();

  const input = document.querySelector("#search-input");
  if (input) {
    input.addEventListener("input", (e) => {
      state.keyword = e.target.value;
      renderPosts();
    });
  }
}

/* 根据当前页面初始化 */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initSidebarDrawer();
  initDailyQuote();
  initBackToTop();
  if (document.body.dataset.page === "home") {
    initTypewriter();
    initHome();
  } else if (document.body.dataset.page === "post") {
    renderPost();
  }
});
