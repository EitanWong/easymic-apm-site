# EasyMic APM 产品站点

产品介绍、授权价格、购买入口与可搜索的使用文档。纯静态运行，无前端框架、无 CDN 或运行时服务；支持 GitHub Pages 仓库子路径。

## 目录

- `site/index.html`：产品页模板。
- `site/assets/`：本地 CSS、JavaScript、图像与封面。
- `site/product.json`：统一的价格、版本、微信与购买链接。
- `site/docs.json`：文档清单、排序与分组。
- `site/templates/docs.html`：文档布局。
- `docs/product/*.md`：网页版产品文档的 Markdown 源文件。
- `scripts/build_site.py`：生成 HTML 并检查内部链接与锚点。
- `.github/workflows/pages.yml`：主分支更新自动部署，PR 仅构建验证。
- `_site/`：本地生成结果，不提交到 Git。

## 本地预览

```sh
python3 -m venv .local/site-venv
.local/site-venv/bin/pip install -r scripts/requirements-site.txt
.local/site-venv/bin/python scripts/build_site.py
python3 -m http.server 8765 --bind 127.0.0.1 --directory _site
```

打开 `http://127.0.0.1:8765/`。开发时修改源码后重新运行构建命令；不要直接编辑 `_site/`。

## GitHub Pages 部署

原生代码仓库保持私有，当前账户方案不支持为私有仓库启用 Pages；本仓库的 Actions 负责构建和链接校验。公开产品站点与文档维护在独立仓库：

`https://github.com/EitanWong/easymic-apm-site`

公开访问地址：`https://EitanWong.github.io/easymic-apm-site/`

后续更新产品页或文档时，将 `site/`、`docs/product/`、`scripts/build_site.py`、`scripts/requirements-site.txt` 与 `.github/workflows/pages.yml` 同步到公开站点仓库并推送 `main`，Pages 会自动重新构建。全部站内资产与文档采用相对路径，主页与深层文档可直接刷新。

## 持续更新

1. 修改 `product.json` 中的价格、微信、购买地址或产品版本；它们通过 `{{字段}}` 注入产品页和文档。
2. 修改 `docs/product/` 指南。添加新文档时同时加入 `docs.json`。
3. 重新构建，检查页面、链接和目标平台上的说明。
4. 提交到主分支，Pages 自动更新。

原生算法与 Unity Package 在独立交付工作流更新后，应在同一产品发布中更新这里的版本与指南。网站不调用私有仓库接口，不需要购买者拥有 GitHub 权限就能阅读。

## 交互与动画

- AEC、ANS、AGC 开关只改变概念动画，不采集或上传声音。
- 固定关注方向与声源位置独立；跟踪模式沿概念轨迹运动。
- 动画使用单一帧时钟，暂停冻结时间；开关在暂停时仍会重绘。
- 进入视口时逐层出现，CSS 光泽、微动和授权绑定流线增强产品视觉。
- 遵从系统“减少动态效果”；页脚允许手动暂停。
- 文档全文关键词搜索在本地完成，不请求外部服务。

## 视频封面

`assets/images/video-cover-4k.png` 与 `video-cover-1080p.png`。源文件为 `cover.html`，在生成站点中以 1920×1080 视口、2×像素比例截图即可输出 4K。
