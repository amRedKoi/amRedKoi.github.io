/**
 * 从 assets/js/posts.js 读取文章数据，生成 feed.xml 与 sitemap.xml。
 *
 * 用法：
 *   node scripts/generate-feed.mjs
 *
 * 该脚本在 GitHub Actions 中于每次推送到 main 时自动运行，
 * 也可在本地手动运行，用于新增文章后刷新订阅/收录文件。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const require = createRequire(import.meta.url);
const renderMarkdown = require("../assets/js/markdown.js");

const SITE_URL = "https://amRedKoi.github.io";
const SITE_NAME = "amRedKoi 个人小站";
const SITE_DESC =
  "amRedKoi 的个人小站，记录科研、生活与随笔，分享控制科学与工程领域的学习笔记与项目。";
const AUTHOR = "amRedKoi";

/**
 * 将 JS 日期字符串（YYYY-MM-DD）转换为 RFC 2822 格式，
 * 供 RSS <pubDate> 使用。
 */
function toRFC2822(dateStr) {
  const d = new Date(`${dateStr}T00:00:00+08:00`);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`无效日期：${dateStr}`);
  }
  return d.toUTCString();
}

/** 简单 XML 转义。 */
function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * 将内容放入 CDATA 段。
 * 原文中若出现 "]]>" 需拆分为两个 CDATA，避免提前结束。
 */
function cdata(str) {
  return `<![CDATA[${String(str).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** 去掉正文 HTML 标签，得到纯文本摘要（用于 RSS description）。 */
function stripHtml(html) {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * 读取并解析 assets/js/posts.js。
 * 文件形如 `window.posts = [...]`，用 vm 在沙箱中执行以取出数组。
 */
function loadPosts() {
  const file = join(ROOT, "assets", "js", "posts.js");
  const code = readFileSync(file, "utf8");
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(code, sandbox, { filename: "posts.js" });
  const posts = sandbox.window.posts;
  if (!Array.isArray(posts)) {
    throw new Error("未能从 posts.js 中解析出 window.posts 数组");
  }
  // 按日期倒序，最新的排最前（RSS 规范要求）
  return [...posts].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

/**
 * 读取文章正文并渲染为 HTML。
 * 优先级：内联 content（HTML）> 文件 file（Markdown）。
 */
function loadPostBody(p) {
  if (p.content) {
    return { html: p.content };
  }
  if (p.file) {
    const file = join(ROOT, p.file);
    const md = readFileSync(file, "utf8");
    return { html: renderMarkdown(md) };
  }
  return { html: "" };
}

function buildFeed(posts) {
  const now = new Date().toUTCString();
  const items = posts
    .map((p) => {
      const url = `${SITE_URL}/post.html?id=${encodeURIComponent(p.id)}`;
      const body = loadPostBody(p);
      const desc = p.excerpt || stripHtml(body.html);
      const contentEncoded = body.html;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${esc(url)}</link>
      <guid isPermaLink="false">${esc(p.id)}</guid>
      <pubDate>${toRFC2822(p.date)}</pubDate>
      <category>${esc(p.category || "")}</category>
      <description>${esc(desc)}</description>
      <content:encoded>${cdata(contentEncoded)}</content:encoded>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_NAME)}</title>
    <link>${esc(SITE_URL)}/</link>
    <description>${esc(SITE_DESC)}</description>
    <language>zh-CN</language>
    <lastBuildDate>${now}</lastBuildDate>
    <atom:link href="${esc(SITE_URL)}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>
`;
}

function buildSitemap(posts) {
  const now = new Date().toISOString().slice(0, 10);
  const entries = [
    { url: `${SITE_URL}/index.html`, lastmod: now, freq: "weekly", prio: "1.0" },
    { url: `${SITE_URL}/about.html`, lastmod: now, freq: "monthly", prio: "0.6" },
  ];
  for (const p of posts) {
    entries.push({
      url: `${SITE_URL}/post.html?id=${encodeURIComponent(p.id)}`,
      lastmod: p.date,
      freq: "yearly",
      prio: "0.8",
    });
  }
  const urls = entries
    .map(
      (e) => `  <url>
    <loc>${esc(e.url)}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.freq}</changefreq>
    <priority>${e.prio}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

const posts = loadPosts();
writeFileSync(join(ROOT, "feed.xml"), buildFeed(posts), "utf8");
writeFileSync(join(ROOT, "sitemap.xml"), buildSitemap(posts), "utf8");
console.log(`✔ 已生成 feed.xml 与 sitemap.xml（共 ${posts.length} 篇文章）`);
