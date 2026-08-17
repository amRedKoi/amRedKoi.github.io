/**
 * bode.js —— 零依赖 Canvas Bode 图绘制器
 *
 * 用法：在 Markdown 文章中使用 ```bode 语言代码块写 JSON 规范，
 * 会被 markdown.js 渲染为 <div class="bode-plot" data-spec="...">，
 * 本脚本扫描并绘制幅频特性（dB）与相频特性（°）双面板图。
 *
 * 规范格式：
 * {
 *   "title": "图表标题（可选）",
 *   "fmin": 0.01, "fmax": 1000,          // 频率范围 ω (rad/s)
 *   "series": [
 *     {
 *       "label": "曲线名称",
 *       "elements": [                      // 环节串联（相乘）
 *         { "type": "gain",        "K": 1 },
 *         { "type": "integrator",  "K": 1, "n": 1 },
 *         { "type": "differentiator", "K": 1, "n": 1 },
 *         { "type": "inertia",     "K": 1, "T": 1, "n": 1 },
 *         { "type": "lead",        "K": 1, "T": 1, "n": 1 },
 *         { "type": "osc",         "K": 1, "wn": 1, "xi": 0.5 },
 *         { "type": "osc2",        "K": 1, "wn": 1, "xi": 0.5 },
 *         { "type": "delay",       "T": 1 },
 *         { "type": "poly",        "num": [1], "den": [1, 1] }
 *       ]
 *     }
 *   ]
 * }
 */
(function () {
  "use strict";

  var COLORS = ["#71817a", "#8da0ab", "#b3a09a", "#9aa88b", "#b0907a", "#7a8ca6", "#a67f8e"];

  /* ---------- 复数运算 ---------- */
  function add(a, b) {
    return { r: a.r + b.r, i: a.i + b.i };
  }
  function sub(a, b) {
    return { r: a.r - b.r, i: a.i - b.i };
  }
  function mul(a, b) {
    return { r: a.r * b.r - a.i * b.i, i: a.r * b.i + a.i * b.r };
  }
  function div(a, b) {
    var d = b.r * b.r + b.i * b.i;
    return { r: (a.r * b.r + a.i * b.i) / d, i: (a.i * b.r - a.r * b.i) / d };
  }
  function polyVal(coeffs, s) {
    // coeffs: [a_n, a_{n-1}, ..., a_0]
    var out = { r: 0, i: 0 };
    for (var k = 0; k < coeffs.length; k++) {
      out = add(mul(out, s), { r: coeffs[k], i: 0 });
    }
    return out;
  }

  /* ---------- 环节频率响应：返回 { r, i } ---------- */
  function elementResponse(el, w) {
    var T = el.T || 1;
    var K = el.K === undefined ? 1 : el.K;
    var n = el.n === undefined ? 1 : el.n;
    var jw = { r: 0, i: w };
    var z = { r: 1, i: w * T }; // 1 + jωT
    var q; // 分母 s^2 + 2ξωn s + ωn^2
    var r;
    switch (el.type) {
      case "gain":
        return { r: K, i: 0 };
      case "integrator":
        // K / s^n = K / (jω)^n
        r = { r: K, i: 0 };
        for (var a = 0; a < n; a++) r = div(r, jw);
        return r;
      case "differentiator":
        // K · s^n = K · (jω)^n
        r = { r: K, i: 0 };
        for (var b = 0; b < n; b++) r = mul(r, jw);
        return r;
      case "inertia":
        // K / (1 + jωT)^n
        r = { r: K, i: 0 };
        for (var c = 0; c < n; c++) r = div(r, z);
        return r;
      case "lead":
        // K · (1 + jωT)^n
        r = { r: K, i: 0 };
        for (var d = 0; d < n; d++) r = mul(r, z);
        return r;
      case "osc": {
        // K·ωn² / (s² + 2ξωn s + ωn²)
        var wn = el.wn || 1;
        var xi = el.xi === undefined ? 0.5 : el.xi;
        q = { r: wn * wn - w * w, i: 2 * xi * wn * w };
        return div({ r: K * wn * wn, i: 0 }, q);
      }
      case "osc2": {
        // K · (s² + 2ξωn s + ωn²) / ωn²
        var wn2 = el.wn || 1;
        var xi2 = el.xi === undefined ? 0.5 : el.xi;
        q = { r: wn2 * wn2 - w * w, i: 2 * xi2 * wn2 * w };
        return { r: (K * q.r) / (wn2 * wn2), i: (K * q.i) / (wn2 * wn2) };
      }
      case "delay":
        // e^{-jωT}
        return { r: Math.cos(-w * T), i: Math.sin(-w * T) };
      case "poly":
        return div(
          polyVal(el.num || [K], jw),
          polyVal(el.den || [1, 0], jw)
        );
      default:
        return { r: K, i: 0 };
    }
  }

  /* ---------- 频率响应数组（含 unwrap 后的相角） ---------- */
  function computeSeries(series, fmin, fmax, points) {
    var freq = [];
    for (var i = 0; i < points; i++) {
      var t = i / (points - 1);
      freq.push(fmin * Math.pow(fmax / fmin, t));
    }
    var mag = new Array(points);
    var phase = new Array(points);
    for (var j = 0; j < points; j++) {
      var h = { r: 1, i: 0 };
      var els = series.elements || [];
      for (var k = 0; k < els.length; k++) {
        h = mul(h, elementResponse(els[k], freq[j]));
      }
      mag[j] = 20 * Math.log10(Math.sqrt(h.r * h.r + h.i * h.i) || 1e-12);
      var ph = (180 / Math.PI) * Math.atan2(h.i, h.r);
      // 相位 unwrap（连续展开）
      if (j > 0) {
        var d = ph - phase[j - 1];
        while (d > 180) d -= 360;
        while (d < -180) d += 360;
        ph = phase[j - 1] + d;
      }
      phase[j] = ph;
    }
    // ±180° 方向归一化：atan2 主值在 ±180° 处有歧义。
    // 当整条曲线几乎恒定在 ±180° 时，按幅频斜率符号决定方向
    // （幅值随 ω 递减 -> -180°，递增 -> +180°）。
    var phMax = Math.max.apply(null, phase);
    var phMin = Math.min.apply(null, phase);
    if (phMax - phMin < 40 && Math.abs(phMax) > 160) {
      var slope = mag[mag.length - 1] - mag[0];
      if (slope < -1e-6 && phMax > 0) {
        for (var u = 0; u < points; u++) phase[u] -= 360;
      } else if (slope > 1e-6 && phMin < 0) {
        for (var v = 0; v < points; v++) phase[v] += 360;
      }
    }
    return { freq: freq, mag: mag, phase: phase };
  }

  /* ---------- 辅助：刻度步长 ---------- */
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
    if (!isFinite(min) || !isFinite(max)) {
      min = -60;
      max = 60;
    }
    if (Math.abs(max - min) < 1e-9) {
      max = min + 40;
      min = min - 40;
    }
    var step = niceStep(max - min, targetCount);
    return {
      min: Math.floor(min / step) * step,
      max: Math.ceil(max / step) * step,
      step: step,
    };
  }

  /* ---------- 主题颜色 ---------- */
  function cssVar(name, fallback) {
    try {
      var v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  /* ---------- 绘制 ---------- */
  function drawBode(canvas, spec) {
    // 函数图配色随主题：浅色白底深墨，深色深底浅墨
    var isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    var cText = cssVar("--text", isDark ? "#d7d4cb" : "#4b4a46");
    var cMuted = cssVar("--text-muted", isDark ? "#97978d" : "#8b8a83");
    var cGrid = cssVar("--border", isDark ? "#3a3d38" : "#dcd8ce");
    var cBg = cssVar("--bg", isDark ? "#242624" : "#ffffff");

    var seriesList = spec.series || [];
    var fmin = spec.fmin || 0.01;
    var fmax = spec.fmax || 1000;
    var points = 120;

    var data = seriesList.map(function (s) {
      return computeSeries(s, fmin, fmax, points);
    });

    // 幅频 / 相频取值范围
    var magMin = Infinity,
      magMax = -Infinity,
      phMin = Infinity,
      phMax = -Infinity;
    data.forEach(function (d) {
      for (var i = 0; i < points; i++) {
        if (d.mag[i] < magMin) magMin = d.mag[i];
        if (d.mag[i] > magMax) magMax = d.mag[i];
        if (d.phase[i] < phMin) phMin = d.phase[i];
        if (d.phase[i] > phMax) phMax = d.phase[i];
      }
    });
    if (!isFinite(magMin)) magMin = -60;
    if (!isFinite(magMax)) magMax = 60;
    if (!isFinite(phMin)) phMin = -180;
    if (!isFinite(phMax)) phMax = 0;

    // 支持 spec 手动指定 y 轴范围（如恒 0° 相角的环节）
    if (typeof spec.magMin === "number") magMin = spec.magMin;
    if (typeof spec.magMax === "number") magMax = spec.magMax;
    if (typeof spec.phaseMin === "number") phMin = spec.phaseMin;
    if (typeof spec.phaseMax === "number") phMax = spec.phaseMax;

    var magY = niceBounds(magMin, magMax, 5);
    var phY = niceBounds(phMin, phMax, 4);
    // 保证相频面板坐标轴方向自然（负值在下）
    if (phY.max > 0 && phY.min < 0 && phMax <= 0) {
      phY = { min: phY.min, max: 0, step: niceStep(-phY.min, 4) };
    }

    // 布局
    var pad = { top: 34, right: 20, bottom: 30, left: 60 };
    var gap = 22;
    var containerW = canvas.parentElement ? canvas.parentElement.clientWidth : 860;
    var W = Math.max(containerW - 2, 240);
    var totalH = spec.height || 430;
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
    if (spec.title) {
      ctx.fillStyle = cText;
      ctx.font = "600 14px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(spec.title, W / 2, 10);
    }

    // x 轴：对数主刻度 1×10^k
    function xPx(w) {
      return pad.left + (Math.log10(w) - Math.log10(fmin)) * (W - pad.left - pad.right) / (Math.log10(fmax) - Math.log10(fmin));
    }
    function yPx(v, y0, y1, yr) {
      return y1 - ((v - yr.min) / (yr.max - yr.min)) * (y1 - y0);
    }

    var decades = Math.floor(Math.log10(fmax)) - Math.ceil(Math.log10(fmin));

    function drawPanel(y0, y1, yr, yLabel, dataFn) {
      // 主网格 + 标签
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
        ctx.fillText(String(v), pad.left - 8, py);
      }
      // x 主刻度网格（竖线）
      var pow = Math.pow(10, Math.ceil(Math.log10(fmin)));
      var k = 0;
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
        k++;
        if (k > 12) break;
      }
      // 轴标签（x 轴刻度文字，画在第一面板下方即可；第二面板底部再画一次）
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      var firstPow = Math.pow(10, Math.ceil(Math.log10(fmin)));
      for (var f = firstPow; f <= fmax * 1.001; f *= 10) {
        if (f < fmin * 0.999 || f > fmax * 1.001) continue;
        var fx = xPx(f);
        ctx.fillStyle = cMuted;
        ctx.fillText(formatFreq(f), fx, y1 + 6);
      }
      // y 轴标题
      ctx.save();
      ctx.translate(10, (y0 + y1) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = cMuted;
      ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
      ctx.fillText(yLabel, 0, 0);
      ctx.restore();

      // 数据曲线
      data.forEach(function (d, idx) {
        var col = COLORS[idx % COLORS.length];
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (var i = 0; i < points; i++) {
          var dx = xPx(d.freq[i]);
          var dy = yPx(dataFn(d)[i], y0, y1, yr);
          if (i === 0) ctx.moveTo(dx, dy);
          else ctx.lineTo(dx, dy);
        }
        ctx.stroke();
      });
    }

    drawPanel(pad.top, pad.top + panelH, magY, "幅值 L(ω) / dB", function (d) {
      return d.mag;
    });
    drawPanel(pad.top + panelH + gap, pad.top + 2 * panelH + gap, phY, "相角 φ(ω) / °", function (d) {
      return d.phase;
    });

    // x 轴标签（底部）
    ctx.fillStyle = cText;
    ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("ω / (rad/s)", W / 2, pad.top + 2 * panelH + gap + 6);

    // 图例（幅频面板右上角）
    if (seriesList.length > 1 || (seriesList[0] && seriesList[0].label)) {
      ctx.font = "12px Segoe UI, PingFang SC, Microsoft YaHei, sans-serif";
      var legItems = seriesList.map(function (s, idx) {
        return { label: s.label || ("曲线 " + (idx + 1)), color: COLORS[idx % COLORS.length] };
      });
      var lw = 0;
      legItems.forEach(function (it) {
        var w = ctx.measureText(it.label).width + 24;
        if (w > lw) lw = w;
      });
      var lh = legItems.length * 18 + 8;
      var lx = W - pad.right - lw - 8;
      var ly = pad.top + 4;
      ctx.fillStyle = isDark ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.6)";
      ctx.fillRect(lx, ly, lw, lh);
      ctx.fillStyle = cMuted;
      legItems.forEach(function (it, idx) {
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
    }
  }

  function formatFreq(f) {
    if (f >= 100) return String(Math.round(f));
    if (f >= 1) return f.toFixed(f % 1 === 0 ? 0 : 1);
    return String(f);
  }

  /* ---------- 解析并绘制所有 .bode-plot ---------- */
  function renderBodePlots(root) {
    var nodes = (root || document).querySelectorAll(".bode-plot");
    nodes.forEach(function (el) {
      if (el.dataset.bodeDone) return;
      el.dataset.bodeDone = "1";
      var spec = {};
      try {
        spec = JSON.parse(el.dataset.spec || "{}");
      } catch (e) {
        spec = { error: "Bode 图规范解析失败" };
      }
      var canvas = document.createElement("canvas");
      el.appendChild(canvas);
      if (spec.error) {
        canvas.style.width = "100%";
        canvas.style.height = "60px";
        var ctx2 = canvas.getContext("2d");
        ctx2.font = "13px sans-serif";
        ctx2.fillStyle = "#b0534f";
        ctx2.fillText(spec.error, 12, 30);
        return;
      }
      drawBode(canvas, spec);
    });
  }

  function initBode() {
    renderBodePlots(document);
    // 文章内容是异步填充的，监听 DOM 变化补绘
    if (typeof MutationObserver === "function") {
      var timer = null;
      var mo = new MutationObserver(function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
          renderBodePlots(document);
        }, 80);
      });
      mo.observe(document.body, { childList: true, subtree: true });
    }
    // 窗口尺寸变化（含手机旋转/侧边栏开合）后重绘，跟随容器宽度
    var resizeTimer = null;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        document.querySelectorAll(".bode-plot canvas").forEach(function (c) {
          var wrapper = c.parentElement;
          wrapper.dataset.bodeDone = "";
          wrapper.removeChild(c);
        });
        renderBodePlots(document);
      }, 150);
    });
    // 主题切换后重绘
    if (typeof MutationObserver === "function") {
      var themeMo = new MutationObserver(function () {
        document.querySelectorAll(".bode-plot canvas").forEach(function (c) {
          var wrapper = c.parentElement;
          wrapper.dataset.bodeDone = "";
          wrapper.removeChild(c);
        });
        renderBodePlots(document);
      });
      themeMo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initBode);
  } else {
    initBode();
  }
  window.renderBodePlots = renderBodePlots;
})();
