GitHub Pages 是 GitHub 提供的免费静态站点托管服务。

## 部署步骤

1. 在 GitHub 新建仓库，命名为 `<用户名>.github.io`。
2. 将本地静态文件推送到仓库。
3. 访问 `https://<用户名>.github.io` 即可。

## 绑定自定义域名

在仓库 `Settings → Pages` 中填写自定义域名，并在 DNS 服务商添加 CNAME 记录即可。

```text
# CNAME 示例
www  CNAME  用户名.github.io
```

这样一个免费的博客就上线啦。
