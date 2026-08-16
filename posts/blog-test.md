# 文章标题（此处写一句话副标题也行，主标题在 posts.js 的 title 字段）

> **使用说明（发布前请删除本引用块）**
>
> 1. 复制本文件为 `posts/你的文章名.md`（建议英文小写 + 连字符，如 `posts/control-theory-notes.md`）
> 2. 在 `assets/js/posts.js` 的 `window.posts` 数组顶部新增一条记录：
>
>    ```js
>    {
>      id: "control-theory-notes",   // 与文件名一致，用于 post.html?id=
>      title: "文章标题",
>      category: "技术",             // 或 随笔 / 控制 / 前端 等
>      date: "2026-08-16",           // YYYY-MM-DD
>      excerpt: "一句话摘要，显示在首页卡片上",
>      file: "posts/control-theory-notes.md",
>    }
>    ```
>
> 3. `git add` 提交后 `git push` 到 main，GitHub Actions 自动部署并更新 RSS。
>
> 本模板涵盖站点支持的全部 Markdown 语法，按需删除不用的段落即可。

## 二级标题

### 三级标题

#### 四级标题

正文段落直接书写即可，**段落之间用空行分隔**。这是第二个段落，用来演示段落换行。

## 文字样式

- **加粗**：`**加粗**`
- *斜体*：`*斜体*`
- ~~删除线~~：`~~删除线~~`
- `行内代码`：反引号包裹
- 上标 / 下标（建议用 LaTeX）：$x^2$、$a_i$

## 链接与图片

链接：[amRedKoi 个人小站](https://amRedKoi.github.io)

图片：

![占位图片（可替换为任意图片地址）](https://amRedKoi.github.io/assets/favicon.svg)

> 图片建议使用相对路径（如 `assets/xxx.png`）或可公开访问的图床链接。

## 公式（LaTeX / KaTeX）

行内公式用单个美元符包裹：欧拉公式 $e^{i\pi}+1=0$，根式 $\sqrt{x^2+y^2}$，分式 $\frac{a}{b}$，求和 $\sum_{k=1}^{n} k$。

独立成行的大公式用双美元符包裹，可跨多行：

$$
x=\frac{-b\pm\sqrt{b^2-4ac}}{2a}
$$

多行块级公式（KaTeX 支持 `aligned` 环境）：

$$
\begin{aligned}
G(s) &=\frac{K}{s(Ts+1)}\\
     &=\frac{K}{Ts^2+s}
\end{aligned}
$$

转义美元符（输出字面 `$`）：价格是 `\$5.00`，这不是公式。

> 公式由 KaTeX 排版，内容首尾不能是空格；KaTeX 不支持的命令会原样显示，不会报错。

## 引用块

> 这是一段引用。
>
> 引用内可以继续使用**加粗**、`行内代码` 与 $E=mc^2$ 等语法。

## 列表

无序列表：

- 第一项
  - 嵌套子项
  - 嵌套子项二
- 第二项

有序列表：

1. 第一步
2. 第二步
3. 第三步

## 代码块

指定语言后自动语法高亮（支持 js/ts/html/css/json/python/bash/sql/java/c/go/rust 等）：

```python
def bode_mag(K, T, omega):
    """惯性环节幅频特性（dB）"""
    return 20 * math.log10(K / math.sqrt(1 + (omega * T) ** 2))
```

```bash
pnpm install
pnpm run vendor
pnpm start
```

不指定语言则按纯文本显示：

```
这是纯文本代码块
```

## 表格（GFM）

| 环节 | 传递函数 | 相角范围 |
| :--- | :--- | ---: |
| 惯性 | $\dfrac{K}{Ts+1}$ | $0^\circ \to -90^\circ$ |
| 积分 | $\dfrac{1}{s}$ | $-90^\circ$ |
| 微分 | $s$ | $+90^\circ$ |

> 表格内同样可以使用行内公式；`:---` 控制左对齐，`---:` 右对齐，`---` 居中。

## Bode 图（站点特色能力）

使用 ```bode 代码块 + JSON 规范即可绘制双面板 Bode 图（幅频 dB + 相频 °），无需任何图片文件：

```bode
{
  "title": "惯性环节 Bode 图（K = 1，不同时间常数 T）",
  "fmin": 0.01,
  "fmax": 1000,
  "series": [
    { "label": "T = 0.1", "elements": [{ "type": "inertia", "K": 1, "T": 0.1 }] },
    { "label": "T = 1", "elements": [{ "type": "inertia", "K": 1, "T": 1 }] }
  ]
}
```

支持的环节类型：

| type | 含义 | 关键参数 |
| --- | --- | --- |
| `gain` | 比例 | `K` |
| `integrator` | 积分 | `K`, `n`（重数） |
| `differentiator` | 微分 | `K`, `n` |
| `inertia` | 惯性 | `K`, `T`, `n` |
| `lead` | 一阶微分 | `K`, `T`, `n` |
| `osc` | 振荡 | `K`, `wn`, `xi` |
| `osc2` | 二阶微分 | `K`, `wn`, `xi` |
| `delay` | 纯延迟 | `T` |
| `poly` | 任意多项式零极点 | `num`, `den` |

## 分割线

上面的内容到此为止，下面是分隔线：

---

## 其他

- 水平分割线：`---`
- 转义特殊字符：`\*`、`\#`、`\>`、`\$`
- 多级标题共六档（`#` ~ `######`），正文建议从 `##` 开始
- 文章末尾可加「参考资料」列表，方便读者追溯

## 参考资料

1. 作者名.《书名》. 出版社, 年份.
2. 链接标题: https://example.com
