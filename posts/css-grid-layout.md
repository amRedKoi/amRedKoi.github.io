CSS Grid 提供了一个基于网格的二维布局系统，非常适合卡片式页面。

## 基础语法

```css
/* 每列最小 240px，可伸缩 */
.posts {
  display: grid;
  grid-template-columns:
    repeat(auto-fill, minmax(240px, 1fr));
  gap: 20px;
}
```

## 解释

- `auto-fill`：尽量多放列。
- `minmax(240px, 1fr)`：每列至少 240px，剩余空间均分。

这样无需任何媒体查询，卡片就会自动换行并铺满屏幕，真正做到响应式。
