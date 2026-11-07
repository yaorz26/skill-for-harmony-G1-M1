# D 调试签名与 Pura 70 安装启动

日期：2026-11-06。源码固定提交：`ab9691fda02a87c40cc162b166128b1a4d37aa46`。设备：HUAWEI Pura 70（ADY-AL00），API 26，OpenHarmony 7.0.0.111，USB/HDC Connected；连接与版本的原始预检见[USB 记录](../2026-11-06-D-usb-probe/report.md)。本轮验证 F01 的签名构建、F02 的真机安装与控件操作，以及 F03/F04 的应用内示例。

## 签名与构建

依据华为[自动生成签名文件说明](https://developer.huawei.com/consumer/cn/doc/HarmonyOS-Guides/ide-signing-auto)，在 DevEco Studio 26.0.0.851 的英文路径临时工程中登录开发者账号，进入 Project Structure → Signing Configs，勾选“自动生成签名文件”，保持“关联已注册应用”未勾选，确认生成 `default` 调试签名。IDE 将签名材料写入本机；临时工程 `build-profile.json5` 出现一项 `HarmonyOS` 签名配置，证书、Profile 和密钥文件均在本机存在。首次命令行构建虽然退出码为 0，但明确提示 `No signingConfig found for product default`，所以首次产物未用于安装。

随后仅在临时工程内把 `default` 产品的 `signingConfig` 指向 IDE 生成的 `default` 项，再执行 `assembleHap --no-daemon`。第二次构建退出码 0，`SignHap` 完成，生成 `entry/build/default/outputs/default/entry-default-signed.hap`，大小 162984 字节，SHA-256：`AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`。签名 HAP 与包含密码的临时构建配置均未复制到仓库；仓库原始 `build-profile.json5` 未改动，也不在共享记录中保存账号、口令、证书、密钥或设备序列号。复现签名构建需要在本机 DevEco Studio 重新生成或使用持有人授权的签名材料。

## 真机安装与启动

对已连接的 USB 目标执行 `hdc app install <signed HAP>`，返回 `install bundle successfully`，退出码 0。随后执行 `hdc shell aa start -a EntryAbility -b com.g1m1.skillagent`，返回 `start ability successfully`，退出码 0。真机 `uitest dumpLayout` 成功，获取的当前界面包含 `com.g1m1.skillagent`、`EntryAbility` 及演示页的“回显”“长度”“查天气”“运行”控件。布局原件只保存在本机临时目录，避免将设备界面的其他信息写入仓库。

首次尝试点击示例控件时，手机前台已切到其他应用，点击后的布局不属于本 Demo；该次点击不计入可操作性或业务用例证据。

## 再次操作（同日）

重新启动 `EntryAbility` 并用 `uitest dumpLayout` 确认前台包名后，读取实时控件坐标，点击“回显示例”。随后输入框确认为 `回显 你好，鸿蒙`；点击“运行”，页面返回 `g1-echo / success / data.text=你好，鸿蒙 / in-app`，requestId 为 `ui-1793978270126-5`。这次 F02 的控件操作留证成立，F03 真机应用内用例通过。

继续点击“长度示例”，先核对输入框为 `长度 你好ABC`，再按当时页面布局中的“运行”坐标点击。页面返回 `g1-text-length / success / data.length=5 / utf16-code-unit / in-app`，requestId 为 `ui-1793978374742-7`，F04 真机应用内用例通过。过滤后的结果见[重试结果](retry-results.json)。页面会因结果区域展开而改变控件坐标；中间按旧坐标点击的一次没有产生新请求，不计入用例。

设备持有人另表示已亲自试过其他示例且均可用；目前没有对应逐项输入、回包和日志记录，因此该口头反馈不等同于 D 对 F05–F10 的逐项真机验收。

结论：F01 的 IDE 同步与签名构建、F02 的真机安装/启动/控件操作，以及 F03/F04 真机**应用内**路径有证据。F05–F10 的真机逐项证据、S01/S02、A01–A03、E01 的真实系统调用路径仍待完成；A02 的公共发起接口缺失仍是独立阻断。
