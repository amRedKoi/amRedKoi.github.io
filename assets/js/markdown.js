/**
 * markdown.js - Markdown 渲染器（markdown-it + KaTeX 主引擎，零依赖渲染器兜底）
 *
 * 渲染引擎优先级：
 *   1. markdown-it + KaTeX（页面加载 assets/vendor 下的第三方库，
 *      Node 环境自动 require 已安装的 npm 包）：完整 Markdown 语法，
 *      $...$ 行内公式、$$...$$ 独立行显示公式，公式由 KaTeX 排版；
 *   2. 内置零依赖渲染器（找不到 markdown-it / KaTeX 时自动回退，
 *      如直接双击打开 HTML 或离线环境），语法与下方列表一致。
 *
 * 支持的 Markdown 语法：
 *   - 标题（# ~ ######）
 *   - 段落、水平线
 *   - 粗体、斜体、删除线、行内代码
 *   - 链接、图片
 *   - 无序 / 有序列表（含两级嵌套）
 *   - 引用块
 *   - 代码块（``` 或 ~~~，支持语言标注）
 *   - LaTeX 公式（$...$ 行内、$$...$$ 独立行显示公式）
 *   - 转义字符（\*、\_、\`、\[、\] 等）
 *
 * 语法高亮：复用内置零依赖实现（Prism 风格最小实现），支持语言：
 *   javascript / typescript / jsx / tsx、html / xml / svg、
 *   css / scss / less、json、python、bash / shell、sql、
 *   java、c / cpp、csharp、go、rust、yaml；
 *   未识别语言按纯文本转义输出。
 *
 * 兜底公式渲染器（KaTeX 风格最小实现）：
 *   分数 \frac、根号 \sqrt[n]、上下标、求和/积分/极限上下限、
 *   \left \right 自适应括号、矩阵环境（pmatrix / bmatrix / vmatrix /
 *   cases 等）、希腊字母、常用运算符/箭头/关系符，
 *   以及 \text / \mathbf / \mathbb / \mathcal 等样式命令；
 *   未支持的 LaTeX 命令按原样显示，不会报错。
 *
 * 浏览器：window.renderMarkdown(mdString)
 * Node：const renderMarkdown = require("./assets/js/markdown.js")
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.renderMarkdown = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function escapeHtml(str) {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** ```bode 代码块 -> Bode 图容器（由 bode.js 读取 data-spec 绘制） */
  function bodeHtml(code) {
    var spec = {};
    try {
      spec = JSON.parse(String(code).trim());
    } catch (e) {
      spec = { error: "Bode 图规范解析失败：" + String(e.message || e) };
    }
    return '<div class="bode-plot" data-spec="' + escapeHtml(JSON.stringify(spec)) + '"></div>';
  }

  /* ============================================================
   * 主渲染引擎：markdown-it + KaTeX
   * 浏览器：post.html 已引入 assets/vendor/ 下的第三方库，
   *        通过 window.markdownit / window.katex 暴露；
   * Node：自动 require("markdown-it") / require("katex")。
   * 两者都不可用时返回 null，由内置零依赖渲染器兜底。
   * ============================================================ */
  function loadEngine() {
    var MarkdownIt = null;
    var katex = null;

    if (typeof require === "function" && typeof module === "object" && module.exports) {
      try {
        MarkdownIt = require("markdown-it");
        katex = require("katex");
      } catch (e) {
        MarkdownIt = null;
        katex = null;
      }
    } else if (typeof window !== "undefined" || typeof globalThis !== "undefined") {
      // 兼容两种挂载方式：KaTeX 挂到 self（= window），markdown-it 挂到 globalThis
      var w = typeof window !== "undefined" ? window : null;
      var gt = typeof globalThis !== "undefined" ? globalThis : null;
      MarkdownIt = (w && w.markdownit) || (gt && gt.markdownit) || null;
      katex = (w && w.katex) || (gt && gt.katex) || null;
    }
    if (!MarkdownIt || !katex) return null;

    function katexHtml(src, display) {
      try {
        return katex.renderToString(String(src), {
          displayMode: !!display,
          throwOnError: false,
          strict: false,
        });
      } catch (e) {
        return escapeHtml("$" + src + "$");
      }
    }

    var md = new MarkdownIt({
      html: false,
      linkify: false,
      typographer: false,
      highlight: function (code, lang) {
        var cls = lang ? ' class="language-' + escapeHtml(String(lang)) + '"' : "";
        return '<pre><code' + cls + ">" + highlight(code, lang) + "</code></pre>";
      },
    });

    // 行内公式 $...$（注册在行内代码之后，避免误伤 `...` 中的 $）
    md.inline.ruler.after("backticks", "math_inline", function (state, silent) {
      var start = state.pos;
      if (state.src.charAt(start) !== "$") return false;
      var maxNesting = (state.md && state.md.options && state.md.options.maxNesting) ||
        (state.options && state.options.maxNesting) || 1000;
      if (state.level >= maxNesting) return false;
      if (start > 0 && state.src.charCodeAt(start - 1) === 92) return false; // \$
      var pos = start + 1;
      while (pos < state.posMax) {
        var c = state.src.charAt(pos);
        if (c === "$" && state.src.charCodeAt(pos - 1) !== 92) break;
        pos++;
      }
      if (pos >= state.posMax) return false;
      var content = state.src.slice(start + 1, pos);
      if (content.indexOf("\n") !== -1) return false;
      if (/^\s|\s$/.test(content)) return false; // 首尾空白不视为公式
      if (silent) return true;
      var token = state.push("math_inline", "span", 0);
      token.content = content;
      state.pos = pos + 1;
      return true;
    });

    // 块级公式 $$...$$（独立成行）
    md.block.ruler.before("paragraph", "math_block", function (state, startLine, endLine, silent) {
      var pos = state.bMarks[startLine] + state.tShift[startLine];
      var max = state.eMarks[startLine];
      if (pos + 2 > max) return false;
      if (state.src.slice(pos, pos + 2) !== "$$") return false;
      if (state.src.slice(pos, pos + 3) === "$$$") return false;

      var firstLine = state.src.slice(pos + 2, max);
      var endPos = firstLine.indexOf("$$");
      var content, next, i;

      if (endPos !== -1 && /^[\s]*$/.test(firstLine.slice(endPos + 2))) {
        // 单行：$$...$$
        content = firstLine.slice(0, endPos);
        next = startLine + 1;
      } else {
        // 多行：收集直到以 $$ 结尾的行
        var lines = [firstLine];
        var found = false;
        for (i = startLine + 1; i < endLine; i++) {
          var b = state.bMarks[i] + state.tShift[i];
          var e = state.eMarks[i];
          var line = state.src.slice(b, e);
          var t = line.trim();
          if (t.slice(-2) === "$$") {
            lines.push(t.slice(0, -2));
            i++;
            found = true;
            break;
          }
          lines.push(line);
        }
        if (!found) return false;
        content = lines.join("\n");
        next = i;
      }

      if (silent) return true;
      var token = state.push("math_block", "div", 0);
      token.content = content;
      token.block = true;
      state.line = next;
      return true;
    });

    md.renderer.rules.math_inline = function (tokens, idx) {
      return katexHtml(tokens[idx].content, false);
    };
    md.renderer.rules.math_block = function (tokens, idx) {
      return '<div class="math-display">' + katexHtml(tokens[idx].content, true) + "</div>";
    };

    // ```bode 语言代码块 -> 交互式 Bode 图容器（由 bode.js 绘制）
    var defaultFence = md.renderer.rules.fence;
    md.renderer.rules.fence = function (tokens, idx, options, env, slf) {
      var token = tokens[idx];
      var info = String(token.info || "").trim();
      var lang = info.split(/\s+/)[0] || "";
      if (lang === "bode" || lang === "bode-plot") {
        return bodeHtml(token.content) + "\n";
      }
      return defaultFence(tokens, idx, options, env, slf);
    };

    return { render: function (text) { return md.render(text); } };
  }

  var ENGINE = loadEngine();

  /* ============================================================
   * 零依赖语法高亮（Prism 风格的最小实现，无外部依赖）
   * 词法类（配色见 style.css，均以 .tok- 前缀）：
   *   tok-c 注释 / tok-s 字符串 / tok-n 数字 / tok-k 关键字
   *   tok-t 类型 / tok-f 函数 / tok-b 内建字面量 / tok-o 运算符
   *   tok-p 标点 / tok-v 变量 / tok-meta 指令（@ 装饰器 / #include）
   *   tok-tag 标签 / tok-attr 属性 / tok-sel 选择器 / tok-prop 属性名
   * ============================================================ */

  var WORD_CLS = "_w";   // 单词，在回调中细分为关键字/类型/函数等
  var OTHER_CLS = "_x";  // 其他单字符，细分为标点/运算符

  var WORD_RE = "[A-Za-z_$][A-Za-z0-9_$]*";
  var STR_RE =
    '"(?:\\\\.|[^"\\\\\\n])*"|' +
    "'(?:\\\\.|[^'\\\\\\n])*'|" +
    '`(?:\\\\.|[^`\\\\])*`';
  var NUM_RE = "\\b(?:0[xX][0-9a-fA-F]+|0[bB][01]+|\\d+(?:\\.\\d+)?)\\b";
  var C_COMMENT = "\\/\\*[\\s\\S]*?\\*\\/|\\/\\/[^\\n]*";
  var HASH_COMMENT = "(?<![$\\w])#[^\\n]*";
  var SQL_COMMENT = "--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/";

  var TOK = {
    c: "tok-c", s: "tok-s", n: "tok-n", k: "tok-k", t: "tok-t",
    f: "tok-f", b: "tok-b", o: "tok-o", p: "tok-p", v: "tok-v",
    m: "tok-meta", tag: "tok-tag", attr: "tok-attr",
    sel: "tok-sel", prop: "tok-prop"
  };

  var KW = {
    js: ("var let const function return if else for while do switch case break continue " +
         "default new delete typeof instanceof void in of yield await async class extends " +
         "super static get set import from export try catch finally throw interface type " +
         "enum namespace declare public private protected readonly implements as").split(" "),
    python: ("def return if elif else for while in not and or pass break continue import " +
             "from as with try except finally raise lambda class yield global nonlocal assert " +
             "del is async await match case").split(" "),
    bash: ("if then else elif fi for while do done case esac function in select until return " +
           "exit export local readonly set unset shift trap source test break continue").split(" "),
    sql: ("select from where insert into values update set delete create table alter drop " +
          "index view join left right inner outer on group by order having limit offset union " +
          "all distinct as and or not null primary key foreign references default check unique " +
          "case when then else end exists between like in is begin commit rollback transaction").split(" "),
    java: ("public private protected class interface enum extends implements import package " +
           "static final void int long short byte char float double boolean new return if else " +
           "for while do switch case break continue default try catch finally throw throws this " +
           "super abstract synchronized volatile transient instanceof").split(" "),
    c: ("int char float double void long short unsigned signed const static extern typedef " +
        "struct union enum return if else for while do switch case break continue default " +
        "goto sizeof").split(" "),
    cpp: ("public private protected class struct union enum template typename namespace using " +
          "virtual override friend operator new delete this constexpr noexcept static_cast " +
          "dynamic_cast reinterpret_cast const static inline return if else for while do switch " +
          "case break continue default").split(" "),
    go: ("package import func var const type struct interface map chan go defer return if else " +
         "for range switch case default break continue fallthrough select").split(" "),
    rust: ("fn let mut const static pub trait impl enum struct mod use as where loop while for " +
           "in if else match return break continue unsafe async await dyn ref move type").split(" "),
    csharp: ("public private protected internal class interface enum struct namespace using " +
             "static readonly const abstract virtual override sealed new return if else for " +
             "foreach while do switch case break continue default try catch finally throw this " +
             "base is as in out ref params get set value var").split(" ")
  };

  var BUILTIN = {
    js: ("console Math JSON Promise Array Object String Number Boolean Symbol Map Set WeakMap " +
         "WeakSet Date RegExp Error TypeError RangeError window document navigator " +
         "localStorage sessionStorage fetch setTimeout setInterval clearTimeout clearInterval " +
         "requestAnimationFrame parseInt parseFloat isNaN isFinite encodeURIComponent " +
         "decodeURIComponent Infinity NaN undefined null true false this").split(" "),
    python: ("print len range str int float list dict set tuple bool type isinstance issubclass " +
             "super object open input map filter zip enumerate sorted reversed min max sum abs " +
             "round any all next iter getattr setattr hasattr dir vars repr format id hash " +
             "staticmethod classmethod property self cls None True False").split(" "),
    bash: ("echo printf cd pwd ls mkdir rm cp mv cat grep sed awk find xargs chmod chown touch " +
           "head tail less more curl wget tar unzip zip git npm node python pip install apt " +
           "yum brew docker sudo su env history alias man clear date du df ps kill jobs fg bg " +
           "source").split(" "),
    sql: ("count sum avg min max now date curdate").split(" "),
    java: ("System out err in println print printf parseInt length size add put get true false " +
           "null this").split(" "),
    c: ("printf scanf malloc free NULL main true false").split(" "),
    cpp: ("cout cin endl std NULL true false new delete nullptr").split(" "),
    go: ("make new len cap append copy delete panic recover close print println true false nil " +
         "error any").split(" "),
    rust: ("println print eprintln format vec String Some None Ok Err Box Rc Arc true false").split(" "),
    csharp: ("Console WriteLine Write ReadLine null true false this base").split(" ")
  };

  var TYPES = {
    js: ("string number boolean any unknown never void object symbol bigint").split(" "),
    java: ("String Integer Long Short Byte Character Float Double Boolean Object List Map Set " +
           "ArrayList HashMap HashSet System Math").split(" "),
    c: ("size_t FILE bool").split(" "),
    cpp: ("string vector map set pair size_t bool char int float double auto").split(" "),
    go: ("string int int8 int16 int32 int64 uint uint8 uint16 uint32 uint64 float32 float64 " +
         "bool byte rune error any").split(" "),
    rust: ("i8 i16 i32 i64 i128 u8 u16 u32 u64 u128 f32 f64 usize isize bool char str String " +
           "Vec Option Result").split(" "),
    csharp: ("string int long short byte char float double decimal bool object dynamic var void").split(" ")
  };

  // 语言别名 -> 规范名
  var ALIASES = {
    js: "javascript", javascript: "javascript", jsx: "jsx", tsx: "tsx",
    ts: "typescript", typescript: "typescript",
    py: "python", python: "python",
    sh: "bash", bash: "bash", shell: "bash", zsh: "bash",
    json: "json",
    html: "html", htm: "html", xml: "xml", svg: "xml",
    css: "css", scss: "scss", less: "less",
    sql: "sql",
    java: "java",
    c: "c", h: "c", cpp: "cpp", "c++": "cpp", hpp: "cpp",
    cs: "csharp", csharp: "csharp",
    go: "go", golang: "go",
    rust: "rust", rs: "rust",
    yaml: "yaml", yml: "yaml",
    md: "markdown", markdown: "markdown",
    plain: "plain", text: "plain", txt: "plain"
  };

  function makeSpec(o) {
    return {
      comment: o.comment || null,
      triple: o.triple || null,
      extra: o.extra || null,
      multiline: !!o.multiline,
      kw: o.kw || [],
      builtins: o.builtins || [],
      types: o.types || [],
      upperType: !!o.upperType
    };
  }

  var LANG_SPECS = {
    javascript: makeSpec({
      comment: C_COMMENT, kw: KW.js, builtins: BUILTIN.js, types: TYPES.js, upperType: true
    }),
    typescript: makeSpec({
      comment: C_COMMENT, kw: KW.js, builtins: BUILTIN.js, types: TYPES.js, upperType: true
    }),
    jsx: makeSpec({
      comment: C_COMMENT, kw: KW.js, builtins: BUILTIN.js, types: TYPES.js, upperType: true
    }),
    tsx: makeSpec({
      comment: C_COMMENT, kw: KW.js, builtins: BUILTIN.js, types: TYPES.js, upperType: true
    }),
    python: makeSpec({
      comment: HASH_COMMENT,
      triple: '"""(?:[\\s\\S]*?)"""|\'\'\'(?:[\\s\\S]*?)\'\'\'',
      kw: KW.python, builtins: BUILTIN.python, upperType: true,
      extra: [["(?<![\\w$])@[A-Za-z_][\\w.]*", TOK.m]]
    }),
    bash: makeSpec({
      comment: HASH_COMMENT,
      kw: KW.bash, builtins: BUILTIN.bash,
      extra: [
        ["\\$\\{[^}]*\\}", TOK.v],
        ["\\$[A-Za-z_][A-Za-z0-9_]*", TOK.v]
      ]
    }),
    json: makeSpec({
      builtins: ["true", "false", "null"],
      extra: [['"(?:\\\\.|[^"\\\\\\n])*"(?=\\s*:)', TOK.attr]]
    }),
    sql: makeSpec({ comment: SQL_COMMENT, kw: KW.sql, builtins: BUILTIN.sql }),
    java: makeSpec({
      comment: C_COMMENT, kw: KW.java, builtins: BUILTIN.java, types: TYPES.java, upperType: true
    }),
    c: makeSpec({
      comment: C_COMMENT, kw: KW.c, builtins: BUILTIN.c, types: TYPES.c, upperType: true,
      extra: [["(?<![\\w$])#[^\\n]*", TOK.m]]
    }),
    cpp: makeSpec({
      comment: C_COMMENT, kw: KW.cpp, builtins: BUILTIN.cpp, types: TYPES.cpp, upperType: true,
      extra: [["(?<![\\w$])#[^\\n]*", TOK.m]]
    }),
    csharp: makeSpec({
      comment: C_COMMENT, kw: KW.csharp, builtins: BUILTIN.csharp, types: TYPES.csharp, upperType: true
    }),
    go: makeSpec({
      comment: C_COMMENT, kw: KW.go, builtins: BUILTIN.go, types: TYPES.go, upperType: true
    }),
    rust: makeSpec({
      comment: C_COMMENT, kw: KW.rust, builtins: BUILTIN.rust, types: TYPES.rust, upperType: true
    }),
    yaml: makeSpec({
      comment: HASH_COMMENT,
      builtins: ["true", "false", "null", "yes", "no", "on", "off", "~"],
      multiline: true,
      extra: [["^[ \\t]*[\\w./-]+(?=\\s*:)", TOK.attr]]
    })
  };

  /** 为某语言编译词法正则；分组顺序 = 注释、三元串、附加、字符串、数字、单词、单字符 */
  function compileTokenizer(spec) {
    var groups = [];
    var classes = [];
    function add(re, cls) { groups.push("(" + re + ")"); classes.push(cls); }
    if (spec.comment) add(spec.comment, TOK.c);
    if (spec.triple) add(spec.triple, TOK.s);
    for (var i = 0; spec.extra && i < spec.extra.length; i++) add(spec.extra[i][0], spec.extra[i][1]);
    add(STR_RE, TOK.s);
    add(NUM_RE, TOK.n);
    add(WORD_RE, WORD_CLS);
    add("[\\s\\S]", OTHER_CLS);
    return { re: new RegExp(groups.join("|"), "g" + (spec.multiline ? "m" : "")), cls: classes };
  }

  function resolveSpec(lang) {
    if (!lang) return null;
    var key = String(lang).toLowerCase().trim();
    var canonical = ALIASES[key] || key;
    var spec = LANG_SPECS[canonical];
    if (!spec) return null;
    if (!spec._tok) spec._tok = compileTokenizer(spec);
    return spec;
  }

  function wordClass(word, spec, next) {
    if (spec.kw.indexOf(word) !== -1) return TOK.k;
    if (spec.builtins.indexOf(word) !== -1) return TOK.b;
    if (spec.types.indexOf(word) !== -1) return TOK.t;
    if (spec.upperType && /^[A-Z]/.test(word) && next !== "(") return TOK.t;
    if (next === "(") return TOK.f;
    return "";
  }

  /** 通用词法高亮（适用于大多数语言） */
  function highlightCode(code, lang) {
    var spec = resolveSpec(lang);
    if (!spec) return escapeHtml(code);
    var tok = spec._tok;
    var re = tok.re;
    var out = "";
    var last = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) out += escapeHtml(code.slice(last, m.index));
      var text = m[0];
      last = m.index + text.length;
      var cls = null;
      for (var i = 1; i < m.length; i++) {
        if (m[i] !== undefined) { cls = tok.cls[i - 1]; break; }
      }
      if (cls === WORD_CLS) {
        var w = wordClass(text, spec, code.charAt(re.lastIndex));
        out += w ? '<span class="' + w + '">' + escapeHtml(text) + "</span>" : escapeHtml(text);
      } else if (cls === OTHER_CLS) {
        var k = /^[{}()[\].,;]$/.test(text) ? TOK.p : TOK.o;
        out += '<span class="' + k + '">' + escapeHtml(text) + "</span>";
      } else {
        out += '<span class="' + cls + '">' + escapeHtml(text) + "</span>";
      }
    }
    if (last < code.length) out += escapeHtml(code.slice(last));
    return out;
  }

  /** HTML / XML / SVG 专用高亮 */
  function highlightHtml(code) {
    var re = /<!--[\s\S]*?-->|<!DOCTYPE[^>]*>|<\/?[a-zA-Z][A-Za-z0-9-]*|\b[A-Za-z][A-Za-z0-9-]*(?=\s*=)|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|\/?>/g;
    var out = "";
    var last = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) out += escapeHtml(code.slice(last, m.index));
      var t = m[0];
      last = m.index + t.length;
      if (t.charAt(0) === "<" && t.charAt(1) === "!") {
        out += (t.indexOf("--") === 2 ? '<span class="tok-c">' : '<span class="tok-meta">') +
          escapeHtml(t) + "</span>";
      } else if (t.charAt(0) === "<") {
        var name = t.replace(/[<\/]/g, "");
        out += '<span class="tok-o">' + escapeHtml(t.slice(0, t.length - name.length)) + "</span>" +
          '<span class="tok-tag">' + escapeHtml(name) + "</span>";
      } else if (/^[a-zA-Z]/.test(t)) {
        out += '<span class="tok-attr">' + escapeHtml(t) + "</span>";
      } else if (t.charAt(0) === '"' || t.charAt(0) === "'") {
        out += '<span class="tok-s">' + escapeHtml(t) + "</span>";
      } else {
        out += '<span class="tok-p">' + escapeHtml(t) + "</span>";
      }
    }
    if (last < code.length) out += escapeHtml(code.slice(last));
    return out;
  }

  /** CSS / SCSS / LESS 专用高亮 */
  function highlightCss(code) {
    var re = /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[0-9a-fA-F]{3,8}\b|@[\w-]+|\$[\w-]+|\.[A-Za-z_-][\w-]*|::?[\w-]+|\b[\w-]+(?=\s*:)|\b-?\d+(?:\.\d+)?(?:[a-z%]+)?\b/g;
    var out = "";
    var last = 0;
    var m;
    re.lastIndex = 0;
    while ((m = re.exec(code))) {
      if (m.index > last) out += escapeHtml(code.slice(last, m.index));
      var t = m[0];
      last = m.index + t.length;
      var cls;
      if (/^\/\*/.test(t)) cls = TOK.c;
      else if (/^["']/.test(t)) cls = TOK.s;
      else if (/^#/.test(t)) cls = TOK.n;
      else if (/^@/.test(t)) cls = TOK.k;
      else if (/^\$/.test(t)) cls = TOK.v;
      else if (/^\./.test(t)) cls = TOK.sel;
      else if (/^::?/.test(t)) cls = TOK.sel;
      else if (/^\d/.test(t)) cls = TOK.n;
      else cls = TOK.prop;
      out += '<span class="' + cls + '">' + escapeHtml(t) + "</span>";
    }
    if (last < code.length) out += escapeHtml(code.slice(last));
    return out;
  }

  /** 代码块入口：按语言分发到专用/通用高亮，未知语言按纯文本转义 */
  function highlight(code, lang) {
    var key = String(lang || "").toLowerCase().trim();
    if (key === "html" || key === "htm" || key === "xml" || key === "svg") return highlightHtml(code);
    if (key === "css" || key === "scss" || key === "less") return highlightCss(code);
    return highlightCode(code, key);
  }

  /* ============================================================
   * LaTeX 公式（零依赖最小实现，KaTeX 风格简化版）
   *   $...$ 行内公式、$$...$$ 独立行显示公式
   *   支持：\frac \sqrt[n] 上下标 求和/积分/极限上下限
   *         \left \right 自适应括号 矩阵环境 希腊字母
   *         常用运算符/箭头/关系符 \text \mathbf \mathbb 等
   *   未支持的 LaTeX 命令按原样显示，不会报错。
   * ============================================================ */

  var MATH = (function () {
    var DISPLAY = false;

    var GREEK = {
      alpha:"α", beta:"β", gamma:"γ", delta:"δ", epsilon:"ε", varepsilon:"ϵ",
      zeta:"ζ", eta:"η", theta:"θ", vartheta:"ϑ", iota:"ι", kappa:"κ",
      lambda:"λ", mu:"μ", nu:"ν", xi:"ξ", pi:"π", rho:"ρ", sigma:"σ",
      tau:"τ", upsilon:"υ", phi:"φ", varphi:"ϕ", chi:"χ", psi:"ψ", omega:"ω",
      Gamma:"Γ", Delta:"Δ", Theta:"Θ", Lambda:"Λ", Xi:"Ξ", Pi:"Π",
      Sigma:"Σ", Upsilon:"Υ", Phi:"Φ", Psi:"Ψ", Omega:"Ω", ell:"ℓ", hbar:"ℏ"
    };

    var SYMBOL = {
      infty:"∞", partial:"∂", nabla:"∇", emptyset:"∅", varnothing:"∅",
      forall:"∀", exists:"∃", nexists:"∄", neg:"¬", lnot:"¬", top:"⊤", bot:"⊥",
      therefore:"∴", because:"∵", aleph:"ℵ", wp:"℘", Re:"ℜ", Im:"ℑ", prime:"′",
      dagger:"†", ddagger:"‡", pm:"±", mp:"∓", times:"×", div:"÷", cdot:"⋅",
      ast:"∗", star:"⋆", circ:"∘", bullet:"•", oplus:"⊕", otimes:"⊗", odot:"⊙",
      wedge:"∧", vee:"∨", cap:"∩", cup:"∪", setminus:"∖", leq:"≤", le:"≤",
      geq:"≥", ge:"≥", neq:"≠", ne:"≠", equiv:"≡", approx:"≈", sim:"∼",
      simeq:"≃", cong:"≅", propto:"∝", ll:"≪", gg:"≫", prec:"≺", succ:"≻",
      preceq:"⪯", succeq:"⪰", subset:"⊂", supset:"⊃", subseteq:"⊆",
      supseteq:"⊇", nsubseteq:"⊈", nsupseteq:"⊉", in:"∈", notin:"∉", ni:"∋",
      mid:"∣", nmid:"∤", perp:"⊥", parallel:"∥", nparallel:"∦",
      langle:"⟨", rangle:"⟩", lfloor:"⌊", rfloor:"⌋", lceil:"⌈", rceil:"⌉",
      leftarrow:"←", gets:"←", rightarrow:"→", to:"→", leftrightarrow:"↔",
      Leftarrow:"⇐", Rightarrow:"⇒", Leftrightarrow:"⇔", mapsto:"↦",
      longrightarrow:"⟶", longleftarrow:"⟵", longleftrightarrow:"⟷",
      Longrightarrow:"⟹", Longleftarrow:"⟸", uparrow:"↑", downarrow:"↓",
      updownarrow:"↕", Uparrow:"⇑", Downarrow:"⇓", Updownarrow:"⇕",
      nearrow:"↗", searrow:"↘", swarrow:"↙", nwarrow:"↖",
      ldots:"…", cdots:"⋯", vdots:"⋮", ddots:"⋱", dots:"…",
      sum:"∑", prod:"∏", coprod:"∐", int:"∫", oint:"∮", iint:"∬", iiint:"∭",
      bigcup:"⋃", bigcap:"⋂", bigvee:"⋁", bigwedge:"⋀", bigoplus:"⨁", bigotimes:"⨂",
      angle:"∠", measuredangle:"∡", triangle:"△", square:"□", diamond:"◇",
      clubsuit:"♣", heartsuit:"♥", spadesuit:"♠", diamondsuit:"♦",
      flat:"♭", natural:"♮", sharp:"♯", vert:"∣", Vert:"∥", backslash:"∖"
    };

    var FUNCS = ("sin cos tan cot sec csc log ln lg exp arcsin arccos arctan " +
      "sinh cosh tanh coth lim limsup liminf sup inf max min det gcd arg deg dim ker hom Pr mod bmod").split(" ");
    var LIM_OPS = "lim limsup liminf sup inf max min det gcd arg deg dim ker hom Pr".split(" ");
    var LIM_SYMS = "sum prod coprod int oint iint iiint bigcup bigcap bigvee bigwedge bigoplus bigotimes".split(" ");

    var BB = { A:"𝔸", B:"𝔹", C:"ℂ", D:"𝔻", E:"𝔼", F:"𝔽", G:"𝔾", H:"ℍ", I:"𝕀",
      J:"𝕁", K:"𝕂", L:"𝕃", M:"𝕄", N:"ℕ", O:"𝕆", P:"ℙ", Q:"ℚ", R:"ℝ",
      S:"𝕊", T:"𝕋", U:"𝕌", V:"𝕍", W:"𝕎", X:"𝕏", Y:"𝕐", Z:"ℤ" };

    function renderMath(src, display) {
      var s = String(src).replace(/\r\n?/g, "\n").trim();
      var i = 0, n = s.length;
      DISPLAY = display;

      function isLetter(c) {
        return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");
      }
      function skipSpaces() {
        while (i < n && (s.charAt(i) === " " || s.charAt(i) === "\t")) i++;
      }
      function readName() {
        var name = s.charAt(i); i++;
        while (i < n && isLetter(s.charAt(i))) { name += s.charAt(i); i++; }
        return name;
      }
      function parseExpr() {
        var h = "";
        while (i < n) {
          var c = s.charAt(i);
          if (c === "}") break;
          if (c === "&") break;
          if (c === "\\" && s.charAt(i + 1) === "\\") break;
          h += atom();
        }
        return h;
      }
      function parseGroup() {
        if (s.charAt(i) === "{") i++;
        var h = parseExpr();
        if (s.charAt(i) === "}") i++;
        return h;
      }
      function wrapScripts(base) {
        var sup = null, sub = null;
        while (i < n && (s.charAt(i) === "^" || s.charAt(i) === "_")) {
          var up = s.charAt(i) === "^"; i++;
          var t = atom();
          if (up) sup = t; else sub = t;
        }
        if (sup === null && sub === null) return base;
        var h = base;
        if (sub !== null) h += '<span class="sub">' + sub + "</span>";
        if (sup !== null) h += '<span class="sup">' + sup + "</span>";
        return h;
      }
      function consumeLimits() {
        var under = null, over = null;
        while (i < n && (s.charAt(i) === "^" || s.charAt(i) === "_")) {
          var up = s.charAt(i) === "^"; i++;
          var t = atom();
          if (up) over = t; else under = t;
        }
        if (under === null && over === null) return null;
        return { under: under, over: over };
      }
      function opWithLimits(body, lim) {
        if (!lim) return body;
        if (!DISPLAY) {
          var h = body;
          if (lim.under) h += '<span class="sub">' + lim.under + "</span>";
          if (lim.over) h += '<span class="sup">' + lim.over + "</span>";
          return h;
        }
        var o = '<span class="op-lim">';
        if (lim.over) o += '<span class="op-lim-over">' + lim.over + "</span>";
        o += '<span class="op-lim-body">' + body + "</span>";
        if (lim.under) o += '<span class="op-lim-under">' + lim.under + "</span>";
        return o + "</span>";
      }
      function fdHtml(d, side) {
        var cls = "fd ";
        if (d === "(") cls += side === "l" ? "fd-paren-l" : "fd-paren-r";
        else if (d === ")") cls += side === "l" ? "fd-paren-r" : "fd-paren-l";
        else if (d === "[") cls += "fd-sq-l";
        else if (d === "]") cls += "fd-sq-r";
        else if (d === "|" || d === "\\") cls += "fd-bar";
        else cls += "fd-brace";
        var glyph = (cls.indexOf("fd-brace") !== -1) ? (side === "l" ? "{" : "}") : "";
        return '<span class="' + cls + '">' + glyph + "</span>";
      }
      function plainGroup() {
        if (s.charAt(i) === "{") i++;
        var h = "";
        while (i < n && s.charAt(i) !== "}") {
          var c = s.charAt(i);
          if (c === "\\") {
            i++;
            var nx = s.charAt(i);
            if (nx === "\\") { h += "\\\\"; i++; continue; }
            if (isLetter(nx)) {
              var nm = readName();
              if (GREEK[nm] !== undefined) h += GREEK[nm];
              else if (SYMBOL[nm] !== undefined) h += SYMBOL[nm];
              else h += "\\" + nm;
              continue;
            }
            i++;
            h += escapeHtml(nx);
            continue;
          }
          if (c === "~" || c === " ") { h += "&nbsp;"; i++; continue; }
          h += escapeHtml(c);
          i++;
        }
        if (s.charAt(i) === "}") i++;
        return h;
      }
      function bbGroup() {
        if (s.charAt(i) === "{") i++;
        var h = "";
        while (i < n && s.charAt(i) !== "}") {
          var c = s.charAt(i);
          if (c === "\\") { i++; if (i < n) i++; continue; }
          if (c === " ") { h += "&nbsp;"; i++; continue; }
          h += (BB[c] !== undefined) ? BB[c] : escapeHtml(c);
          i++;
        }
        if (s.charAt(i) === "}") i++;
        return h;
      }
      function singleCommand(ch) {
        if (ch === "{") return "{";
        if (ch === "}") return "}";
        if (ch === "(" || ch === ")" || ch === "[" || ch === "]") return escapeHtml(ch);
        if (ch === "&") return "&amp;";
        if (ch === "%" || ch === "#" || ch === "_" || ch === "$") return ch;
        if (ch === " ") return "&nbsp;";
        if (ch === ",") return "&thinsp;";
        if (ch === ":") return "&ensp;";
        if (ch === ";") return "&ensp;";
        if (ch === "!") return "&thinsp;";
        if (ch === "|") return '<span class="mo">|</span>';
        if (ch === "\\") return "\\\\";
        return "\\" + escapeHtml(ch);
      }
      function renderEnv(name, rows) {
        var open = "", close = "";
        if (name === "pmatrix") { open = "("; close = ")"; }
        else if (name === "bmatrix") { open = "["; close = "]"; }
        else if (name === "Bmatrix") { open = "{"; close = "}"; }
        else if (name === "vmatrix" || name === "Vmatrix") { open = "|"; close = "|"; }
        else if (name === "cases") { open = "{"; close = ""; }
        var inner = '<span class="mtable">';
        for (var r = 0; r < rows.length; r++) {
          inner += '<span class="mrow">';
          for (var k = 0; k < rows[r].length; k++) {
            inner += '<span class="mcell">' + (rows[r][k] || "&nbsp;") + "</span>";
          }
          inner += "</span>";
        }
        inner += "</span>";
        if (!open && !close) return inner;
        return '<span class="fence">' + fdHtml(open, "l") + '<span class="fb">' + inner + "</span>" +
          (close ? fdHtml(close, "r") : "") + "</span>";
      }
      function beginEnv() {
        if (s.charAt(i) === "{") i++;
        var envName = "";
        while (i < n && isLetter(s.charAt(i))) { envName += s.charAt(i); i++; }
        if (s.charAt(i) === "}") i++;
        // 可选列参数（array/tabular 的 {lcr}）
        if (s.charAt(i) === "{") {
          i++;
          while (i < n && s.charAt(i) !== "}") i++;
          if (s.charAt(i) === "}") i++;
        }
        var rows = [];
        var cells = [""];
        while (i < n) {
          var c = s.charAt(i);
          if (c === "\\") {
            var nx = s.charAt(i + 1);
            if (nx === "\\") {
              i += 2;
              rows.push(cells);
              cells = [""];
              continue;
            }
            if (isLetter(nx)) {
              var save = i;
              i += 2;
              var nm = nx;
              while (i < n && isLetter(s.charAt(i))) { nm += s.charAt(i); i++; }
              if (nm === "end") {
                if (s.charAt(i) === "{") i++;
                while (i < n && isLetter(s.charAt(i))) i++;
                if (s.charAt(i) === "}") i++;
                rows.push(cells);
                return renderEnv(envName, rows);
              }
              i = save;
              cells[cells.length - 1] += atom();
              continue;
            }
            i += 2;
            cells[cells.length - 1] += singleCommand(nx);
            continue;
          }
          if (c === "&") { i++; cells.push(""); continue; }
          if (c === "}" || c === "$") { i++; continue; }
          cells[cells.length - 1] += atom();
        }
        rows.push(cells);
        return renderEnv(envName, rows);
      }
      function command(name) {
        if (GREEK[name] !== undefined) return '<span class="mi">' + GREEK[name] + "</span>";
        if (SYMBOL[name] !== undefined) {
          if (LIM_SYMS.indexOf(name) !== -1) {
            return opWithLimits('<span class="mi">' + SYMBOL[name] + "</span>", consumeLimits());
          }
          return '<span class="mo">' + SYMBOL[name] + "</span>";
        }
        if (FUNCS.indexOf(name) !== -1) {
          if (LIM_OPS.indexOf(name) !== -1) {
            return opWithLimits('<span class="rm">' + name + "</span>", consumeLimits());
          }
          return '<span class="rm">' + name + "</span>";
        }
        switch (name) {
          case "frac": {
            var num = parseGroup();
            var den = parseGroup();
            return '<span class="frac"><span class="num">' + num + '</span><span class="den">' + den + "</span></span>";
          }
          case "binom": {
            var bn = parseGroup();
            var bk = parseGroup();
            return '<span class="fence">' + fdHtml("(", "l") + '<span class="fb">' +
              '<span class="frac"><span class="num">' + bn + '</span><span class="den">' + bk + "</span></span>" +
              "</span>" + fdHtml(")", "r") + "</span>";
          }
          case "sqrt": {
            var idx = null;
            if (s.charAt(i) === "[") {
              i++;
              idx = parseExpr();
              if (s.charAt(i) === "]") i++;
            }
            var body = parseGroup();
            return '<span class="sqrt">' +
              (idx ? '<span class="sqrt-idx">' + idx + "</span>" : "") +
              '<span class="sqrt-body">' + body + "</span></span>";
          }
          case "text": case "mathrm": case "operatorname":
            return '<span class="rm">' + plainGroup() + "</span>";
          case "mathbf": case "boldsymbol":
            return '<span class="bf">' + plainGroup() + "</span>";
          case "mathit": case "mathcal": case "mathscr":
            return '<span class="mi">' + plainGroup() + "</span>";
          case "mathbb":
            return '<span class="bb">' + bbGroup() + "</span>";
          case "overline":
            return '<span class="ol">' + parseGroup() + "</span>";
          case "underline":
            return '<span class="ul">' + parseGroup() + "</span>";
          case "overrightarrow":
            return '<span class="vec">' + parseGroup() + "</span>";
          case "left": {
            skipSpaces();
            var dl = s.charAt(i); i++;
            if (!dl || dl === ".") return '<span class="fence"><span class="fb">';
            return '<span class="fence">' + fdHtml(dl, "l") + '<span class="fb">';
          }
          case "right": {
            skipSpaces();
            var dr = s.charAt(i);
            var isD = dr && "()[]{}|.".indexOf(dr) !== -1;
            if (isD) i++;
            return '</span>' + (isD && dr !== "." ? fdHtml(dr, "r") : "") + "</span>";
          }
          case "begin": return beginEnv();
          case "quad": return "&emsp;";
          case "qquad": return "&emsp;&emsp;";
          case "displaystyle": case "textstyle": case "scriptstyle":
          case "scriptscriptstyle": case "limits": case "nolimits": return "";
          case "hat": return parseGroup() + "\u0302";
          case "bar": return parseGroup() + "\u0304";
          case "vec": return parseGroup() + "\u20D7";
          case "dot": return parseGroup() + "\u0307";
          case "ddot": return parseGroup() + "\u0308";
          case "tilde": return parseGroup() + "\u0303";
        }
        return '<span class="mo">\\' + name + "</span>";
      }
      function atom() {
        var c = s.charAt(i);
        if (c === "\\") {
          i++;
          var nx = s.charAt(i);
          if (isLetter(nx)) {
            var name = readName();
            return wrapScripts(command(name));
          }
          i++;
          return wrapScripts(singleCommand(nx));
        }
        if (c === "{") {
          i++;
          var g = parseExpr();
          if (s.charAt(i) === "}") i++;
          return wrapScripts(g);
        }
        if (c === "^" || c === "_") {
          var up = c === "^"; i++;
          var t = atom();
          return up ? '<span class="sup">' + t + "</span>" : '<span class="sub">' + t + "</span>";
        }
        if (c === "$" || c === " " || c === "\t" || c === "\n") { i++; return ""; }
        i++;
        if (isLetter(c)) return wrapScripts('<span class="mi">' + c + "</span>");
        if (c >= "0" && c <= "9") return wrapScripts('<span class="mn">' + c + "</span>");
        return wrapScripts('<span class="mo">' + escapeHtml(c) + "</span>");
      }

      var inner = parseExpr();
      var html = '<span class="math">' + inner + "</span>";
      return display ? '<div class="math-display">' + html + "</div>" : html;
    }

    return { render: renderMath };
  })();

  var renderMath = MATH.render;

  /** 行内解析：先提取公式，再转义 HTML，最后处理转义字符与 Markdown 标记 */
  function renderInline(str) {
    // 行内公式 $...$（跳过 \$；内容首尾空白不视为公式；占位符最后还原）
    var mathPieces = [];
    var s = str.replace(/(^|[^\\])\$([^$\n]+?)\$/g, function (m, pre, math) {
      if (/^\s|\s$/.test(math)) return m;
      mathPieces.push(renderMath(math, false));
      return pre + "\uE003M" + (mathPieces.length - 1) + "\uE003";
    });

    s = escapeHtml(s);

    // 转义：\* \_ \` 等 -> HTML 实体（实体不会被后续正则匹配，最终由浏览器还原）
    s = s.replace(/\\([\\`*_{}[\]()#+\-.!>])/g, function (m, ch) {
      return "&#" + ch.charCodeAt(0) + ";";
    });

    // 行内代码（内容不再解析）
    s = s.replace(/`([^`\n]+)`/g, function (m, code) {
      return "<code>" + code + "</code>";
    });

    // 图片 ![alt](url "title")
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g,
      function (m, alt, url, title) {
        return '<img src="' + url + '" alt="' + alt + '"' +
          (title ? ' title="' + title + '"' : "") + ">";
      });

    // 链接 [text](url "title")
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g,
      function (m, text, url, title) {
        return '<a href="' + url + '"' +
          (title ? ' title="' + title + '"' : "") + ">" + text + "</a>";
      });

    // 粗体
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/__([^_]+)__/g, "<strong>$1</strong>");

    // 删除线
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");

    // 斜体
    s = s.replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/(^|[^_])_([^_\n]+)_/g, "$1<em>$2</em>");

    // 还原行内公式占位符
    return s.replace(/\uE003M(\d+)\uE003/g, function (m, idx) {
      return mathPieces[+idx];
    });
  }

  /** 提取代码块，返回 { text, blocks } */
  function extractCodeBlocks(md) {
    var blocks = [];
    var text = md.replace(/(?:```|~~~)([\s\S]*?)(?:```|~~~)/g, function (m, body) {
      // 语言标注只在 ``` 后紧跟的非空行上提取；``` 后直接换行视为无语言
      var lang = "";
      var rest = body;
      if (body.charAt(0) !== "\n") {
        var nl = body.indexOf("\n");
        if (nl === -1) {
          lang = body.trim();
          rest = "";
        } else {
          lang = body.slice(0, nl).trim();
          rest = body.slice(nl + 1);
        }
      } else {
        rest = body.slice(1);
      }
      var html;
      if (lang === "bode" || lang === "bode-plot") {
        html = bodeHtml(rest.replace(/\n$/, ""));
      } else {
        html =
          '<pre><code' + (lang ? ' class="language-' + lang + '"' : "") + ">" +
          highlight(rest.replace(/\n$/, ""), lang) +
          "</code></pre>";
      }
      blocks.push(html);
      return "\uE001CODE" + (blocks.length - 1) + "\uE001";
    });
    return { text: text, blocks: blocks };
  }

  /** 收集列表块（支持两级嵌套），返回 { html, nextIndex } */
  function collectList(lines, start, ordered) {
    var topLevel = [];
    var parents = [topLevel];
    var lastAtLevel = [];

    var i = start;
    for (; i < lines.length; i++) {
      var line = lines[i];
      var m;
      if (ordered) {
        m = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
      } else {
        m = line.match(/^(\s*)([-*+])\s+(.*)$/);
      }
      if (!m) break;
      var indent = m[1].length;
      var content = m[3];
      var level = 0;
      while (level < lastAtLevel.length && indent > lastAtLevel[level].indent) {
        level++;
      }
      // 归并：若与某层 indent 相等，则回到该层
      var target = level;
      for (var l = level; l < lastAtLevel.length; l++) {
        if (indent === lastAtLevel[l].indent) { target = l; break; }
      }
      parents.length = target + 1;
      lastAtLevel.length = target + 1;
      if (!parents[target]) parents[target] = [];
      var item = { indent: indent, content: renderInline(content), children: [] };
      parents[target].push(item);
      parents[target + 1] = item.children;
      lastAtLevel[target] = item;
    }

    function renderList(list, ordered) {
      var tag = ordered ? "ol" : "ul";
      var html = "<" + tag + ">";
      for (var k = 0; k < list.length; k++) {
        var it = list[k];
        html += "<li>" + it.content;
        if (it.children && it.children.length) {
          html += renderList(it.children, ordered);
        }
        html += "</li>";
      }
      return html + "</" + tag + ">";
    }

    return { html: renderList(topLevel, ordered), nextIndex: i };
  }

  /** 块级解析 */
  function renderBlocks(text, blocks) {
    var lines = text.split("\n");
    var out = [];
    var i = 0;

    function codePlaceholder(line) {
      var m = line.match(/^\uE001CODE(\d+)\uE001\s*$/);
      return m ? blocks[+m[1]] : null;
    }

    while (i < lines.length) {
      var line = lines[i];

      // 空行
      if (!line.trim()) { i++; continue; }

      // 代码块占位符
      var code = codePlaceholder(line);
      if (code !== null) { out.push(code); i++; continue; }

      // 显示公式：$$...$$ 独立成行（支持多行直到闭合）
      if (/^\$\$\s*$/.test(line) || /^\$\$[^$]/.test(line)) {
        var mathLines = [];
        var mEnd = line.indexOf("$$", 2);
        if (mEnd !== -1 && line.slice(mEnd + 2).trim() === "") {
          // 单行 $$...$$
          mathLines.push(line.slice(2, mEnd));
          out.push(renderMath(mathLines.join("\n"), true));
          i++;
          continue;
        }
        // 多行：$$ 开头，收集到独立 $$ 行
        mathLines.push(line.replace(/^\$\$/, "").trim());
        i++;
        while (i < lines.length) {
          var ml = lines[i];
          if (/^\$\$/.test(ml.trim())) { i++; break; }
          mathLines.push(ml);
          i++;
        }
        out.push(renderMath(mathLines.join("\n"), true));
        continue;
      }

      // 标题
      var h = line.match(/^(#{1,6})\s+(.*)$/);
      if (h) {
        var level = h[1].length;
        out.push("<h" + level + ">" + renderInline(h[2]) + "</h" + level + ">");
        i++;
        continue;
      }

      // 水平线
      var hr = line.match(/^\s*([-*_])\s*(\1\s*){2,}$/);
      if (hr) { out.push("<hr>"); i++; continue; }

      // 引用块：合并连续的 > 行
      if (/^\s*>\s?/.test(line)) {
        var quoteLines = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        out.push("<blockquote>" + renderBlocks(quoteLines.join("\n"), blocks) + "</blockquote>");
        continue;
      }

      // 无序列表
      if (/^\s*([-*+])\s+/.test(line)) {
        var ul = collectList(lines, i, false);
        out.push(ul.html);
        i = ul.nextIndex;
        continue;
      }

      // 有序列表
      if (/^\s*\d+\.\s+/.test(line)) {
        var ol = collectList(lines, i, true);
        out.push(ol.html);
        i = ol.nextIndex;
        continue;
      }

      // 段落：合并连续非空、非块级起始的行
      var para = [];
      while (i < lines.length) {
        var l = lines[i];
        if (!l.trim()) break;
        if (/^(#{1,6})\s+/.test(l)) break;
        if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(l)) break;
        if (/^\s*>\s?/.test(l)) break;
        if (/^\s*([-*+])\s+/.test(l)) break;
        if (/^\s*\d+\.\s+/.test(l)) break;
        if (codePlaceholder(l) !== null) break;
        para.push(l.trim());
        i++;
      }
      if (para.length) {
        out.push("<p>" + renderInline(para.join(" ")) + "</p>");
      }
    }
    return out.join("\n");
  }

  function renderMarkdown(md) {
    var normalized = String(md || "").replace(/\r\n?/g, "\n");
    if (ENGINE) return ENGINE.render(normalized);
    var extracted = extractCodeBlocks(normalized);
    return renderBlocks(extracted.text, extracted.blocks);
  }

  return renderMarkdown;
});
