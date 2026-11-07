# D 真机 USB/HDC 连接预检

日期：2026-11-06。持有人确认本次连接的是此前记录的 HUAWEI Pura 70，且已升级系统。Windows 设备管理器显示 `HDC Device`；不在共享记录中保存 USB 实例 ID 或 HDC 设备序列号。

下载目录中的 `hdc.exe` 与 `libusb_shared.dll` 均有有效的 Huawei Technologies Co., Ltd. 数字签名。下载版与 DevEco Studio 自带的 HDC 均报告 `Ver: 3.2.0f`。两者最初都看到模拟器和一台 `Unauthorized` USB 设备；持有人在手机上允许 USB 调试后，执行 `hdc reconnect <设备 ID>`，再次查询显示该 USB 设备为 `Connected`。`<设备 ID>` 仅在本机命令中使用，没有写入本记录。

对这台 USB 设备运行只读 `param get`：

| 参数 | 实际值 |
| --- | --- |
| `const.ohos.apiversion` | `26` |
| `const.ohos.fullname` | `OpenHarmony-7.0.0.111` |
| `const.product.model` | `ADY-AL00` |

这纠正了此前 HarmonyOS 4.2.0 / HDC 无目标的旧设备状态。当前只确认连接和系统/API 版本。仓库 `build-profile.json5` 的 `signingConfigs` 仍为空，仓库中没有签名 HAP；本轮没有安装、启动或执行 Demo，也没有测试系统 Skill、扩展组件或端到端路径。真机 F/S/A/E 验收需固定签名 HAP、受支持调用方及平台条件后另建报告。
