/**
 * bode-editor.js —— 交互式 Bode 图绘制器（资源页专用）
 *
 * 与文章内静态 bode.js 不同，本绘制器支持：
 *   1. 公式可编辑：直接输入传递函数表达式，如 10/((s+1)*(s+10))
 *   2. 参数可调：公式中出现的 K / T / xi / wn 等标识符会自动生成滑杆
 *
 * 语法支持：数字、+ - * / ^、括号、变量 s（复变量 jω）、
 * 参数名（任意字母开头的标识符）、函数 exp()/sqrt()/abs()。
 */
(function () {
  "use strict";

  /* ================= 复数运算 ================= */
  var C = {
    add: function (a, b) { return { r: a.r + b.r, i: a.i + b.i }; },
    sub: function (a, b) { return { r: a.r - b.r, i: a.i - b.i }; },
    mul: function (a, b) { return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r }; },
    div: function (a, b) {
      var d = b.r * b.r + b.i * b.i;
      if (d === 0) return { r: Infinity, i: 0 };
      return { r: (a.r * b.r + a.i * b.i) / d, i: (a.i * b.r - a.r * b.i) / d };
    },
    exp: function (a) {
      var e = Math.exp(a.r);
      return { r: e * Math.cos(a.i), i: e * Math.sin(a.i) };
    },
    ln: function (a) {
      var r = Math.log(Math.sqrt(a.r * a.r + a.i * a.i) || 1e-300);
      return { r: r, i: Math.atan2(a.i, a.r) };
    },
    pow: function (a, b) { return C.exp(C.mul(b, C.ln(a))); },
    sqrt: function (a) { return C.pow(a, { r: 0.5, i: 0 }); },
    abs: function (a) { return { r: Math.sqrt(a.r * a.r + a.i * a.i), i: 0 }; },
    conj: function (a) { return { r: a.r, i: -a.i }; },
    re: function (a) { return { r: a.r, i: 0 }; },
  };

  /* ================= 词法 / 语法分析 ================= */
  function tokenize(src) {
    var tokens = [];
    var i = 0;
    var n = src.length;
    while (i < n) {
      var ch = src[i];
      if (ch === " " || ch === "\t") { i++; continue; }
      if (/[0-9.]/.test(ch)) {
        var j = i;
        while (j < n && /[0-9.eE+-]/.test(src[j])) {
          // 处理科学计数法中的 + -（仅允许在 e/E 之后）
          if ((src[j] === "+" || src[j] === "-") && !/[eE]/.test(src[j - 1])) break;
          j++;
        }
        var num = parseFloat(src.slice(i, j));
        tokens.push({ t: "num", v: num });
        i = j;
        continue;
      }
      if (/[a-zA-Z]/.test(ch)) {
        var k = i;
        while (k < n && /[a-zA-Z0-9_]/.test(src[k])) k++;
        var name = src.slice(i, k);
        if (name === "s") tokens.push({ t: "s" });
        else tokens.push({ t: "id", v: name });
        i = k;
        continue;
      }
      if (ch === "+" || ch === "-" || ch === "*" || ch === "/" || ch === "^" || ch === "(" || ch === ")") {
        tokens.push({ t: ch });
        i++;
        continue;
      }
      throw new Error("无法识别的字符: " + ch);
    }
    tokens.push({ t: "$" });
    return tokens;
  }

  function Parser(tokens) {
    this.ts = tokens;
    this.pos = 0;
  }
  Parser.prototype.peek = function () { return this.ts[this.pos]; };
  Parser.prototype.next = function () { return this.ts[this.pos++]; };
  Parser.prototype.expect = function (t) {
    var tk = this.next();
    if (tk.t !== t) throw new Error("语法错误：缺少 " + t);
    return tk;
  };

  // expression := term (('+'|'-') term)*
  Parser.prototype.parseExpr = function () {
    var node = this.parseTerm();
    while (this.peek().t === "+" || this.peek().t === "-") {
      var op = this.next().t;
      var rhs = this.parseTerm();
      node = { op: op, a: node, b: rhs };
    }
    return node;
  };
  // term := factor (('*'|'/') factor)*
  Parser.prototype.parseTerm = function () {
    var node = this.parseFactor();
    while (this.peek().t === "*" || this.peek().t === "/") {
      var op = this.next().t;
      var rhs = this.parseFactor();
      node = { op: op, a: node, b: rhs };
    }
    return node;
  };
  // factor := unary ('^' unary)*  （幂运算右结合）
  Parser.prototype.parseFactor = function () {
    var base = this.parseUnary();
    if (this.peek().t === "^") {
      this.next();
      var exp = this.parseFactor(); // 右结合
      return { op: "^", a: base, b: exp };
    }
    return base;
  };
  // unary := ('-'|'+') unary | primary
  Parser.prototype.parseUnary = function () {
    var tk = this.peek();
    if (tk.t === "-") {
      this.next();
      return { op: "neg", a: this.parseUnary() };
    }
    if (tk.t === "+") {
      this.next();
      return this.parseUnary();
    }
    return this.parsePrimary();
  };
  // primary := num | s | id | id '(' expr ')' | '(' expr ')'
  Parser.prototype.parsePrimary = function () {
    var tk = this.next();
    if (tk.t === "num") return { t: "num", v: tk.v };
    if (tk.t === "s") return { t: "s" };
    if (tk.t === "id") {
      if (this.peek().t === "(") {
        this.next();
        var arg = this.parseExpr();
        this.expect(")");
        return { t: "fn", f: tk.v, arg: arg };
      }
      return { t: "id", v: tk.v };
    }
    if (tk.t === "(") {
      var inner = this.parseExpr();
      this.expect(")");
      return inner;
    }
    throw new Error("表达式不完整");
  };

  /* 解析公式，返回 { ast, params: [名字...] } */
  function parseExpr(src) {
    var ast = new Parser(tokenize(src)).parseExpr();
    var params = [];
    (function collect(node) {
      if (!node || typeof node !== "object") return;
      if (node.t === "id" && params.indexOf(node.v) < 0) params.push(node.v);
      if (node.a) collect(node.a);
      if (node.b) collect(node.b);
      if (node.arg) collect(node.arg);
    })(ast);
    return { ast: ast, params: params };
  }

  /* 复数求值 */
  function evalNode(node, w, paramMap) {
    var a, b;
    switch (node.t) {
      case "num":
        return { r: node.v, i: 0 };
      case "s":
        return { r: 0, i: w };
      case "id":
        return { r: paramMap[node.v] || 0, i: 0 };
      case "fn":
        a = evalNode(node.arg, w, paramMap);
        switch (node.f.toLowerCase()) {
          case "exp": return C.exp(a);
          case "sqrt": return C.sqrt(a);
          case "abs": return C.abs(a);
          case "re": return C.re(a);
          case "conj": return C.conj(a);
          default: throw new Error("不支持的函数: " + node.f);
        }
      case "neg":
        a = evalNode(node.a, w, paramMap);
        return { r: -a.r, i: -a.i };
      default:
        a = evalNode(node.a, w, paramMap);
        b = evalNode(node.b, w, paramMap);
        switch (node.op) {
          case "+": return C.add(a, b);
          case "-": return C.sub(a, b);
          case "*": return C.mul(a, b);
          case "/": return C.div(a, b);
          case "^": return C.pow(a, b);
        }
    }
    throw new Error("未知节点");
  }

  /* ================= 参数默认值与滑杆范围 ================= */
  function paramMeta(name) {
    var lower = name.toLowerCase();
    if (lower === "k" || lower === "kp" || lower === "gain") return { val: 10, min: 0.01, max: 100, step: 0.1 };
    if (lower === "t" || lower === "tau") return { val: 1, min: 0.01, max: 10, step: 0.01 };
    if (lower === "xi" || lower === "zeta") return { val: 0.5, min: 0, max: 1, step: 0.01 };
    if (lower === "wn" || lower === "omega" || lower === "w") return { val: 1, min: 0.1, max: 20, step: 0.1 };
    return { val: 1, min: 0.01, max: 10, step: 0.01 };
  }

  /* ================= 绘制 ================= */
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) { return fallback; }
  }

  function drawBodeEditor(canvas, spec) {
    var isDark = document.documentElement.getAttribute("data-theme") === "dark";
    var cText = cssVar("--text", isDark ? "#d7d4cb" : "#4b4a46");
    var cMuted = cssVar("--text-muted", isDark ? "#97978d" : "#8b8a83");
    var cGrid = cssVar("--border", isDark ? "#3a3d38" : "#dcd8ce");
    var cBg = cssVar("--bg", isDark ? "#242624" : "#ffffff");
    var cLine = cssVar("--accent", isDark ? "#8fc7b2" : "#3d7a6b");
    var cLine2 = cssVar("--accent-pink", isDark ? "#c9a86a" : "#a07a3c");

    var fmin = spec.fmin || 0.01;
    var fmax = spec.fmax || 1000;
    var points = 200;

    var freq = [];
    for (var i = 0; i < points; i++) {
      var tt = i / (points - 1);
      freq.push(fmin * Math.pow(fmax / fmin, tt));
    }
    var mag = new Array(points);
    var phase = new Array(points);
    var ok = true;
    for (var j = 0; j < points; j++) {
      var h;
      try {
        h = evalNode(spec.ast, freq[j], spec.params);
      } catch (e) { ok = false; break; }
      if (!isFinite(h.r) || !isFinite(h.i)) { mag[j] = -200; phase[j] = phase[j - 1] || 0; continue; }
      mag[j] = 20 * Math.log10(Math.sqrt(h.r * h.r + h.i * h.i) || 1e-12);
      var ph = (180 / Math.PI) * Math.atan2(h.i, h.r);
      if (j > 0) {
        var d = ph - phase[j - 1];
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        ph = phase[j - 1] + d;
      }
      phase[j] = ph;
    }
    if (!ok) return false;

    // 计算 y 轴范围
    var magMin = Infinity, magMax = -Infinity, phMin = Infinity, phMax = -Infinity;
    for (var m = 0; m < points; m++) {
      if (mag[m] < magMin) magMin = mag[m];
      if (mag[m] > magMax) magMax = mag[m];
      if (phase[m] < phMin) phMin = phase[m];
      if (phase[m] > phMax) phMax = phase[m];
    }
    if (!isFinite(magMin)) magMin = -60;
    if (!isFinite(magMax)) magMax = 60;
    if (!isFinite(phMin)) phMin = -180;
    if (!isFinite(phMax)) phMax = 0;

    var magY = niceBounds(magMin, magMax, 5);
    var phY = niceBounds(phMin, phMax, 4);
    if (phY.max > 0 && phY.min < 0 && phMax <= 0) {
      phY = { min: phY.min, max: 0, step: niceStep(-phY.min, 4) };
    }

    var pad = { top: 30, right: 20, bottom: 30, left: 62 };
    var gap = 22;
    var containerW = canvas.parentElement ? canvas.parentElement.clientWidth : 800;
    var W = Math.max(containerW - 2, 240);
    var totalH = 440;
    var panelH = (totalH - pad.top - pad.bottom - gap) / 2;
    var H = totalH;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = cBg;
    ctx.fillRect(0, 0, W, H);

    // 标题
    ctx.fillStyle = cText;
    ctx.font = "600 14px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(spec.label || "Bode 图", W / 2, 8);

    function xPx(w) {
      return pad.left + (Math.log10(w) - Math.log10(fmin)) * (W - pad.left - pad.right) / (Math.log10(fmax) - Math.log10(fmin));
    }
    function yPx(v, y0, y1, yr) {
      return y1 - ((v - yr.min) / (yr.max - yr.min)) * (y1 - y0);
    }

    function drawPanel(y0, y1, yr, yLabel, dataFn, lineColor) {
      ctx.strokeStyle = cGrid;
      ctx.fillStyle = cMuted;
      ctx.font = "11px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (var v = yr.min; v <= yr.max + 1e-9; v += yr.step) {
        var py = yPx(v, y0, y1, yr);
        ctx.lineWidth = Math.abs(v) < 1e-9 ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(pad.left, py);
        ctx.lineTo(W - pad.right, py);
        ctx.stroke();
        ctx.fillStyle = cMuted;
        ctx.fillText(fmtY(v), pad.left - 8, py);
      }
      var pow = Math.pow(10, Math.ceil(Math.log10(fmin)));
      var kk = 0;
      while (pow <= fmax * 1.001) {
        if (pow >= fmin * 0.999) {
          var px = xPx(pow);
          ctx.lineWidth = 0.6;
          ctx.strokeStyle = cGrid;
          ctx.beginPath();
          ctx.moveTo(px, y0);
          ctx.lineTo(px, y1);
          ctx.stroke();
        }
        pow *= 10;
        kk++;
        if (kk > 12) break;
      }
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (var f = Math.pow(10, Math.ceil(Math.log10(fmin))); f <= fmax * 1.001; f *= 10) {
        if (f < fmin * 0.999 || f > fmax * 1.001) continue;
        ctx.fillStyle = cMuted;
        ctx.fillText(fmtFreq(f), xPx(f), y1 + 6);
      }
      ctx.save();
      ctx.translate(10, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = cMuted;
      ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (var ii = 0; ii < points; ii++) {
        var dx = xPx(freq[ii]);
        var dy = yPx(dataFn(ii), y0, y1, yr);
        if (ii === 0) ctx.moveTo(dx, dy);
        else ctx.lineTo(dx, dy);
      }
      ctx.stroke();
    }

    drawPanel(pad.top, pad.top + panelH, magY, "幅值 L(ω) / dB", function (i) { return mag[i]; }, cLine);
    drawPanel(pad.top + panelH + gap, pad.top + 2 * panelH + gap, phY, "相角 φ(ω) / °", function (i) { return phase[i]; }, cLine2);

    ctx.fillStyle = cText;
    ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("ω / (rad/s)", W / 2, pad.top + 2 * panelH + gap + 6);

    // 图例
    ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
    var legs = [
      { label: "幅值", color: cLine },
      { label: "相角", color: cLine2 },
    ];
    var lw = 0;
    legs.forEach(function (it) {
      var wd = ctx.measureText(it.label).width + 24;
      if (wd > lw) lw = wd;
    });
    var lh = legs.length * 18 + 8;
    var lx = W - pad.right - lw - 8;
    var ly = pad.top + 2;
    ctx.fillStyle = isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)";
    ctx.fillRect(lx, ly, lw, lh);
    legs.forEach(function (it, idx) {
      var yy = ly + 8 + idx * 18;
      ctx.strokeStyle = it.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx + 6, yy);
      ctx.lineTo(lx + 20, yy);
      ctx.stroke();
      ctx.fillStyle = cText;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(it.label, lx + 24, yy);
    });
    return true;
  }

  function niceStep(range, targetCount) {
    var raw = range / (targetCount || 5);
    var p = Math.pow(10, Math.floor(Math.log10(raw)));
    var m = raw / p;
    var step;
    if (m <= 1) step = 1;
    else if (m <= 2) step = 2;
    else if (m <= 5) step = 5;
    else step = 10;
    return step * p;
  }
  function niceBounds(min, max, targetCount) {
    if (!isFinite(min) || !isFinite(max)) { min = -60; max = 60; }
    if (Math.abs(max - min) < 1e-9) { max = min + 40; min = min - 40; }
    var step = niceStep(max - min, targetCount);
    return { min: Math.floor(min / step) * step, max: Math.ceil(max / step) * step, step: step };
  }
  function fmtFreq(f) {
    if (f >= 100) return String(Math.round(f));
    if (f >= 1) return f.toFixed(f % 1 === 0 ? 0 : 1);
    return String(f);
  }
  function fmtY(v) {
    if (Math.abs(v) < 1e-9) return "0";
    if (Math.round(v) === v) return String(v);
    return v.toFixed(1);
  }

  /* ================= 初始化编辑器 ================= */
  function init() {
    var box = document.getElementById("bode-editor");
    if (!box) return;
    var input = box.querySelector(".bode-expr-input");
    var paramsBox = box.querySelector(".bode-params");
    var canvas = box.querySelector("canvas");
    var errBox = box.querySelector(".bode-error");

    var paramMap = {};
    var ast = null;

    function render() {
      var label = "G(s) = " + input.value;
      drawBodeEditor(canvas, { ast: ast, params: paramMap, fmin: 0.01, fmax: 1000, label: label });
    }

    function buildParams(names) {
      paramsBox.innerHTML = "";
      names.forEach(function (name) {
        var meta = paramMeta(name);
        if (!(name in paramMap)) paramMap[name] = meta.val;
        var label = document.createElement("label");
        label.className = "bode-param";
        var title = document.createElement("span");
        title.className = "bode-param-name";
        title.textContent = name;
        var range = document.createElement("input");
        range.type = "range";
        range.min = meta.min;
        range.max = meta.max;
        range.step = meta.step;
        range.value = paramMap[name];
        var val = document.createElement("span");
        val.className = "bode-param-val";
        val.textContent = formatVal(paramMap[name]);
        range.addEventListener("input", function () {
          paramMap[name] = parseFloat(range.value);
          val.textContent = formatVal(paramMap[name]);
          render();
        });
        label.appendChild(title);
        label.appendChild(range);
        label.appendChild(val);
        paramsBox.appendChild(label);
      });
    }

    function apply() {
      try {
        var res = parseExpr(input.value);
        ast = res.ast;
        buildParams(res.params);
        if (errBox) errBox.textContent = "";
        render();
      } catch (e) {
        if (errBox) errBox.textContent = e.message;
      }
    }

    // 输入防抖，实时重绘
    var timer = null;
    input.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(apply, 300);
    });
    // 预设公式按钮
    box.querySelectorAll(".bode-preset-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        input.value = btn.dataset.expr;
        apply();
      });
    });

    apply();

    // 容器尺寸变化（tab 切换 / 窗口缩放）时重绘
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(render, 120);
    });
    if (typeof MutationObserver === "function") {
      var mo = new MutationObserver(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(render, 120);
      });
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
  }

  function formatVal(v) {
    return String(Math.round(v * 100) / 100);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
