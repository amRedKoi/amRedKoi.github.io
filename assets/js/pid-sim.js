/**
 * PID 动态可视化仿真
 * 一个真实的闭环控制动画：被控对象在 PID 控制器作用下跟踪目标并收敛。
 * 交互：调节 Kp / Ki / Kd 增益、切换目标信号（阶跃 / 正弦 / 扰动）。
 *
 * 对象模型：二阶惯性系统  G(s) = 1 / (s^2 + 2ζω s + ω^2)
 * 离散化后用前向欧拉更新，PID 采用位置式 + 抗积分饱和。
 */
(function () {
  const canvas = document.querySelector("#pid-canvas");
  if (!canvas || typeof canvas.getContext !== "function") return;

  const ctx = canvas.getContext("2d");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  // ---------- 参数 ----------
  const PARAMS = {
    kp: 1.6,
    ki: 0.35,
    kd: 0.5,
  };
  const OBJECT = {
    wn: 2.2, // 固有角频率
    zeta: 0.35, // 阻尼比
  };
  const DT = 0.02; // 仿真步长 (s)

  // ---------- 运行时状态 ----------
  let sim = {
    y: 0, // 对象输出
    ydot: 0, // 输出一阶导数
    u: 0, // 控制量
    integral: 0, // 积分项（带限幅）
    prevErr: 0,
    prevY: 0, // 上一拍输出（用于微分先行）
    prevInput: 0, // 上一拍设定值（用于微分先行，避免阶跃冲激）
    hist: [], // 历史点 {t, ref, y, u}
    t: 0,
    mode: "step", // step | sine | disturb
  };
  const MAX_HIST = 600;
  const INTEGRAL_LIMIT = 3;

  // ---------- UI 引用 ----------
  const refs = {
    modeBtns: document.querySelectorAll("#pid-sim .pid-mode-btn"),
    kp: document.querySelector("#pid-kp"),
    ki: document.querySelector("#pid-ki"),
    kd: document.querySelector("#pid-kd"),
    kpVal: document.querySelector("#pid-kp-val"),
    kiVal: document.querySelector("#pid-ki-val"),
    kdVal: document.querySelector("#pid-kd-val"),
    // 数据读数
    ref: document.querySelector("#pid-readout-ref"),
    y: document.querySelector("#pid-readout-y"),
    err: document.querySelector("#pid-readout-err"),
    u: document.querySelector("#pid-readout-u"),
    t: document.querySelector("#pid-readout-t"),
  };

  // ---------- 目标信号 ----------
  /** 外部扰动：仅在抗扰动模式下，于 7s 处施加一个脉冲干扰 */
  function externalDisturbance(t) {
    if (sim.mode !== "disturb") return 0;
    // 7s 开始持续 1.5s 的干扰脉冲
    return t >= 7 && t < 8.5 ? 2.2 : 0;
  }

  function reference(t) {
    switch (sim.mode) {
      case "sine":
        // 起始从 0 平滑爬升至正弦，避免开场大跳变
        const ramp = clamp(t / 2, 0, 1);
        return ramp * (1 + 0.55 * Math.sin(2 * Math.PI * 0.35 * t));
      case "disturb":
        return t < 2 ? 0 : 1; // 目标恒定，2s 阶跃，靠扰动考验控制器
      default:
        return t < 2 ? 0 : 1; // 2s 时阶跃
    }
  }

  // ---------- 一步仿真 ----------
  function step() {
    const dt = DT;
    const ref = reference(sim.t);
    const d = externalDisturbance(sim.t); // 外部扰动（作用在被控对象上）

    // 误差（微分作用采用"微分先行"，作用于输出的负变化率，避免阶跃冲击）
    const err = ref - sim.y;
    sim.integral = clamp(sim.integral + err * dt, -INTEGRAL_LIMIT, INTEGRAL_LIMIT);
    const deriv = -(sim.y - sim.prevY) / dt; // 对输出求负微分 ≈ d(ref-y)/dt 的平滑形式
    sim.prevY = sim.y;

    // 位置式 PID
    const u =
      PARAMS.kp * err + PARAMS.ki * sim.integral + PARAMS.kd * deriv;
    sim.u = clamp(u, -4, 4); // 执行器限幅

    // 二阶惯性对象：y'' + 2ζω y' + ω²y = ω²(u - d)
    const acc =
      OBJECT.wn * OBJECT.wn * (sim.u - sim.y - d) -
      2 * OBJECT.zeta * OBJECT.wn * sim.ydot;
    sim.ydot += acc * dt;
    sim.y += sim.ydot * dt;
    sim.prevErr = err;

    sim.hist.push({ t: sim.t, ref, y: sim.y, u: sim.u });
    if (sim.hist.length > MAX_HIST) sim.hist.shift();
    sim.t += dt;
  }

  function clamp(v, lo, hi) {
    return v < lo ? lo : v > hi ? hi : v;
  }

  // ---------- 绘制 ----------
  let W = 0;
  let H = 0;
  const pad = { top: 16, right: 14, bottom: 44, left: 14 };

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function plotW() {
    return W - pad.left - pad.right;
  }
  function plotH() {
    return H - pad.top - pad.bottom;
  }

  // ---------- 坐标变换（固定 Y 轴范围，简洁直观） ----------
  // 纵轴展示范围：略高于目标与输出的典型区间
  const Y_MIN = 0;
  const Y_MAX = 1.6;

  function xOf(t) {
    // 时间轴：最近 MAX_HIST*DT 秒
    const tMin = sim.t - MAX_HIST * DT;
    return pad.left + ((t - tMin) / (MAX_HIST * DT)) * plotW();
  }

  function yOf(v) {
    return pad.top + ((Y_MAX - v) / (Y_MAX - Y_MIN)) * plotH();
  }

  // ---------- 曲线工具 ----------
  function traceSeries(key, color, width, dash) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash || []);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let started = false;
    for (const p of sim.hist) {
      const x = xOf(p.t);
      if (x < pad.left - 1) continue;
      const y = yOf(p[key]);
      if (!started) {
        ctx.moveTo(x, y);
        started = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function cssVar(name, fallback) {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return v || fallback;
    } catch (e) {
      return fallback;
    }
  }

  // ---------- 主绘制 ----------
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // 函数图配色随主题：浅色白底深墨，深色深底浅墨
    const isDark = document.documentElement.getAttribute("data-theme") === "dark";
    const cGrid = cssVar("--border", isDark ? "#3a3d38" : "#dcd8ce");
    const cAccent = cssVar("--accent", isDark ? "#9fb1a6" : "#85958c");
    const cAccentBlue = cssVar("--accent-blue", isDark ? "#a2b4be" : "#8da0ab");
    const cAccentPink = cssVar("--accent-pink", isDark ? "#bdaba6" : "#b3a09a");
    const cMuted = cssVar("--text-muted", isDark ? "#97978d" : "#8b8a83");
    const cHalo = isDark ? "#242624" : "#ffffff";

    // 网格（固定刻度）
    ctx.strokeStyle = cGrid;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = pad.top + (i / 5) * plotH();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(W - pad.right, y);
    }
    for (let i = 0; i <= 4; i++) {
      const x = pad.left + (i / 4) * plotW();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, H - pad.bottom);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 设定值（目标，虚线）
    traceSeries("ref", cAccentBlue, 1.6, [6, 5]);

    // 实际输出（主曲线：底层柔光 + 上层实线，更有质感）
    // 柔光底层：同色半透明粗线
    ctx.save();
    ctx.strokeStyle = cAccent;
    ctx.lineWidth = 5;
    ctx.globalAlpha = 0.16;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    let glowStarted = false;
    for (const p of sim.hist) {
      const x = xOf(p.t);
      if (x < pad.left - 1) continue;
      const y = yOf(p.y);
      if (!glowStarted) {
        ctx.moveTo(x, y);
        glowStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.restore();
    // 上层实线
    traceSeries("y", cAccent, 2.3, []);

    // 控制量 u（底部区域，虚线）
    ctx.strokeStyle = cAccentPink;
    ctx.lineWidth = 1.3;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    let uStarted = false;
    for (const p of sim.hist) {
      const x = xOf(p.t);
      if (x < pad.left - 1) continue;
      const y = H - pad.bottom - ((clamp(p.u, -2.5, 2.5) + 2.5) / 5) * (pad.bottom - 16) - 5;
      if (!uStarted) {
        ctx.moveTo(x, y);
        uStarted = true;
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 当前值标记点
    const last = sim.hist[sim.hist.length - 1];
    if (last) {
      const dotX = xOf(last.t);
      // 输出当前值
      ctx.fillStyle = cAccent;
      ctx.beginPath();
      ctx.arc(dotX, yOf(last.y), 3.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = cHalo;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // 目标当前值
      ctx.fillStyle = cAccentBlue;
      ctx.beginPath();
      ctx.arc(dotX, yOf(last.ref), 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 底部 u 轴标签
    ctx.fillStyle = cMuted;
    ctx.font = "10px inherit";
    ctx.textBaseline = "bottom";
    ctx.textAlign = "center";
    ctx.fillText("控制量 u(t)（执行器输出）", pad.left + plotW() / 2, H - 2);

    // 数据读数
    if (refs.ref && last) {
      refs.ref.textContent = last.ref.toFixed(2);
      refs.y.textContent = last.y.toFixed(2);
      refs.err.textContent = (last.ref - last.y).toFixed(3);
      refs.u.textContent = last.u.toFixed(2);
      refs.t.textContent = sim.t.toFixed(1) + "s";
    }
  }

  // ---------- 交互 ----------
  function setMode(mode, btn) {
    sim.mode = mode;
    // 切换时清零状态，重新收敛更直观
    sim.y = 0;
    sim.ydot = 0;
    sim.u = 0;
    sim.integral = 0;
    sim.prevY = 0;
    sim.hist = [];
    sim.t = 0;
    refs.modeBtns.forEach((b) => b.classList.toggle("active", b === btn));
  }

  refs.modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => setMode(btn.dataset.mode, btn));
  });

  function bindSlider(input, valEl, key) {
    if (!input) return;
    input.addEventListener("input", () => {
      PARAMS[key] = parseFloat(input.value);
      if (valEl) valEl.textContent = PARAMS[key].toFixed(2);
    });
  }
  bindSlider(refs.kp, refs.kpVal, "kp");
  bindSlider(refs.ki, refs.kiVal, "ki");
  bindSlider(refs.kd, refs.kdVal, "kd");

  // 首帧同步滑块显示
  if (refs.kpVal) refs.kpVal.textContent = PARAMS.kp.toFixed(2);
  if (refs.kiVal) refs.kiVal.textContent = PARAMS.ki.toFixed(2);
  if (refs.kdVal) refs.kdVal.textContent = PARAMS.kd.toFixed(2);

  // ---------- 动画循环 ----------
  let running = true;
  function loop() {
    if (running) {
      // 多步仿真以匹配刷新率（约 60fps 下每帧走 1 步即可，dt=0.02s 平缓）
      step();
      draw();
    }
    requestAnimationFrame(loop);
  }

  // 视口内可见时才运行，降低开销
  const io = new IntersectionObserver((entries) => {
    running = entries[0].isIntersecting;
  });
  io.observe(canvas);

  window.addEventListener("resize", resize);
  resize();
  loop();
})();
