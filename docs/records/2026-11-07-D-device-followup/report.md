# D Pura 70 真机 F05–F10 补测

日期：2026-11-07。源码固定提交 `ab9691fda02a87c40cc162b166128b1a4d37aa46`；HAP 为前轮[本机调试签名产物](../2026-11-06-D-signed-device/report.md)，SHA-256 `AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`。本轮未重新构建或安装；该哈希关联前轮安装记录和本机产物，本轮未从设备回读安装包做逐字节比对。设备为 HUAWEI Pura 70（ADY-AL00），本轮重新读取 API 26、OpenHarmony 7.0.0.111，HDC USB Connected。此轮验证的是 **应用内业务路径**与**测试替身自检路径**，不是系统 Skill 调用。

## 采集与判定

每笔先确认 `uitest dumpLayout` 的前台包名为 `com.g1m1.skillagent`，通过 `TextInput` 节点核对实际输入，再收起键盘、重新读取“运行”按钮坐标并点击。长文本在宿主按 UTF-8 生成、`hdc file send` 传到设备，再在设备端使用 `uitest uiInput text "$(cat /data/local/tmp/<固定输入文件>)"` 注入；输入框全选使用 `uitest uiInput keyEvent 2072 2017`。对空输入使用全选后删除。所有输入都在运行前与预期逐字比较，emoji 另按 UTF-16 码元计数；不采用从宿主直接传 emoji 命令参数的失真结果。

页面输入框和输出框的原文保存在[UI 摘录](ui-captures.json)，逐项判定与同 requestId 的 `[G1M1]` 日志分别整理为[结果摘要](results.json)和[日志摘录](traces/)。仓库证据只保留 Demo 的固定测试输入、输出与校验摘要；含系统状态栏等其他设备信息的原始布局留在本机临时目录。证据文件大小和 SHA-256 见[清单](manifest.json)。

| 用例 | 真机输入与结果 | 日志核对 |
| --- | --- | --- |
| F05 | `长度 😀` → `g1-text-length / success / length=2 / utf16-code-unit` | 5 阶段，单次返回 |
| F06 | `查天气` → `ERR_NO_SKILL`，`skillId` 为空 | 3 阶段，无 `skill_started` |
| F07 | `回显`、空输入、5 个空格、`回显 `+1025 个 `a`、1101 个 `a` 均返回 `ERR_INVALID_PARAMS` | 分别为 3/2/2/3/2 阶段，均无 `skill_started` |
| F07 边界 | `长度 `+512 个真 😀：输入 1027 码元，返回 `length=1024`；`长度 `+513 个真 😀：输入 1029 码元，返回 `ERR_INVALID_PARAMS` | 前者 5 阶段，后者 3 阶段且无 `skill_started` |
| F08/F09 | 真机点击“执行器自检 F08/F09”，[九项判定](selfcheck-summary.json)全通过：抛错 `ERR_INTERNAL`，超时 `ERR_TIMEOUT`，迟到结果不改写、无重试 | 同一自检 requestId 下 8 条[日志](traces/F08-F09.txt)，路径为 `self-check`/测试替身；正式业务路径未注入故障 |
| F10 | 顺序输入 `回显 first`、`回显 second`，各自 `success` 且返回文本分别为 `first` / `second`；requestId 不同 | 各 5 阶段、各一次最终返回，无串包 |

F07 的 512/513 emoji 输入与前轮[固定输入文件](../2026-11-06-D-followup/fixtures/)同一生成口径；本轮的输入 SHA-256、码元长度和返回文本摘要保存在 `results.json`。F10 是两笔顺序应用内请求，不替代 A03 的真实外部入口并发/重复 ID 验收。

**结论：**F05–F10 的 Pura 70 真机应用内/自检用例已有逐项证据。S01/S02 的系统发现与执行、A01 扩展组件真实回调、A02 自建 Agent 主动调用、A03 外部并发，以及 E01 完整目标链路仍不能据此标为通过；所需交接见[验收表](../../acceptance.md)与[交付索引](../../delivery-index.md)。本轮未录制连续端到端视频。
