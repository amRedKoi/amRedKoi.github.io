# 经典自动控制原理中的最小相位环节及其各种形式

在经典自动控制理论中，研究系统动态特性最常用的工具之一，就是**传递函数**与其**频率特性**。而在分析频率特性时，根据零点与极点在复平面上的分布，系统可分为**最小相位系统**与**非最小相位系统**。

## 什么是最小相位系统

> 如果系统的全部**零点**和**极点**都位于 $s$ 平面的**左半平面**（不含虚轴），则称该系统为**最小相位系统**；否则称为**非最小相位系统**。

设系统传递函数为

$$
G(s)=\frac{K\prod_{i=1}^{m}(s+z_i)}{\prod_{j=1}^{n}(s+p_j)},\qquad n\ge m
$$

其中 $z_i>0$、$p_j>0$ 均为正实常数。当全部零点、极点都在左半平面时，幅值特性唯一地确定了系统的相频特性；反之，非最小相位系统在相同的幅频特性下会产生**额外的相位滞后**。

### 最小相位环节的判定

判断一个环节是否属于最小相位环节，可以遵循以下准则：

1. 系统的极点全部位于 $s$ 平面左半平面；
2. 系统的零点也全部位于 $s$ 平面左半平面；
3. 满足条件时，系统的相角变化范围最小，故得名"最小相位"。

## 基本的最小相位环节

在经典控制原理中，典型的环节通常以**频率特性**的形式给出，将 $s=j\omega$ 代入传递函数。下面逐一介绍常见的最小相位环节。

### 1. 比例环节

比例环节的输出与输入成正比，无惯性、无延迟：

$$
G(s)=K,\qquad G(j\omega)=K
$$

其对数幅频特性为一条水平直线：

$$
L(\omega)=20\lg K\quad\text{dB},\qquad \varphi(\omega)=0^\circ
$$

下图给出了不同增益 $K$ 下比例环节的 Bode 图。幅频特性为一族水平直线，$K$ 每增大 10 倍幅值上移 $20\ \text{dB}$，相频特性恒为 $0^\circ$：

```bode
{
  "title": "比例环节 Bode 图（不同增益 K）",
  "fmin": 0.01,
  "fmax": 100,
  "series": [
    { "label": "K = 1", "elements": [{ "type": "gain", "K": 1 }] },
    { "label": "K = 10", "elements": [{ "type": "gain", "K": 10 }] },
    { "label": "K = 100", "elements": [{ "type": "gain", "K": 100 }] }
  ],
  "magMin": -5,
  "magMax": 45,
  "phaseMin": -10,
  "phaseMax": 10
}
```

### 2. 积分环节

积分环节的传递函数为：

$$
G(s)=\frac{1}{s},\qquad G(j\omega)=\frac{1}{j\omega}=\frac{1}{\omega}e^{-j90^\circ}
$$

对数幅频特性为斜率 $-20\ \text{dB/dec}$ 的直线，相角恒为 $-90^\circ$：

$$
L(\omega)=-20\lg\omega,\qquad \varphi(\omega)=-90^\circ
$$

下图给出了积分环节 $\frac{1}{s}$ 与二重积分环节 $\frac{1}{s^2}$ 的 Bode 图。可见重数 $n$ 每增加 1，幅频斜率增加 $-20\ \text{dB/dec}$，相角增加 $-90^\circ$：

```bode
{
  "title": "积分环节 Bode 图",
  "fmin": 0.01,
  "fmax": 100,
  "series": [
    { "label": "1/s", "elements": [{ "type": "integrator", "K": 1, "n": 1 }] },
    { "label": "1/s²", "elements": [{ "type": "integrator", "K": 1, "n": 2 }] }
  ],
  "magMin": -90,
  "magMax": 90,
  "phaseMin": -200,
  "phaseMax": 0
}
```

### 3. 微分环节

微分环节与积分环节互为倒数：

$$
G(s)=s,\qquad G(j\omega)=j\omega=\omega e^{j90^\circ}
$$

对数幅频特性为斜率 $+20\ \text{dB/dec}$ 的直线，相角恒为 $+90^\circ$：

$$
L(\omega)=20\lg\omega,\qquad \varphi(\omega)=+90^\circ
$$

下图给出了微分环节 $s$ 与二阶微分环节 $s^2$ 的 Bode 图，与积分环节关于 $0\ \text{dB}$ 轴互为镜像：

```bode
{
  "title": "微分环节 Bode 图",
  "fmin": 0.01,
  "fmax": 100,
  "series": [
    { "label": "s", "elements": [{ "type": "differentiator", "K": 1, "n": 1 }] },
    { "label": "s²", "elements": [{ "type": "differentiator", "K": 1, "n": 2 }] }
  ],
  "magMin": -90,
  "magMax": 90,
  "phaseMin": 0,
  "phaseMax": 200
}
```

### 4. 惯性环节（一阶惯性环节）

惯性环节描述系统的储能与耗能特性，是最典型的**一阶最小相位环节**：

$$
G(s)=\frac{K}{Ts+1},\qquad G(j\omega)=\frac{K}{1+j\omega T}
$$

其频率特性可写为幅值、相角分离的形式：

$$
G(j\omega)=\frac{K}{\sqrt{1+(\omega T)^2}}\ e^{-j\arctan(\omega T)}
$$

对数幅频特性由两段渐近线近似：

- 当 $\omega \ll \frac{1}{T}$ 时，$L(\omega)\approx 20\lg K$（水平线）；
- 当 $\omega \gg \frac{1}{T}$ 时，$L(\omega)\approx 20\lg K-20\lg(\omega T)$（斜率 $-20\ \text{dB/dec}$）。

转折频率 $\omega_c=\frac{1}{T}$ 处，实际幅值为 $20\lg K-3\ \text{dB}$。

相角在 $0^\circ$ 与 $-90^\circ$ 之间变化：

$$
\varphi(\omega)=-\arctan(\omega T)
$$

下图给出了不同时间常数 $T$ 下惯性环节的 Bode 图。可见 $T$ 越大，转折频率 $\omega_c=\frac{1}{T}$ 越靠左，幅值下降和相角滞后越早出现：

```bode
{
  "title": "惯性环节 Bode 图（K = 1，不同时间常数 T）",
  "fmin": 0.01,
  "fmax": 1000,
  "series": [
    { "label": "T = 0.1", "elements": [{ "type": "inertia", "K": 1, "T": 0.1 }] },
    { "label": "T = 1", "elements": [{ "type": "inertia", "K": 1, "T": 1 }] },
    { "label": "T = 10", "elements": [{ "type": "inertia", "K": 1, "T": 10 }] }
  ]
}
```

### 5. 一阶微分环节

一阶微分环节可视为惯性环节的"逆"，分子含一阶零点：

$$
G(s)=Ts+1,\qquad G(j\omega)=1+j\omega T
$$

其频率特性为：

$$
G(j\omega)=\sqrt{1+(\omega T)^2}\ e^{j\arctan(\omega T)}
$$

对数幅频特性在 $\omega<\frac{1}{T}$ 时约为 $0\ \text{dB}$，在 $\omega>\frac{1}{T}$ 时以 $+20\ \text{dB/dec}$ 上升。相角从 $0^\circ$ 上升到 $+90^\circ$：

$$
\varphi(\omega)=+\arctan(\omega T)
$$

下图给出了不同时间常数 $T$ 下一阶微分环节的 Bode 图。它与惯性环节关于 $0\ \text{dB}$ 轴互为镜像，$T$ 越大转折频率 $\omega_c=\frac{1}{T}$ 越靠左：

```bode
{
  "title": "一阶微分环节 Bode 图（K = 1，不同时间常数 T）",
  "fmin": 0.01,
  "fmax": 1000,
  "series": [
    { "label": "T = 0.1", "elements": [{ "type": "lead", "K": 1, "T": 0.1 }] },
    { "label": "T = 1", "elements": [{ "type": "lead", "K": 1, "T": 1 }] },
    { "label": "T = 10", "elements": [{ "type": "lead", "K": 1, "T": 10 }] }
  ]
}
```

### 6. 振荡环节（二阶环节）

振荡环节描述具有能量交换的二阶系统，当阻尼比 $0<\xi<1$ 时呈欠阻尼振荡，是最重要的**二阶最小相位环节**：

$$
G(s)=\frac{\omega_n^2}{s^2+2\xi\omega_n s+\omega_n^2},\qquad G(j\omega)=\frac{\omega_n^2}{(j\omega)^2+2\xi\omega_n(j\omega)+\omega_n^2}
$$

归一化后可写成：

$$
G(j\omega)=\frac{1}{1-\left(\frac{\omega}{\omega_n}\right)^2+j2\xi\frac{\omega}{\omega_n}}
$$

其幅频特性为：

$$
A(\omega)=\frac{1}{\sqrt{\left[1-\left(\frac{\omega}{\omega_n}\right)^2\right]^2+\left(2\xi\frac{\omega}{\omega_n}\right)^2}}
$$

相频特性为：

$$
\varphi(\omega)=-\arctan\frac{2\xi\frac{\omega}{\omega_n}}{1-\left(\frac{\omega}{\omega_n}\right)^2}
$$

对数幅频特性以 $0\ \text{dB}$ 为低频渐近线，以 $-40\ \text{dB/dec}$ 为高频渐近线。在谐振频率

$$
\omega_r=\omega_n\sqrt{1-2\xi^2}\qquad(0<\xi<0.707)
$$

处出现**谐振峰**，峰值大小为：

$$
M_r=A(\omega_r)=\frac{1}{2\xi\sqrt{1-\xi^2}}
$$

下图给出了不同阻尼比 $\xi$ 下振荡环节的 Bode 图。可以看到 $\xi$ 越小，谐振峰越突出，相角在 $\omega_n$ 附近变化越急剧：

```bode
{
  "title": "振荡环节 Bode 图（K = 1，ωn = 1，不同阻尼比 ξ）",
  "fmin": 0.01,
  "fmax": 100,
  "series": [
    { "label": "ξ = 0.1", "elements": [{ "type": "osc", "K": 1, "wn": 1, "xi": 0.1 }] },
    { "label": "ξ = 0.3", "elements": [{ "type": "osc", "K": 1, "wn": 1, "xi": 0.3 }] },
    { "label": "ξ = 0.5", "elements": [{ "type": "osc", "K": 1, "wn": 1, "xi": 0.5 }] },
    { "label": "ξ = 0.707", "elements": [{ "type": "osc", "K": 1, "wn": 1, "xi": 0.707 }] }
  ]
}
```

### 7. 二阶微分环节

二阶微分环节与振荡环节互为倒数，分子含一对共轭复零点：

$$
G(s)=T^2s^2+2\xi Ts+1
$$

其频率特性为：

$$
G(j\omega)=1-\left(\frac{\omega}{\omega_n}\right)^2+j2\xi\frac{\omega}{\omega_n}
$$

对数幅频特性低频渐近线为 $0\ \text{dB}$，高频以 $+40\ \text{dB/dec}$ 上升；相角从 $0^\circ$ 上升到 $+180^\circ$。

下图给出了不同阻尼比 $\xi$ 下二阶微分环节的 Bode 图。与振荡环节关于 $0\ \text{dB}$ 轴互为镜像，$\xi$ 越小，$\omega_n$ 附近的"反谐振谷"越深、相角变化越急剧：

```bode
{
  "title": "二阶微分环节 Bode 图（K = 1，ωn = 1，不同阻尼比 ξ）",
  "fmin": 0.01,
  "fmax": 100,
  "series": [
    { "label": "ξ = 0.1", "elements": [{ "type": "osc2", "K": 1, "wn": 1, "xi": 0.1 }] },
    { "label": "ξ = 0.3", "elements": [{ "type": "osc2", "K": 1, "wn": 1, "xi": 0.3 }] },
    { "label": "ξ = 0.707", "elements": [{ "type": "osc2", "K": 1, "wn": 1, "xi": 0.707 }] }
  ]
}
```

## 最小相位环节的共性规律

综合以上各类最小相位环节，可以总结出几条重要规律：

1. **幅频与相频一一对应**：最小相位系统的相频特性完全由幅频特性唯一决定，无须单独测量相频即可判断系统特性。
2. **相角随频率单调变化**：对于最小相位环节，对数幅频特性斜率为 $-20k\ \text{dB/dec}$ 时，对应的相角趋近于 $-k\times90^\circ$。
3. **斜率和相角的关系**：
   - 斜率 $-20\ \text{dB/dec}$ 对应相角 $-90^\circ$；
   - 斜率 $-40\ \text{dB/dec}$ 对应相角 $-180^\circ$；
   - 斜率 $+20\ \text{dB/dec}$ 对应相角 $+90^\circ$。
4. **无额外的相位滞后**：相较于非最小相位环节（如一阶不稳定性环节 $G(s)=\frac{1}{1-Ts}$ 或带延迟环节），最小相位环节在相同的幅频特性下具有最小的相位滞后，故系统更稳定、动态响应更好。

## 最小相位与非最小相位的对比

| 对比项 | 最小相位系统 | 非最小相位系统 |
| --- | --- | --- |
| 零点位置 | 全部在左半平面 | 存在右半平面零点 |
| 极点位置 | 全部在左半平面 | 存在右半平面极点 |
| 幅频特性确定相频特性 | 可以唯一确定 | 不能唯一确定 |
| 相角滞后 | 最小 | 存在额外滞后 |
| 典型环节 | 惯性、振荡、比例、积分等 | 不稳定环节、延迟环节 |

## 典型例题

**例**：已知某最小相位系统的开环传递函数为

$$
G(s)=\frac{K}{s(Ts+1)}
$$

试分析其频率特性。

**解**：该系统包含一个积分环节 $\frac{1}{s}$ 和一个惯性环节 $\frac{1}{Ts+1}$，两者均为最小相位环节。其频率特性为

$$
G(j\omega)=\frac{K}{j\omega(1+j\omega T)}
$$

取 $K=10,\ T=0.1$，该系统的 Bode 图如下。可见低频渐近线以 $-20\ \text{dB/dec}$ 穿过 $0\ \text{dB}$ 于 $\omega=K=10$，在转折频率 $\omega=\frac{1}{T}=10$ 处实际幅值比渐近线低 $3\ \text{dB}$，之后以 $-40\ \text{dB/dec}$ 下降；相角从 $-90^\circ$ 单调趋于 $-180^\circ$：

```bode
{
  "title": "例题系统 G(s) = 10 / (s(0.1s+1)) 的 Bode 图",
  "fmin": 0.01,
  "fmax": 1000,
  "series": [
    { "label": "G(s)", "elements": [
      { "type": "gain", "K": 10 },
      { "type": "integrator", "K": 1, "n": 1 },
      { "type": "inertia", "K": 1, "T": 0.1 }
    ]}
  ]
}
```

对数幅频特性由两段渐近线组成：

- 低频段（$\omega<\frac{1}{T}$）：斜率 $-20\ \text{dB/dec}$；
- 高频段（$\omega>\frac{1}{T}$）：斜率 $-40\ \text{dB/dec}$。

相频特性为

$$
\varphi(\omega)=-90^\circ-\arctan(\omega T)
$$

从 $-90^\circ$ 单调下降到 $-180^\circ$，满足最小相位系统的相角变化规律。

## 小结

最小相位环节是经典自动控制原理中频率分析法的基础。掌握比例、积分、微分、惯性、一阶微分、振荡、二阶微分这七类基本环节的**传递函数**、**幅频特性**与**相频特性**，是绘制 Bode 图、进行系统分析与校正的前提。理解"最小相位"背后"幅频唯一确定相频"的本质，对判断系统的稳定性与动态品质至关重要。
