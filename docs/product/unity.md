# Unity 快速接入

`com.eitan.easymic.apm` 将 EasyMic APM 原生声学处理接入现有 EasyMic 采集工作流。本指南面向使用 Package 的项目，不需要自行重新封装原生 API。

## 准备环境

| 项目 | 要求 |
| --- | --- |
| Unity | {{unityMinimum}} 或更高 |
| APM Package | {{unityVersion}} |
| EasyMic 基础 Package | {{easymicVersion}} |
| 授权 | 有效的 EasyMic APM 授权及所需能力权限 |
| Android | Minimum API Level {{androidMinimum}} 或更高 |
| 设备 | 正确配置麦克风权限与音频输入输出 |

当前支持 Windows、macOS、Linux、Android、iOS。请使用与 Package 配套的原生插件与托管绑定。

## 1. 安装 Package

`com.eitan.easymic.apm` 不是独立采集包，必须先安装 EasyMic 基础 Package。两个 Package 都安装完成后，APM 才能接入 `EasyMicrophone` 的采集流程。

第一步，在 Unity Package Manager 中安装 EasyMic 基础 Package：

```text
https://github.com/EitanWong/com.eitan.easymic.git#upm
```

确认基础 Package 可以正常导入并识别麦克风后，再安装 APM 扩展。购买授权后，通过作者提供的私有仓库访问或本地 Package 安装：

```text
https://github.com/EitanWong/com.eitan.easymic.apm.git#upm
```

APM 仓库的访问权限与交付方式由作者提供。导入 Package Manager 中的 **Audio Processing Example**，用于确认安装和授权状态。

安装顺序固定为：`com.eitan.easymic` → `com.eitan.easymic.apm`。请让两个 Package 使用兼容版本；基础 Package 的公开仓库与更新记录见 [EasyMic 基础 Package](https://github.com/EitanWong/com.eitan.easymic)。

## 2. 完成授权

打开 **Project Settings → Easy Mic → APM 授权**，按照[授权与购买](licensing.md)的流程完成授权。各项能力分别受权限控制；未授权功能会显示不可用原因。

完成授权后，`EasyMicrophone` 会识别 APM 扩展并将处理器接入采集管线。

## 3. 开始采集

在场景中设置 `EasyMicrophone` 组件，确保目标平台麦克风权限已被授予。

```csharp
using Eitan.EasyMic.Runtime;
using Eitan.EasyMic.Runtime.Mono;
using UnityEngine;

public sealed class ProcessedRecorder : MonoBehaviour
{
    [SerializeField] private EasyMicrophone microphone;

    private void Start()
    {
        if (!PermissionUtils.HasPermission())
            return;

        microphone.AudioProcessingOpts = AudioProcessingOptions.Default;
        microphone.Init();
        microphone.StartRecording();
    }

    private void OnDisable()
    {
        microphone.StopRecording();
    }
}
```

运行时可按需切换：

```csharp
microphone.AecEnabled = true;
microphone.AnsEnabled = true;
microphone.AgcEnabled = true;
```

## 4. 接好播放参考

要被软件 AEC 抵消的应用播放需要经过 EasyMic 播放链路，例如 `PlaybackAudioSource` 或 `PlaybackAudioSourceBehaviour`，这样 AEC 才能获得与真实输出一致的参考。

普通 Unity `AudioSource`、系统媒体与其他音频引擎不会自动进入 EasyMic 的播放参考。若实际输出包含这些声音，不能把不完整参考当作完整参考使用。自行管理处理器时，可将 `EasyMicApmModifier.RenderReferenceMatchesOutput` 设为 `false`；原生策略会旁路软件 AEC，避免错误自适应。

## 5. 按场景验证

分别验证外放、听筒、耳机、蓝牙与 USB 等实际使用路由。请测试同时播放与说话、安静环境与背景噪声、距离变化和路由切换。建议在最终构建与部署设备上验证，不只在 Editor 中检查。

## 扩展阅读

- [设备与声音配置](audio-setup.md)
- [实验性定向拾音](directional.md)
- [原生库接入](native.md)
- [版本与更新](releases.md)
