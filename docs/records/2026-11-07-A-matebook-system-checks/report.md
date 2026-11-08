# A：MateBook 全量应用内补测与系统入口尝试

日期：2026-11-07（北京时间）。按设备持有人的要求，由 A 补充依赖真机的执行与证据；本轮没有修改 B/C 的路由、业务或执行器，也没有代改 D 的验收表。

## 固定版本、构建与安装

- 应用内补测源码：`00cc4f0f9754df0eebfb23c9a7bc063dc775bcfc`。在前轮 MateBook 适配基础上，补齐 `agent_config.json` 的 `appInfo.deviceTypes` 中的 `2in1`；模块配置已经包含该类型。
- 设备：用户提供的 HUAWEI MateBook 14（MNTXM-24B），API 26、OpenHarmony 7.0.0.109、`2in1`、arm64-v8a。前轮[设备与安装记录](../2026-11-07-A-matebook/report.md)适用；本轮在同一 HDC WiFi 会话重新安装。
- 独立临时签名工程构建成功：9.529 秒、33 tasks。安装器明确返回 `install bundle successfully`，启动明确返回 `start ability successfully`，后续 UI 树读取到实际测试结果。签名材料不入库。
- HAP：162906 bytes，SHA-256 `2AD7E5F79A152E53051892D148D942EA5E3F2CE30532A13633589EC9B1C800A5`。这是本机已安装产物的哈希，没有从设备回读安装包做字节比对。详见[安全构建摘要](build-summary.json)。
- 对比仓库与签名工程的应用源码、资源文件，差异为零；最终 HAP 内的 AgentCard 和模块均包含 `2in1`，见[打包配置摘录](packaged-registration.json)。设备包管理器读回扩展类型 `agent`（37）和元数据引用；注册不等于连接成功。

## 应用内真机补测

每笔输入前从 Demo 所属 UI 子树读取输入框位置，用 UTF-8 文件传到设备后注入；运行前逐字核对实际文本。每次点击运行重新读取控件位置。原始桌面布局留本机，仓库只保留固定测试输入、结果与本应用事件。

| 用例 | 输入 / 结果 | 判定 |
| --- | --- | --- |
| F03 | `回显 你好，鸿蒙`，原文返回 | 通过 |
| F04 | `长度 你好ABC`，length=5 | 通过 |
| F05 | `长度 😀`，length=2、utf16-code-unit | 通过 |
| F06 | `查天气`，ERR_NO_SKILL | 通过 |
| F07 | 缺参、空输入、5 个空格、1025 码元参数、1101 码元总输入均 ERR_INVALID_PARAMS | 5 个变体通过 |
| F07 边界 | `长度 `+512 个真 emoji 返回 length=1024；513 个返回 ERR_INVALID_PARAMS | 2 个边界通过 |
| F08/F09 | 抛错、超时、迟到结果不改写、不重试、正常对照 | 9 项自检断言通过 |
| F10 | 顺序执行 `回显 first`、`回显 second`，独立 requestId 与对应结果 | 通过 |

13 笔应用内输入全部通过，见[逐项 UI 结果](ui-results.json)。每笔按 requestId 提取事件，成功路径均为 5 阶段；失败均无 skill_started，所有请求恰好一次 response_returned。见[关联检查](trace-checks.json)与[事件摘录](runtime-trace.jsonl)。F10 是顺序应用内请求，不替代 A03 外部并发。

F08/F09 使用 C 交付的测试替身，executionPath=self-check，见[自检结果](selfcheck.json)。没有向正式样例注入故障，不能把自检计为系统 Skill 调用。该轮自检仅归档 UI 断言结果，没有单独归档自检日志。

## 小艺与扩展组件的真实入口尝试

这组尝试发生于 AgentCard 补齐 2in1 **之前**，被测应用沿用前轮源码 `3f080148c29d1767536445355b6b06c86c8f9f99`。修复后只重新进行了上表应用内补测，未复测小艺；因此下述观察不能直接作为最终修复版本的系统发现结论。

设备持有人自行完成小艺首次隐私授权与初始化。随后在小艺真实对话页核对输入、发送固定请求并读取对应回复；没有以 Demo 运行按钮替代系统入口。仅摘录本轮请求与回复，详见[系统尝试](system-probes.json)。

| 请求 | 小艺实际回复 / 观察 | 结论 |
| --- | --- | --- |
| 点名 g1-text-length 计算 你好ABC | 普通回答长度为 5 | 没有系统入口、执行和结果上报的关联证据，不能算通过 |
| 点名已安装 Skill Agent Demo 的 g1-echo | 回答尚未安装并推荐应用市场结果 | 未调起目标；该回复不能推翻已有安装证据 |
| 点名 g1m1-skill-agent 回显固定标记 | 明确回复未找到该智能体 | 没有获得目标组件连接和回调证据 |

当时过滤 G1M1 的 hilog 缓冲无输出，只作为辅助观察；日志缓冲或过滤可能影响结果，不以无日志单独判定组件失败。系统回复也可能由模型生成，不作为完整系统调度记录。

## 已核实的外部前提与后续操作

1. 华为[ArkTS 应用 Skill 指导](https://developer.huawei.com/consumer/cn/doc/doccenter-capabilities/arkts-skill-development-guide)要求开发后导入 HAP，再做真机测试。[导入 Skill](https://developer.huawei.com/consumer/cn/doc/service/import-skill-0000002592931542)官方示意图明确支持 ZIP（10 MB）和 HAP（100 MB）。
2. [Skill 真机测试](https://developer.huawei.com/consumer/cn/doc/service/skill-real-machine-testing-0000002592771628)要求选择真机测试用户组，发布后由该组账号在小艺体验；文档记载测试发布有效期 15 天。本轮尚未获得该平台配置成功证据。
3. 用户上传时反馈“文件类型非法，仅支持.md, .txt, .py, .zip”。这与官方[附件](https://developer.huawei.com/consumer/cn/doc/service/skill-attachment-0000002592771626)说明一致，提示可能使用了附件入口；具体页面待用户确认。不能通过改 HAP 后缀或仅把它套入 ZIP 就宣称完成应用 Skill 导入。
4. 已在本机另备同一哈希的签名 HAP 供正确导入入口使用；未把 HAP、私钥、证书或账号加入仓库。
5. 官方[AgentExtensionAbility 指导](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/agent-extension-ability)描述由系统应用作为客户端连接服务端组件。当前公共 SDK 仅交付服务端回调与 AgentHostProxy 回传，没有提供给普通应用的 Agent 连接客户端。本项目 onAuth 仍明确记录未配置认证，不伪造认证通过。后续需拿到受支持系统调用方及协议，才能验证 A01/A03。
6. [C 的 API 26 调研](../2026-11-05-C-runtime/api-research.md)关于主动发起系统 Skill 调用的阻断仍成立；本轮复核公共声明，没有发现 executeSkill/invokeSkill 等发起接口。[官方 A2A 指导](https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/hmaf-a2a-dev-guide)提供的是 A2A 服务端，不是 Skill 发起 API；当前项目也没有声明已经实现 A2A。

## 交接状态

- **F01–F10：**本设备签名构建、安装、页面操作、13 笔应用内输入与 9 项自检已有证据。A 本地入口/桥接 32 项和共享核心 28 项也通过；它们只证明本地逻辑，不替代设备系统回调。
- **S01/S02：**真实小艺已尝试，尚未获得目标调用；平台导入、测试用户组及测试发布待确认，修复后的版本待复测。
- **A01：**注册和设备安装确认；真实受支持调用方、认证、onConnect/onData/onDisconnect 未验证。
- **A02：**公共发起 API 缺失，阻断；增加真机本身无法解除。
- **A03/E01：**受上述前提阻断，没有真实外部并发或完整端到端录屏证据。

D 可接收本目录补充的设备记录，按上述路径和版本更新汇总。任何系统项均未标记通过。本轮测试结束后 HDC 列表变为空；继续系统复测前需重新连接设备。证据哈希见[清单](manifest.json)。
