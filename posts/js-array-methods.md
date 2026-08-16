数组方法能让你用更少的代码完成更清晰的数据处理。

## 常用方法

- `map`：对每个元素做变换，返回新数组。
- `filter`：筛选满足条件的元素。
- `find`：找到第一个匹配的元素。
- `reduce`：归约，把数组累计为单个值。

## 示例

```js
const nums = [1, 2, 3, 4, 5];

const doubled = nums.map(n => n * 2); // [2,4,6,8,10]
const evens = nums.filter(n => n % 2 === 0); // [2,4]
const total = nums.reduce((s, n) => s + n, 0); // 15
```

掌握这些方法，你的代码会更简洁、更易读。
