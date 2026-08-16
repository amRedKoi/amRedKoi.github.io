/** 临时脚本：验证 Node 端（feed 生成路径）主引擎是否生效，验证后删除 */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const render = require("../assets/js/markdown.js");

const md = [
  "inline $a^2 + b^2 = c^2$",
  "",
  "$$",
  "\\int_0^1 x \\, dx = \\frac{1}{3}",
  "$$",
  "",
  "**bold** and `code`",
].join("\n");

const html = render(md);
console.log("katex inline:", html.includes('class="katex"'));
console.log("katex-display:", html.includes("katex-display"));
console.log("math-display wrapper:", html.includes('class="math-display"'));
console.log("strong:", html.includes("<strong>"));
console.log("---");
console.log(html.slice(0, 260));
