# The Moon Remembers · short-address free hosting

This is the clean static deployment copy of The Moon Remembers, prepared separately from the original editing project. GitHub Pages publishes only `site/`. See the repository's Actions tab for the latest deployment result.

- Repository: https://github.com/the-moon-remembers/the-moon-remembers.github.io
- Configured website address: https://the-moon-remembers.github.io/
- Deployment workflow: https://github.com/the-moon-remembers/the-moon-remembers.github.io/actions/workflows/pages.yml
- Existing website retained: https://suyihong20060219-cell.github.io/the-moon-remembers/

The configured address becomes available after a successful Pages deployment. Creating the repository or enabling Pages alone does not mean publication has finished.

## 零费用方案

- 使用 GitHub Free 的公开仓库和 GitHub Pages，先用免费的 `github.io` 地址。
- 不购买域名、不租服务器、不启用付费套餐、Codespaces 或付费运行器。
- 仓库内的网站代码和媒体文件将公开；不包含原工程的 Git 记录、账号凭据、内部笔记、原始 Downloads 或访客的浏览器本地收藏。
- 这个方案不等于保证中国大陆免 VPN 稳定访问；发布成功后，仍需要在大陆移动网络与家庭网络分别实测。如果效果不合适，再讨论其他托管，不自动产生任何购买。

## 发布与后续更新

1. 仓库与 GitHub Pages 已配置，Pages 的发布来源是 **GitHub Actions**。不需要安装依赖、租服务器或运行付费构建。
2. 后续更新时，从原编辑工程经过验证的 `dist/` 刷新 `site/`，检查差异，再提交并推送到本仓库的 `main` 分支。保留 `.github/workflows/pages.yml`。
3. 不要提交原工程的 Git 历史、内部配置、账号凭据或用户本地上传的数据，也不要把 ZIP 文件直接当作网页入口提交。
4. 推送会触发发布。在 Actions 中确认发布成功，再检查真实网页，不要仅凭仓库更新判断网站已更新。
5. 所有登录、邮箱验证和授权由账号所有者完成；不要在代码、聊天或提交记录中分享密码、验证码、令牌或密钥。

由已授权的 Git/连接工具提交这个干净目录；不要把 ZIP 文件本身作为网页入口上传。

## Package layout

```text
README.md
.github/workflows/pages.yml
site/
  index.html
  home.html
  lost.html
  assets/
  vendor/
  ...
```

The workflow publishes **only `site/`**, not this README, the workflow directory or the original workspace. It uses GitHub's own Pages actions and the automatic short-lived `GITHUB_TOKEN`; no personal access token or paid service is embedded. It runs only for `main` pushes or an explicit manual dispatch, not untrusted pull requests.

## Continuation and validation

- `site/` is an exact copy of the public runtime from the current version, including the three unique TV videos, four disjoint photo channels and custom bilingual photograph picker. No animation/media quality was reduced for hosting.
- Each fresh opening or reload starts in English; a manual language choice remains active while navigating within that visit. Music preferences and added photographs are browser-local; moving to a new domain does not move saved visitor additions automatically. Keep the original website available for any backups.
- The shell uses hash navigation and relative assets, suitable for this organization-root address as well as a project subpath. HTTPS must remain enabled because camera gestures need a secure context and explicit permission.
- Check Home entry/audio, Explore gate, all three gesture rooms and Back, six films, language switch, photo constellation, uploads and TV navigation at the real deployed URL.
- The original editing project remains separate. Later updates should refresh `site/` from its verified `dist/` files before publishing, rather than editing two divergent copies independently.

Official references (checked during preparation):

- Free/public Pages availability and size limits: https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- GitHub's own static deployment workflow: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
