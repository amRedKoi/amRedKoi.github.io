/**
 * 站点交互脚本：主题切换、项目渲染、文章渲染、搜索、分类筛选、详情页
 */

const state = {
  category: "全部",
  tag: "",
  keyword: "",
  page: 1,
};

/** 每页文章数 */
const PAGE_SIZE = 5;

/** 获取 URL 查询参数 */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ---------- 主题切换 ---------- */
const THEME_KEY = "amredkoi-theme";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  // 自定义主题色：随明暗模式重算 hover 等派生色
  if (customAccent) applyAccent(customAccent);
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

/* ---------- 自定义主题色（游客可在首页顶栏选择，localStorage 持久化） ---------- */
const ACCENT_KEY = "amredkoi-accent";
const ACCENT_PRESETS = [
  { name: "默认青绿", value: "#5f9a8a" },
  { name: "海雾蓝", value: "#6e8b9f" },
  { name: "陶土橙", value: "#b07d5f" },
  { name: "暮紫", value: "#8a7f9e" },
  { name: "苔绿", value: "#5f7f6e" },
  { name: "砖红", value: "#a05a5a" },
  { name: "砂金", value: "#b39a5e" },
  { name: "靛蓝", value: "#5b6d9e" },
];
let customAccent = null; // 当前生效的自定义主题色

function hexToRgb(hex) {
  const v = hex.replace("#", "");
  return {
    r: parseInt(v.slice(0, 2), 16),
    g: parseInt(v.slice(2, 4), 16),
    b: parseInt(v.slice(4, 6), 16),
  };
}

function shadeHex(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const t = percent < 0 ? 0 : 255;
  const p = Math.abs(percent) / 100;
  const f = (c) => Math.round((t - c) * p + c);
  const h = (x) => x.toString(16).padStart(2, "0");
  return `#${h(f(r))}${h(f(g))}${h(f(b))}`;
}

function applyAccent(hex) {
  customAccent = hex;
  const root = document.documentElement;
  const isDark = root.getAttribute("data-theme") === "dark";
  const { r, g, b } = hexToRgb(hex);
  const s = root.style;
  s.setProperty("--accent", hex);
  s.setProperty("--accent-hover", shadeHex(hex, isDark ? 12 : -12));
  s.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.14)`);
  s.setProperty("--card-hover", `rgba(${r}, ${g}, ${b}, 0.06)`);
  s.setProperty(
    "--logo-grad",
    `linear-gradient(135deg, ${shadeHex(hex, 10)}, ${hex} 55%, ${shadeHex(hex, 2)})`
  );
}

function clearAccent() {
  customAccent = null;
  const s = document.documentElement.style;
  [
    "--accent",
    "--accent-hover",
    "--accent-soft",
    "--card-hover",
    "--logo-grad",
  ].forEach((k) => s.removeProperty(k));
}

/* 全局应用已保存的主题色（无 UI 的页面也会执行，保证全站生效） */
function applySavedAccent() {
  let saved = null;
  try {
    saved = localStorage.getItem(ACCENT_KEY);
  } catch (e) {
    /* ignore */
  }
  if (saved) applyAccent(saved);
  return saved;
}

function initAccentPicker() {
  const saved = applySavedAccent();

  const toggle = document.querySelector("#accent-toggle");
  const panel = document.querySelector("#accent-panel");
  if (!toggle || !panel) return;

  const swatchesEl = document.querySelector("#accent-swatches");
  const colorInput = document.querySelector("#accent-color");
  const resetBtn = document.querySelector("#accent-reset");

  let current = saved || null;
  if (current) {
    colorInput.value = current;
  }

  const syncSelected = () => {
    swatchesEl.querySelectorAll(".accent-swatch").forEach((b) => {
      b.classList.toggle("selected", b.dataset.value === current);
    });
  };

  ACCENT_PRESETS.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "accent-swatch";
    b.title = p.name;
    b.dataset.value = p.value;
    b.setAttribute("role", "radio");
    b.style.setProperty("--swatch", p.value);
    b.addEventListener("click", () => {
      current = p.value;
      applyAccent(p.value);
      colorInput.value = p.value;
      syncSelected();
      try {
        localStorage.setItem(ACCENT_KEY, p.value);
      } catch (e) {
        /* ignore */
      }
    });
    swatchesEl.appendChild(b);
  });
  syncSelected();

  colorInput.addEventListener("input", () => {
    current = colorInput.value;
    applyAccent(colorInput.value);
    syncSelected();
    try {
      localStorage.setItem(ACCENT_KEY, colorInput.value);
    } catch (e) {
      /* ignore */
    }
  });

  resetBtn.addEventListener("click", () => {
    current = null;
    clearAccent();
    colorInput.value = "#5f9a8a";
    syncSelected();
    try {
      localStorage.removeItem(ACCENT_KEY);
    } catch (e) {
      /* ignore */
    }
  });

  const openPanel = (open) => {
    panel.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
  };

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    openPanel(panel.hidden);
  });

  document.addEventListener("click", (e) => {
    if (!panel.hidden && !panel.contains(e.target) && e.target !== toggle) {
      openPanel(false);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !panel.hidden) openPanel(false);
  });
}

/* ---------- 项目渲染（竖排卡片，支持图片） ---------- */
function renderProjects() {
  const container = document.querySelector("#projects-list, .projects");
  if (!container) return;
  container.innerHTML = (window.projects || [])
    .map(
      (p, i) => `
      <article class="project-card" id="project-${i}" style="--reveal-delay:${Math.min(i, 5) * 0.08}s">
        ${p.image
          ? `<img class="project-cover" src="${p.image}" alt="${p.name}" loading="lazy">`
          : `<div class="project-icon">${p.icon ? `<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${p.icon}"></use></svg>` : ""}</div>`}
        <div class="project-body">
          <h3>${p.link ? `<a href="${p.link}" target="_blank" rel="noopener">${p.name}</a>` : p.name}</h3>
          <p>${p.desc}</p>
          <div class="tags">${(p.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
        </div>
      </article>
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
    state.page = 1;
    container.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderPosts();
  });
}

/** 生成分页页码（含省略号窗口） */
function buildPageList(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const set = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const nums = [...set].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of nums) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

/** 渲染分页控件 */
function renderPagination(totalPages) {
  const nav = document.querySelector("#pagination");
  if (!nav) return;
  if (totalPages <= 1) {
    nav.hidden = true;
    return;
  }
  nav.hidden = false;
  nav.dataset.totalPages = String(totalPages);

  const pages = buildPageList(state.page, totalPages);
  let html = `<button class="page-btn" data-page="${state.page - 1}" ${state.page === 1 ? "disabled" : ""} aria-label="上一页">‹</button>`;
  for (const p of pages) {
    if (p === "…") {
      html += `<span class="page-ellipsis">…</span>`;
    } else {
      html += `<button class="page-num ${p === state.page ? "active" : ""}" data-page="${p}" ${p === state.page ? 'aria-current="page"' : ""}>${p}</button>`;
    }
  }
  html += `<button class="page-btn" data-page="${state.page + 1}" ${state.page === totalPages ? "disabled" : ""} aria-label="下一页">›</button>`;
  nav.innerHTML = html;
}

/** 渲染标签云（聚合全部文章 tags） */
function renderTags() {
  const box = document.querySelector("#tag-cloud");
  if (!box || !window.posts) return;
  const counts = {};
  window.posts.forEach((p) =>
    (p.tags || []).forEach((t) => {
      counts[t] = (counts[t] || 0) + 1;
    })
  );
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (!entries.length) {
    box.innerHTML = '<p class="tag-empty">暂无标签</p>';
    return;
  }
  box.innerHTML = entries
    .map(
      ([t, c]) =>
        `<button class="tag-chip ${t === state.tag ? "active" : ""}" data-tag="${t}" type="button">${t}<span class="count">${c}</span></button>`
    )
    .join("");
}

/** 渲染文章卡片（分类 + 标签 + 搜索过滤，分页显示） */
function renderPosts() {
  const grid = document.querySelector(".posts");
  const empty = document.querySelector(".empty");
  if (!grid) return;

  const keyword = state.keyword.trim().toLowerCase();
  const filtered = window.posts.filter((p) => {
    const matchCat = state.category === "全部" || p.category === state.category;
    const matchTag = !state.tag || (p.tags || []).includes(state.tag);
    const matchKey =
      !keyword ||
      p.title.toLowerCase().includes(keyword) ||
      p.excerpt.toLowerCase().includes(keyword) ||
      p.category.toLowerCase().includes(keyword) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(keyword));
    return matchCat && matchTag && matchKey;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.page > totalPages) state.page = totalPages;

  if (filtered.length === 0) {
    grid.innerHTML = "";
    if (empty) empty.classList.add("show");
    renderPagination(totalPages);
    return;
  }

  if (empty) empty.classList.remove("show");

  const start = (state.page - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  grid.innerHTML = pageItems
    .map(
      (p) => `
      <article class="card">
        <div class="meta">
          <span class="category">${p.category}</span>
          <time datetime="${p.date}">${formatDate(p.date)}</time>
        </div>
        <h2><a href="post.html?id=${p.id}">${p.title}</a></h2>
        <p class="excerpt">${p.excerpt}</p>
        ${(p.tags || []).length ? `<div class="card-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
      </article>
    `
    )
    .join("");

  renderPagination(totalPages);
}

/** 渲染详情页：优先使用内联 content（HTML），否则加载 Markdown 文件 */
async function renderPost() {
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

  try {
    if (post.content) {
      // 兼容：直接内联的 HTML
      container.innerHTML = post.content;
      enhanceCodeBlocks(container);
    } else if (post.file) {
      // Markdown 文件：posts/xxx.md
      const res = await fetch(post.file);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const md = await res.text();
      container.innerHTML = renderMarkdown(md);
      enhanceCodeBlocks(container);
    } else {
      throw new Error("该文章未配置正文内容");
    }
    // 根据正文标题生成右侧大纲
    buildPostToc(container);
  } catch (err) {
    container.innerHTML = `
      <p>正文加载失败（${err.message}）。</p>
      <p>请注意：通过 <code>file://</code> 直接打开 HTML 时浏览器禁止 <code>fetch</code>，请使用本地服务器访问，例如 <code>python -m http.server</code> 或 <code>npx serve</code>。</p>
    `;
  }
}

/* ---------- 文档页：渲染 docs/技术文档.md（复用 A4 布局与大纲） ---------- */
async function renderDocs() {
  const container = document.querySelector(".article-body");
  if (!container) return;
  try {
    const res = await fetch("docs/技术文档.md");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const md = await res.text();
    container.innerHTML = renderMarkdown(md);
    enhanceCodeBlocks(container);
    buildPostToc(container);
  } catch (err) {
    container.innerHTML = `
      <p>文档加载失败（${err.message}）。</p>
      <p>请注意：通过 <code>file://</code> 直接打开 HTML 时浏览器禁止 <code>fetch</code>，请使用本地服务器访问，例如 <code>python -m http.server</code>。</p>
    `;
  }
}

/* ---------- 文章页：根据正文标题自动生成右侧大纲（可点击、滚动高亮） ---------- */
function buildPostToc(container) {
  const wrap = document.querySelector(".post-toc");
  const list = wrap && wrap.querySelector("#post-toc-list");
  if (!wrap || !list) return;

  const headings = Array.from(container.querySelectorAll("h2, h3, h4"));
  if (!headings.length) {
    wrap.classList.add("hidden");
    return;
  }

  // 为每个标题生成唯一锚点 id（保留标题原文，便于分享 #标题）
  const used = new Set();
  headings.forEach((h) => {
    let base = (h.textContent || "").trim().replace(/\s+/g, "-") || "section";
    let id = base;
    let n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    h.id = id;
  });

  // 用 DOM API 构建列表，避免拼接 HTML 的转义问题
  const frag = document.createDocumentFragment();
  headings.forEach((h) => {
    const lvl = Number(h.tagName[1]);
    const cls = lvl === 2 ? "" : lvl === 3 ? " lv3" : " lv4";
    const a = document.createElement("a");
    a.className = "post-toc-item" + cls;
    a.href = "#" + h.id;
    a.textContent = h.textContent;
    frag.appendChild(a);
  });
  list.replaceChildren(frag);

  // 点击大纲：平滑滚动到对应标题，并更新 URL 锚点
  list.addEventListener("click", (e) => {
    const item = e.target.closest(".post-toc-item");
    if (!item) return;
    e.preventDefault();
    const id = decodeURIComponent(item.getAttribute("href").slice(1));
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    if (location.hash !== item.getAttribute("href")) {
      history.replaceState(null, "", item.getAttribute("href"));
    }
  });

  // scrollspy：滚动时高亮当前所在小节
  if (!("IntersectionObserver" in window)) return;
  const io = new IntersectionObserver(
    (entries) => {
      let best = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        if (!best || entry.boundingClientRect.top < best.boundingClientRect.top) {
          best = entry;
        }
      }
      if (!best) return;
      list.querySelectorAll(".post-toc-item").forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === `#${best.target.id}`)
      );
    },
    { rootMargin: "-20% 0px -65% 0px", threshold: 0 }
  );
  headings.forEach((h) => io.observe(h));
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
  // 每次加载随机展示一句
  const idx = Math.floor(Math.random() * DAILY_QUOTES.length);
  el.textContent = DAILY_QUOTES[idx];
}

/* ---------- 站内通知（博客页顶部滚动公告） ---------- */
function initNotice() {
  const track = document.querySelector("#notice-track");
  if (!track) return;
  const notice = window.siteData && window.siteData.notice;
  if (!notice) {
    const box = track.closest(".blog-notice");
    if (box) box.hidden = true;
    return;
  }
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const text = Array.isArray(notice) ? notice.join("　") : notice;
  const item = `<span class="notice-item">${esc(text)}</span>`;

  // 先拼出一段长度不少于视口宽度的单元，再复制一份组成无缝轨道
  const viewport = track.parentElement;
  const viewportW = viewport ? viewport.clientWidth : 600;
  let unit = item;
  track.innerHTML = unit;
  let guard = 0;
  while (track.scrollWidth < viewportW && guard < 20) {
    unit += item;
    track.innerHTML = unit;
    guard += 1;
  }
  track.innerHTML = unit + unit;
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

/* ---------- 阅读进度条（文章页） ---------- */
function initReadingProgress() {
  const bar = document.querySelector("#reading-progress");
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    bar.style.transform = "scaleX(" + ratio + ")";
  };
  update();
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
}

/* ---------- 代码块：语言标签 + 复制按钮 ---------- */
const CODE_LANG_LABELS = {
  js: "JavaScript", javascript: "JavaScript", jsx: "JSX", tsx: "TSX",
  ts: "TypeScript", typescript: "TypeScript",
  py: "Python", python: "Python",
  sh: "Bash", bash: "Bash", shell: "Shell", zsh: "Shell",
  json: "JSON",
  html: "HTML", htm: "HTML", xml: "XML", svg: "SVG",
  css: "CSS", scss: "SCSS", less: "Less",
  sql: "SQL",
  java: "Java",
  c: "C", h: "C", cpp: "C++", "c++": "C++", hpp: "C++",
  cs: "C#", csharp: "C#",
  go: "Go", golang: "Go",
  rust: "Rust", rs: "Rust",
  yaml: "YAML", yml: "YAML",
  md: "Markdown", markdown: "Markdown",
  plain: "Text", text: "Text", txt: "Text",
};

async function copyCode(text) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* 降级到 execCommand */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch (e) {
    return false;
  }
}

function enhanceCodeBlocks(container) {
  if (!container) return;
  container.querySelectorAll("pre").forEach((pre) => {
    if (pre.closest(".code-block")) return;
    const code = pre.querySelector("code");
    if (!code) return;
    let label = "代码";
    const m = code.className.match(/language-([\w+#.-]+)/);
    if (m) label = CODE_LANG_LABELS[m[1].toLowerCase()] || m[1];

    const wrapper = document.createElement("div");
    wrapper.className = "code-block";

    const head = document.createElement("div");
    head.className = "code-head";

    const lang = document.createElement("span");
    lang.className = "code-lang";
    lang.textContent = label;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "code-copy";
    btn.setAttribute("aria-label", "复制代码");
    btn.textContent = "复制";

    btn.addEventListener("click", async () => {
      const ok = await copyCode(code.textContent);
      btn.textContent = ok ? "已复制" : "失败";
      btn.classList.add("copied");
      setTimeout(() => {
        btn.textContent = "复制";
        btn.classList.remove("copied");
      }, 1600);
    });

    head.appendChild(lang);
    head.appendChild(btn);
    wrapper.appendChild(head);
    pre.parentNode.insertBefore(wrapper, pre);
    wrapper.appendChild(pre);
  });
}

/** 切换博客视图：文章 / 动态 */
function switchView(view) {
  const isPosts = view !== "moments";
  const postsView = document.querySelector("#view-posts");
  const momentsView = document.querySelector("#view-moments");
  if (!postsView || !momentsView) return;
  postsView.hidden = !isPosts;
  momentsView.hidden = isPosts;
  document.querySelectorAll("[data-view]").forEach((btn) => {
    const isActive = btn.dataset.view === view;
    btn.classList.toggle("active", isActive);
    if (btn.hasAttribute("role")) {
      btn.setAttribute("aria-selected", String(isActive));
    }
  });
  const hash = isPosts ? "#posts" : "#moments";
  if (window.location.hash !== hash) {
    history.replaceState(null, "", hash);
  }
}

/** 初始化博客页：分类、标签、搜索、分页、视图切换 */
function initBlog() {
  const filterBox = document.querySelector("#blog-filters");
  if (filterBox) {
    renderFilters(filterBox, state.category);
  }
  initNotice(); // 顶部滚动通知
  renderTags();
  renderPosts();

  const input = document.querySelector("#search-input");
  if (input) {
    input.addEventListener("input", (e) => {
      state.keyword = e.target.value;
      state.page = 1;
      renderPosts();
    });
  }

  // 标签云点击筛选
  const tagBox = document.querySelector("#tag-cloud");
  if (tagBox) {
    tagBox.addEventListener("click", (e) => {
      const chip = e.target.closest(".tag-chip");
      if (!chip) return;
      state.tag = state.tag === chip.dataset.tag ? "" : chip.dataset.tag;
      state.page = 1;
      renderTags();
      renderPosts();
    });
  }

  // 分页点击
  const pagination = document.querySelector("#pagination");
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-page]");
      if (!btn || btn.disabled) return;
      const totalPages = parseInt(pagination.dataset.totalPages || "1", 10);
      const target = parseInt(btn.dataset.page, 10);
      if (isNaN(target) || target < 1 || target > totalPages || target === state.page) return;
      state.page = target;
      renderPosts();
      const viewTop = document.querySelector("#view-posts").offsetTop - 120;
      window.scrollTo({ top: Math.max(0, viewTop), behavior: "smooth" });
    });
  }

  // 视图切换（文章 / 动态）
  document.querySelectorAll("[data-view]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(a.dataset.view);
    });
  });
  const initial = window.location.hash === "#moments" ? "moments" : "posts";
  switchView(initial);
  window.addEventListener("hashchange", () => {
    switchView(window.location.hash === "#moments" ? "moments" : "posts");
  });
}

/* ---------- 首页：关于我 ---------- */
/** 按出生年份计算周岁 */
function calcAge(birthYear) {
  if (!birthYear) return "";
  const now = new Date();
  let age = now.getFullYear() - birthYear;
  const birthdayThisYear = new Date(now.getFullYear(), 10, 26); // 10 月 26 日
  if (now < birthdayThisYear) age -= 1;
  return `${age} 岁`;
}

function renderProfile() {
  const p = window.siteData && window.siteData.profile;
  if (!p) return;
  const bio = document.querySelector("#about-bio");
  if (bio) bio.textContent = p.bio;

  const info = document.querySelector("#profile-info");
  if (info) {
    info.innerHTML = p.info
      .map((it) => {
        let value = it.value;
        if (value === "{{age}}") value = calcAge(p.birthYear);
        return `
        <li>
          <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${it.icon}"></use></svg>
          <span class="label">${it.label}</span>
          <span class="value">${value}</span>
        </li>
      `;
      })
      .join("");
  }

  const tags = document.querySelector("#home-tags");
  if (tags) {
    tags.innerHTML = (p.tags || [])
      .map((t) => `<span class="about-tag">${t}</span>`)
      .join("");
  }

  const socials = document.querySelector("#home-socials");
  if (socials) {
    socials.innerHTML = (p.socials || [])
      .map(
        (s) => `
        <a class="social-btn" href="${s.url}" target="_blank" rel="noopener" aria-label="${s.label}">
          <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${s.icon}"></use></svg>
        </a>
      `
      )
      .join("");
  }

  const motto = document.querySelector("#about-motto");
  if (motto && p.motto) {
    motto.innerHTML = `
      <span class="about-motto-mark" aria-hidden="true">“</span>
      <blockquote class="about-motto-text">${p.motto.text}</blockquote>
      <figcaption class="about-motto-source">— ${p.motto.source}</figcaption>
    `;
  }
}

/* ---------- 首页：经历时间线 ---------- */
function renderTimeline() {
  const container = document.querySelector("#timeline");
  const items = window.siteData && window.siteData.timeline;
  if (!container || !items) return;
  container.innerHTML =
    `<div class="timeline-progress" aria-hidden="true"><span class="timeline-progress-fill"></span></div>` +
    items
      .map(
        (it, i) => `
      <div class="timeline-item" style="--i:${i}">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <span class="timeline-year">${it.year}</span>
          <h3>${it.title}</h3>
          <p>${it.desc}</p>
        </div>
      </div>
    `
      )
      .join("");
}

/* ---------- 首页：资源预览 ---------- */
function renderHomeResources() {
  const container = document.querySelector("#home-resources");
  const items = window.siteData && window.siteData.resources;
  if (!container || !items) return;
  container.innerHTML = items
    .map(
      (r) => `
      <a class="home-resource-card" href="${r.target}">
        <div class="home-resource-icon">
          <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${r.icon}"></use></svg>
        </div>
        <h3>${r.name}</h3>
        <p>${r.desc}</p>
        <div class="tags">${(r.tags || []).map((t) => `<span class="tag">${t}</span>`).join("")}</div>
      </a>
    `
    )
    .join("");
}

/* ---------- 首页：最新文章卡片 ---------- */
function renderHomePosts() {
  const container = document.querySelector("#home-posts");
  if (!container || !window.posts) return;
  const latest = window.posts.slice(0, 3);
  container.innerHTML = latest
    .map(
      (p) => `
      <a class="home-post-card" href="post.html?id=${p.id}">
        <div class="meta">
          <span class="category">${p.category}</span>
          <time datetime="${p.date}">${formatDate(p.date)}</time>
        </div>
        <h3>${p.title}</h3>
        <p>${p.excerpt}</p>
      </a>
    `
    )
    .join("");
}

/* ---------- 首页：关于本站统计 ---------- */
function formatDuration(ms) {
  const totalDays = Math.max(1, Math.floor(ms / 86400000));
  const years = Math.floor(totalDays / 365);
  const days = totalDays % 365;
  return years > 0 ? `${years} 年 ${days} 天` : `${totalDays} 天`;
}

function computeSiteStats() {
  const s = window.siteData && window.siteData.site;
  if (!s) return;
  const desc = document.querySelector("#site-desc");
  if (desc) desc.textContent = s.aboutText;

  // 建站时长
  const daysEl = document.querySelector("#stat-days");
  if (daysEl) {
    const launch = new Date(s.launchDate);
    daysEl.textContent = formatDuration(Date.now() - launch.getTime());
  }

  // 文章总数
  const postsEl = document.querySelector("#stat-posts");
  if (postsEl && window.posts) {
    postsEl.dataset.count = String(window.posts.length);
    postsEl.textContent = "0";
  }

  // 全站字数：统计所有文章标题与摘要字符数
  const wordsEl = document.querySelector("#stat-words");
  if (wordsEl && window.posts) {
    const words = window.posts.reduce(
      (sum, p) => sum + (p.title ? p.title.length : 0) + (p.excerpt ? p.excerpt.length : 0),
      0
    );
    wordsEl.dataset.count = String(words);
    wordsEl.textContent = "0";
  }

  // 访问量：localStorage 累计 + 基数
  const visitsEl = document.querySelector("#stat-visits");
  if (visitsEl) {
    let local = 0;
    try {
      local = parseInt(localStorage.getItem("amredkoi-visits") || "0", 10);
    } catch (e) {
      /* ignore */
    }
    visitsEl.dataset.count = String(s.visitBase + local);
    visitsEl.textContent = "0";
  }
}

/* ---------- 首页：滚动进入动画 + 统计数字滚动 ---------- */
function initReveal() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasIO = "IntersectionObserver" in window;

  // 统计数字：进入视口后从 0 滚动到目标值
  const counters = document.querySelectorAll(".home-stat-card [data-count]");
  const showFinal = () =>
    counters.forEach((el) => {
      el.textContent = Number(el.dataset.count).toLocaleString("zh-CN");
    });
  if (counters.length) {
    if (reduce || !hasIO) {
      showFinal();
    } else {
      counters.forEach((el) => {
        el.textContent = "0";
      });
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            animateCount(entry.target, Number(entry.target.dataset.count));
            io.unobserve(entry.target);
          }
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => io.observe(el));
    }
  }

  // 时间线进度条：进入视口后填充 + 节点依次点亮
  const tl = document.querySelector(".home-timeline");
  if (tl) {
    if (reduce || !hasIO) {
      tl.classList.add("filled");
    } else {
      const tio = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            tl.classList.add("filled");
            tio.unobserve(entry.target);
          }
        },
        { threshold: 0.18 }
      );
      tio.observe(tl);
    }
  }

  if (reduce || !hasIO) return;

  // 区块/卡片淡入上移（交错延迟）
  const stagger = (els, base, max) =>
    els.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--reveal-delay", `${Math.min(i, max) * base}s`);
    });
  stagger(document.querySelectorAll(".home-section-head"), 0.05, 3);
  stagger(document.querySelectorAll(".home-about-grid > *"), 0.12, 2);
  stagger(document.querySelectorAll(".timeline-item"), 0.08, 5);
  stagger(document.querySelectorAll(".home-resource-card"), 0.08, 3);
  stagger(document.querySelectorAll(".home-post-card"), 0.08, 3);
  stagger(document.querySelectorAll(".home-stat-card"), 0.1, 3);

  const els = document.querySelectorAll(".reveal");
  if (!els.length) return;
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("reveal-visible");
        io.unobserve(entry.target);
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
  );
  els.forEach((el) => io.observe(el));
}

function animateCount(el, target, duration = 1200) {
  const format = (n) => n.toLocaleString("zh-CN");
  const start = performance.now();
  const step = (now) => {
    const p = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = format(Math.round(target * eased));
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

/* ---------- 资源页：三个界面相互独立（Tab 切换）+ 右侧目录（仅「模型」） ---------- */
function initResourceNav() {
  const nav = document.querySelector("#resource-filters");
  const toc = document.querySelector("#resource-toc");
  const aside = document.querySelector(".blog-aside");
  const view = document.querySelector(".blog-view");
  if (!nav || !toc) return;

  const sd = window.siteData || {};
  const sections = ["models", "links", "projects"];

  /* 渲染右侧目录（仅模型有列表；网址 / 项目为独立界面，不显示目录） */
  function renderToc(cat) {
    if (cat !== "models") {
      if (aside) aside.classList.add("hidden");
      return;
    }
    if (aside) aside.classList.remove("hidden");
    const items = (sd.models || []).map((m) => ({ id: m.id, name: m.name }));
    toc.innerHTML = items.length
      ? items.map((it) => `<a class="resource-toc-item" href="#${it.id}">${it.name}</a>`).join("")
      : '<p class="tag-empty">暂无内容</p>';
  }

  /* 切换分类：更新 chip 高亮 + 只显示当前界面（其余隐藏）+ 渲染目录 */
  function setCategory(cat) {
    nav.querySelectorAll(".chip").forEach((c) =>
      c.classList.toggle("active", c.getAttribute("href") === `#${cat}`)
    );
    sections.forEach((s) => {
      const el = document.getElementById(s);
      if (el) el.classList.toggle("tab-hidden", s !== cat);
    });
    renderToc(cat);
    /* 界面从隐藏恢复后，触发 Canvas 重绘以匹配容器尺寸（PID / Bode） */
    requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  /* 平滑滚动到目标区块 */
  function smoothTo(id) {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* 判断锚点元素属于哪个独立界面 */
  function catOf(el) {
    for (const s of sections) {
      const sec = document.getElementById(s);
      if (sec && (sec === el || sec.contains(el))) return s;
    }
    return "models";
  }

  /* 点击分类 chip：切换到独立界面并回到内容区顶部 */
  nav.addEventListener("click", (e) => {
    const chip = e.target.closest("a.chip");
    if (!chip) return;
    const cat = chip.getAttribute("href").slice(1);
    setCategory(cat);
    e.preventDefault();
    if (view) view.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  /* 点击目录项：平滑滚动到对应子块 */
  toc.addEventListener("click", (e) => {
    const item = e.target.closest("a.resource-toc-item");
    if (!item) return;
    e.preventDefault();
    smoothTo(item.getAttribute("href").slice(1));
  });

  /* 初始界面：优先跟随 URL 锚点（如首页跳转 #pid-sim / #journals） */
  let initial = "models";
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) initial = catOf(el);
  }
  setCategory(initial);
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el && el.id !== initial) setTimeout(() => smoothTo(el.id), 80);
  }

  /* scrollspy：滚动时自动高亮目录项（仅模型子块参与） */
  const spyTargets = [];
  (sd.models || []).forEach((m) => {
    const el = document.getElementById(m.id);
    if (el) spyTargets.push(el);
  });

  if (!("IntersectionObserver" in window) || !spyTargets.length) return;

  const io = new IntersectionObserver(
    (entries) => {
      let best = null;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const top = entry.boundingClientRect.top;
        if (!best || top < best.top) best = { el: entry.target, top };
      }
      if (!best) return;
      toc.querySelectorAll(".resource-toc-item").forEach((a) =>
        a.classList.toggle("active", a.getAttribute("href") === `#${best.el.id}`)
      );
    },
    { rootMargin: "-15% 0px -70% 0px", threshold: 0 }
  );
  spyTargets.forEach((el) => io.observe(el));
}

/* ---------- 资源页：网址 / 链接分组渲染（数据驱动、可扩展） ---------- */
function renderLinkGroups() {
  const container = document.querySelector("#link-groups");
  const groups = window.siteData && window.siteData.linkGroups;
  if (!container || !groups || !groups.length) return;
  container.innerHTML = groups
    .map(
      (g) => `
      <section class="link-block" id="${g.id}">
        <div class="link-block-head">
          <svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#${g.icon}"></use></svg>
          <div>
            <h3>${g.title}</h3>
            ${g.desc ? `<p>${g.desc}</p>` : ""}
          </div>
        </div>
        <ul class="link-list">
          ${(g.items || [])
            .map(
              (it) => `
          <li><a href="${it.url}" target="_blank" rel="noopener">
            <span class="link-name">
              ${faviconFor(it.url)}
              <span>${it.name}</span>
            </span>
            <svg class="icon ext" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-external"></use></svg>
          </a></li>
        `
            )
            .join("")}
        </ul>
      </section>
    `
    )
    .join("");
}

/* 获取目标网站 favicon：多级来源依次尝试，命中即显示，全部失败则隐藏。
 * 1) 目标站自身 /favicon.ico（无需第三方）
 * 2) Google favicon 服务（覆盖广）
 * 3) DuckDuckGo 图标服务（兜底）
 */
function faviconFor(url) {
  let origin, host;
  try {
    origin = new URL(url).origin;
    host = new URL(url).hostname;
  } catch (e) {
    return "";
  }
  const fallbacks = [
    `${origin}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
  ];
  return `<img class="link-favicon" src="${fallbacks[0]}"
    data-fallbacks="${fallbacks.slice(1).join("\u0001")}"
    alt="" width="16" height="16" loading="lazy"
    onerror="window.faviconFallback&&faviconFallback(this)">`;
}

/* favicon 多级回退：onerror 时换下一个来源 */
window.faviconFallback = function (img) {
  const list = (img.getAttribute("data-fallbacks") || "").split("\u0001").filter(Boolean);
  if (list.length) {
    img.setAttribute("data-fallbacks", list.slice(1).join("\u0001"));
    img.src = list[0];
  } else {
    img.classList.add("broken");
  }
};

/* ---------- 博客页：动态（朋友圈） ---------- */
/** QQ 空间式九宫格：1 张大图 / 2 张并排 / 3 列网格；超过 9 张只显示前 9 张并叠加「+N」角标 */
function renderMoments() {
  const container = document.querySelector("#moments");
  const items = window.siteData && window.siteData.moments;
  if (!container || !items) return;

  const frag = document.createDocumentFragment();
  items.forEach((m) => {
    const card = document.createElement("article");
    card.className = "moment-card";

    const avatar = document.createElement("img");
    avatar.className = "moment-avatar";
    avatar.src = m.avatar || "";
    avatar.alt = `${m.author} 的头像`;
    avatar.loading = "lazy";

    const body = document.createElement("div");
    body.className = "moment-body";

    const head = document.createElement("div");
    head.className = "moment-head";
    const name = document.createElement("b");
    name.textContent = m.author || "";
    const time = document.createElement("time");
    time.textContent = m.time || "";
    head.append(name, time);

    const text = document.createElement("p");
    text.className = "moment-text";
    text.textContent = m.text || "";
    body.append(head, text);

    // 九宫格：最多渲染 9 张，第 9 张上叠加剩余数量角标
    const imgs = Array.isArray(m.images) ? m.images.filter(Boolean) : [];
    if (imgs.length) {
      const grid = document.createElement("div");
      grid.className = "moment-images";
      grid.dataset.count = String(Math.min(imgs.length, 9));
      grid.dataset.allImages = JSON.stringify(imgs); // 完整图片列表，相册翻看时使用
      imgs.forEach((src, i) => {
        if (i >= 9) return;
        const item = document.createElement("button");
        item.type = "button";
        item.className = "moment-img";
        item.dataset.index = String(i);
        item.setAttribute("aria-label", `查看第 ${i + 1} 张图片`);
        const img = document.createElement("img");
        img.src = src;
        img.alt = "";
        img.loading = "lazy";
        item.appendChild(img);
        if (imgs.length > 9 && i === 8) {
          const badge = document.createElement("span");
          badge.className = "moment-img-more";
          badge.textContent = `+${imgs.length - 9}`;
          item.appendChild(badge);
        }
        grid.appendChild(item);
      });
      body.appendChild(grid);
    }

    const foot = document.createElement("div");
    foot.className = "moment-foot";
    const like = document.createElement("button");
    like.type = "button";
    like.className = "moment-like";
    like.setAttribute("aria-label", "点赞");
    like.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-thumbs-up"></use></svg>';
    const likeNum = document.createElement("span");
    likeNum.textContent = String(m.likes || 0);
    like.appendChild(likeNum);

    const comments = document.createElement("span");
    comments.className = "moment-comments";
    comments.innerHTML =
      '<svg class="icon" aria-hidden="true" focusable="false"><use href="assets/icons.svg#icon-message-circle"></use></svg>';
    const commentNum = document.createElement("span");
    commentNum.textContent = String((m.comments || []).length);
    comments.appendChild(commentNum);
    foot.append(like, comments);
    body.appendChild(foot);

    if (m.comments && m.comments.length) {
      const list = document.createElement("div");
      list.className = "moment-comment-list";
      m.comments.forEach((c) => {
        const p = document.createElement("p");
        const b = document.createElement("b");
        b.textContent = c.author || "";
        p.append(b, document.createTextNode(`：${c.text || ""}`));
        list.appendChild(p);
      });
      body.appendChild(list);
    }

    card.append(avatar, body);
    frag.appendChild(card);
  });
  container.replaceChildren(frag);
}

/* ---------- 图片灯箱（相册）：文章图片 / 动态九宫格均可点开翻看 ---------- */
let lightboxEl = null;
let lightboxImages = [];
let lightboxIndex = 0;

function getLightbox() {
  if (lightboxEl) return lightboxEl;
  lightboxEl = document.createElement("div");
  lightboxEl.className = "lightbox";
  lightboxEl.setAttribute("role", "dialog");
  lightboxEl.setAttribute("aria-modal", "true");
  lightboxEl.innerHTML =
    '<button type="button" class="lightbox-close" aria-label="关闭">&times;</button>' +
    '<button type="button" class="lightbox-nav lightbox-prev" aria-label="上一张">&#10094;</button>' +
    '<img alt="">' +
    '<button type="button" class="lightbox-nav lightbox-next" aria-label="下一张">&#10095;</button>' +
    '<div class="lightbox-counter"></div>' +
    '<div class="lightbox-caption"></div>';
  document.body.appendChild(lightboxEl);

  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl || e.target.closest(".lightbox-close")) {
      closeLightbox();
    } else if (e.target.closest(".lightbox-prev")) {
      showLightboxImage(lightboxIndex - 1);
    } else if (e.target.closest(".lightbox-next")) {
      showLightboxImage(lightboxIndex + 1);
    }
  });
  document.addEventListener("keydown", (e) => {
    if (!lightboxEl.classList.contains("open")) return;
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowLeft") {
      showLightboxImage(lightboxIndex - 1);
    } else if (e.key === "ArrowRight") {
      showLightboxImage(lightboxIndex + 1);
    }
  });
  return lightboxEl;
}

function showLightboxImage(index) {
  if (!lightboxImages.length) return;
  lightboxIndex = (index + lightboxImages.length) % lightboxImages.length; // 循环翻看
  const lb = getLightbox();
  const lbImg = lb.querySelector("img");
  const item = lightboxImages[lightboxIndex];
  lbImg.src = item.src;
  lbImg.alt = item.alt || "";
  const counter = lb.querySelector(".lightbox-counter");
  counter.textContent = lightboxImages.length > 1 ? `${lightboxIndex + 1} / ${lightboxImages.length}` : "";
  const caption = lb.querySelector(".lightbox-caption");
  caption.textContent = item.alt || "";
  caption.style.display = item.alt ? "" : "none";
}

function openLightbox(items, index) {
  lightboxImages = items;
  lightboxIndex = index;
  showLightboxImage(lightboxIndex);
  getLightbox().classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("open");
  document.body.style.overflow = "";
}

function initLightbox() {
  // 事件委托：Markdown 异步渲染的图片、动态九宫格都能点击
  document.addEventListener("click", (e) => {
    const momentItem = e.target.closest(".moment-img");
    if (momentItem) {
      const grid = momentItem.closest(".moment-images");
      let all = [];
      try {
        all = JSON.parse(grid.dataset.allImages || "[]");
      } catch (e) {
        all = [];
      }
      if (!all.length) {
        all = Array.from(grid.querySelectorAll("img")).map((img) => img.src);
      }
      e.preventDefault();
      openLightbox(
        all.map((src) => ({ src, alt: "" })),
        Math.min(parseInt(momentItem.dataset.index || "0", 10), all.length - 1)
      );
      return;
    }
    const img = e.target.closest(".article-body img");
    if (!img || img.closest("a")) return; // 图片本身带链接时交给链接
    e.preventDefault();
    openLightbox([{ src: img.currentSrc || img.src, alt: img.alt || "" }], 0);
  });
}

/* ---------- 文章页：左上角返回上一页（站内进入时），直接打开则回首页 ---------- */
function initBackLink() {
  const link = document.getElementById("back-link");
  if (!link) return;
  const textEl = link.querySelector(".back-link-text");

  let fromSite = false;
  try {
    fromSite = !!document.referrer && new URL(document.referrer).origin === location.origin;
  } catch (e) {
    fromSite = false;
  }
  if (!fromSite) return; // 直接打开 / 从站外进入：保留「返回首页」

  if (textEl) textEl.textContent = "返回上一页";
  link.addEventListener("click", (e) => {
    e.preventDefault();
    if (history.length > 1) {
      history.back();
    } else {
      location.href = "blog.html"; // 极少数无历史记录时退回博客列表
    }
  });
}

/* ---------- 访问量统计（localStorage 累计） ---------- */
function bumpVisits() {
  try {
    const key = "amredkoi-visits";
    const cur = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, String(cur + 1));
  } catch (e) {
    /* ignore */
  }
}

/* 根据当前页面初始化 */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initAccentPicker();
  initSidebarDrawer();
  initDailyQuote();
  initBackToTop();
  initReadingProgress();
  initLightbox();

  const page = document.body.dataset.page;
  if (page === "home") {
    initTypewriter();
    renderProfile();
    renderTimeline();
    renderHomeResources();
    renderHomePosts();
    computeSiteStats();
    initReveal(); // 首页：滚动进入动画 + 数字滚动
  } else if (page === "blog") {
    initBlog(); // 文章列表 + 分类 + 标签 + 搜索 + 分页
    renderMoments(); // 动态朋友圈
  } else if (page === "resources") {
    renderProjects();
    renderLinkGroups(); // 网址分组（顶刊等，数据驱动渲染）
    initNotice(); // 顶部滚动通知（与博客页一致）
    initResourceNav(); // 分类锚点导航
  } else if (page === "post") {
    initBackLink();
    renderPost();
  } else if (page === "docs") {
    renderDocs(); // 技术文档：渲染 docs/技术文档.md
  }

  bumpVisits();
});
