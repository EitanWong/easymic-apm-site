# 版本与更新

| 组件 | 当前介绍版本 |
| --- | --- |
| 原生 SDK | {{nativeVersion}} |
| Unity APM Package | {{unityVersion}} |
| EasyMic 依赖 | {{easymicVersion}} |
| Unity 最低版本 | {{unityMinimum}} |

## 原生 SDK 3.1

统一 `easymic_apm_*` API 提供基础声学处理和默认关闭的实验性阵列定向能力。定向功能需要独立授权，不能仅凭 AEC、ANS、AGC 授权启用。

当前集成约定使用 config v6、wrapper ABI 11。原生库、头文件与托管绑定必须配套更新，旧布局不能与新库混用。

## Unity Package

Package 将原生处理接入 EasyMic，并使用 EasyMic 的实际播放混音作为 AEC 参考。可以按应用场景选择声学能力，读取授权与处理状态。

定向扩展属于实验性功能，需要显式项目设置和对应权限；已有基础采集项目不需要启用它。

## 更新建议

1. 保存项目当前配置，核对 Package 与基础 EasyMic 依赖。
2. 成套更新原生插件、托管绑定与头文件。
3. 确认授权与所需能力状态。
4. 在 Editor 和最终目标构建上检查采集、播放参考及路由切换。
5. 按你的场景复核声音效果，再交付。

## 产品网站更新

网站与产品文档在同一仓库维护。价格、联系方式和版本集中在 `site/product.json`；网页版指南由 `docs/product/` 中的 Markdown 生成。

GitHub Pages 部署工作流会在主分支上的站点、产品文档和相关构建脚本更新后重新发布。用户无需安装运行时前端依赖即可浏览。
