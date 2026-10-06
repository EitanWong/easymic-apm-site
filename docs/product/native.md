# 原生库接入

EasyMic APM 提供跨平台原生声学处理库，用于 Unity、.NET 和其他 FFI 宿主。SDK 和源代码授权可通过作者微信 **{{wechat}}** 单独沟通。

## 支持平台

| 平台 | 常见发布产物 |
| --- | --- |
| Windows | `easymic-apm.dll` |
| macOS | `libeasymic-apm.dylib`，x86_64 + arm64 |
| Linux | `libeasymic-apm.so` |
| Android | `libeasymic-apm.so`，最低 API {{androidMinimum}} |
| iOS | `libeasymic-apm.a`，arm64 |

具体架构按交付包选择。库与绑定应一起更新，避免混用版本。

## 音频接口约定

- 公共 C API 使用 `easymic_apm_*` 前缀。
- 数据为交错的 signed 16-bit PCM，固定 **10 ms** 帧。
- 支持 8、16、32、48 kHz。
- 每通道帧长为 `sampleRate / 100`，可通过 `easymic_apm_get_frame_size()` 查询。
- 原生宿主负责真实采集、播放、缓冲、生命周期与路由管理。

例如 48 kHz 下，每帧每通道有 480 个采样。不要把任意大小的音频回调直接当作固定帧提交。

## 基本接入顺序

1. 调用 `easymic_apm_license_authorize` 完成授权。
2. 初始化配套版本的 `easymic_apm_config`，创建 handle。
3. 调用 `easymic_apm_initialize`，提交实际宿主路由与延迟状态。
4. 在播放链路提交 `easymic_apm_process_reverse_stream_i16`。
5. 在采集链路提交 `easymic_apm_process_stream_i16`。
6. 按需读取诊断，结束时销毁 handle。

具体结构体与参数以交付包中的 `easymic_apm.h` 为准。当前原生 SDK {{nativeVersion}} 使用 config v6、wrapper ABI 11；头文件、绑定与二进制应配套。

## AEC 的播放参考

软件 AEC 必须接收完整的实际播放混音参考，并保持与采集一致的时钟、帧节奏以及正确的宿主缓冲延迟。参考不匹配时，应向库报告，避免在错误参考上自适应。

[设备与声音配置](audio-setup.md)说明常见回声原因与排查方式。

## Unity 开发者

如果使用 EasyMic Package，优先按[Unity 快速接入](unity.md)使用现成扩展。只有自行组织音频管线或接入其他宿主时，才需要直接管理原生调用。

## 定向扩展

基础 APM 可用于普通麦克风。空间方向能力需要独立同步的物理阵列通道，详见[实验性定向拾音](directional.md)。
