/**
 * 临时脚本：用 vm 复现浏览器端全局环境（从 assets/vendor 加载
 * katex / markdown-it bundle），验证 window.renderMarkdown 主引擎路径。
 * 验证完删除。
 */
import { readFileSync } from "node:fs";
import vm from "node:vm";

const sandbox = { window: {}, console };
sandbox.self = sandbox.window;
sandbox.atob = (s) => Buffer.from(s, "base64").toString("binary");
sandbox.btoa = (s) => Buffer.from(s, "binary").toString("base64");
vm.createContext(sandbox);

vm.runInContext(readFileSync(new URL("../assets/vendor/katex/katex.min.js", import.meta.url), "utf8"), sandbox);
vm.runInContext(readFileSync(new URL("../assets/vendor/markdown-it/markdown-it.min.js", import.meta.url), "utf8"), sandbox);
// 浏览器中 self === globalThis === window：
//   katex.min.js 把全局挂到 self（= window），markdown-it 挂到 globalThis（= window）
// sandbox 里已设置 self = window，等价于浏览器。直接加载 markdown.js。
vm.runInContext(readFileSync(new URL("../assets/js/markdown.js", import.meta.url), "utf8"), sandbox);

// 调试：模拟 loadEngine 的判定逻辑
const dbg = vm.runInContext(`
  (function () {
    var out = {};
    out.requireType = typeof require;
    out.moduleType = typeof module;
    out.windowType = typeof window;
    out.g = (typeof window !== 'undefined') ? window : (typeof globalThis !== 'undefined' ? globalThis : null);
    out.mdType = out.g ? typeof out.g.markdownit : 'no-g';
    out.ktType = out.g ? typeof out.g.katex : 'no-g';
    if (out.g && out.g.markdownit && out.g.katex) {
      try {
        var inst = new out.g.markdownit({ html: false });
        out.construct = 'ok:' + typeof inst.render;
      } catch (e) {
        out.construct = 'ERR:' + e.message;
      }
    }
    return out;
  })()
`, sandbox);
console.log("debug loadEngine:", JSON.stringify(dbg));
console.log("renderMarkdown type:", typeof sandbox.window.renderMarkdown);

const r = sandbox.window.renderMarkdown;
console.log("typeof katex global:", typeof sandbox.window.katex);
console.log("typeof markdownit global:", typeof sandbox.window.markdownit);

const md = [
  "行内公式 $e^{i\\pi}+1=0$",
  "",
  "$$x=\\frac{-b\\pm\\sqrt{b^2-4ac}}{2a}$$",
  "",
  "**粗体** 与 `code` 与 \\$美元",
].join("\n");

const html = r(md);
console.log("has katex inline:", html.includes('class="katex"'));
console.log("has katex-display:", html.includes("katex-display"));
console.log("has math-display wrapper:", html.includes('class="math-display"'));
console.log("has <strong>:", html.includes("<strong>"));
console.log("escaped \\$:", html.includes("$美元") && !/katex[^>]*>\s*美元/.test(html));
console.log("--- output ---");
console.log(html.slice(0, 500));
