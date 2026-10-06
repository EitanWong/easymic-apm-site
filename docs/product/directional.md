# 实验性定向拾音

定向拾音是 APM 的阵列扩展。它利用多麦输入的空间信息，关注设定方向或当前主声源的声学轨迹。基础 AEC、ANS、AGC 不依赖这项扩展。

## 开启条件

- 2–16 路独立、同步的物理麦克风输入。
- 按 PCM 通道顺序提供实测阵列几何。
- 授权包含 `Directional` 权限。
- Unity 项目启用实验功能开关。

普通立体声、复制的单声道，不能代替同步阵列。手机、平板或摄像头有多个麦克风，也不表示操作系统提供了可用的独立同步通道。

## 固定与跟踪

**固定方向**：在设定的目标方向上波束赋形，需要有效的实测几何。

**自动跟踪**：根据当前稳定声源的声学轨迹关注主声音。Track 是声学轨迹，不是持久的说话人身份，也不是声纹识别。

```csharp
modifier.SetDirectionalPickup(new EasyMicDirectionalPickupConfiguration(
    enabled: true,
    mode: EasyMicDirectionalMode.Fixed,
    geometry: measuredArrayGeometry,
    targetAngleDegrees: 90f));
```

这段代码需要使用配套 Package、有效处理器和已测量的 `measuredArrayGeometry`。

## Unity 项目设置

在 **Project Settings → Easy Mic → APM 授权 → 编辑器 · 实验性功能** 启用实验开关，等待脚本重新编译。开关与许可证权限都满足后，界面才提供相应选项。

导入 **Directional Pickup** 样例，可查看就绪状态、声源轨迹与延迟等状态。具体接口以交付 Package 文档为准。

## 实际边界

- 短双麦阵列与线阵存在镜像方向歧义，空间分辨率有限。
- 混响、多个同时说话的人和移动会影响方向估计及抑制。
- 开启功能不表示当前已有有效空间估计，预热和回退状态需读取诊断。
- 输入输出采样率保持外部约定，空间引擎内部为 16 kHz；高于 8 kHz 的内容不会保留。
- 更新周期不等于端到端延迟。

当前不承诺“只留下目标语音”或在所有设备上强力抑制其他方向。实际验收必须使用目标硬件与场地数据。

## 网页动画

产品页中的方向图是概念动画。光锥宽度和声源标记不表示真实波束响应、抑制量或实测轨迹。
