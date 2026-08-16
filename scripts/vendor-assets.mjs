/**
 * vendor-assets.mjs — 将 markdown-it 与 KaTeX 的浏览器资源复制到 assets/vendor/
 *
 * 用途：GitHub Pages 是纯静态托管，无法从 node_modules 直接引用，
 *       因此在部署前（或首次安装依赖后）运行本脚本，把第三方浏览器
 *       资源打包进仓库，保证页面与 feed 的公式渲染不依赖外部 CDN。
 *
 * 用法：node scripts/vendor-assets.mjs
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const entries = [
  {
    src: "node_modules/katex/dist/katex.min.css",
    dest: "assets/vendor/katex/katex.min.css",
  },
  {
    src: "node_modules/katex/dist/katex.min.js",
    dest: "assets/vendor/katex/katex.min.js",
  },
  {
    src: "node_modules/katex/dist/fonts",
    dest: "assets/vendor/katex/fonts",
  },
  {
    src: "node_modules/markdown-it/dist/browser/markdown-it.umd.min.js",
    dest: "assets/vendor/markdown-it/markdown-it.min.js",
  },
];

let ok = true;
for (const e of entries) {
  const s = join(ROOT, e.src);
  const d = join(ROOT, e.dest);
  if (!existsSync(s)) {
    console.warn(`[vendor] SKIP（未找到）：${e.src}，请先执行 pnpm install`);
    ok = false;
    continue;
  }
  mkdirSync(dirname(d), { recursive: true });
  if (existsSync(s) && (e.src.endsWith("fonts") || e.src.endsWith("dist"))) {
    // 目录整体复制（保留字体文件名，CSS 中按相对路径 fonts/ 引用）
    cpSync(s, d, { recursive: true, force: true });
  } else {
    cpSync(s, d, { force: true });
  }
  console.log(`[vendor] ${e.src} -> ${e.dest}`);
}

if (!ok) process.exitCode = 1;
