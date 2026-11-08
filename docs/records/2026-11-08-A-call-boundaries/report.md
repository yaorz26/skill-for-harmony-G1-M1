# A：手机系统 Skill 证据复核与 A01/A02/A03 接入边界

复核日期：2026-11-08（北京时间）。基线：`origin/main@34899adbda8270463566632ecd7e066391d9bb07`。这是对已有证据及接口条件的复核，本轮没有执行新的系统 Skill 调用或外部组件连接。PC 小艺调用由另一条既有工作线继续排查，本记录不改变其平台配置或设备状态。

## 1. D 的手机成果可以验收哪些内容

已逐行核对 [D 的两项调用记录](../2026-11-07-D-system-skill/report.md)，并人工查看回显、长度的展开过程和长度最终结果截图。设备为 Pura 70，HarmonyOS 7.0.0.111 / API 26，小艺 11.7.8.339。源码固定在 `ab9691f`，签名 HAP 的 SHA-256 为 `AE81F666F362D7176E8390296F749EF178C6D5C0DE59B18D99FED40006DF8B20`。

| 验收项 | 可核对的证据 | 本次复核结论 |
| --- | --- | --- |
| S01 两项发现/匹配 | `execCli2` 点名正确 Skill，系统分发到各自 ArkTS 脚本 | 手机环境通过 |
| S02 正常回显 | requestId=7；输入及返回均为 `T8P2-鸿蒙-47`；入口、上报、系统收到结果和可见最终回复对应 | 手机环境通过 |
| S02 正常长度 | requestId=6；40 个 ASCII 码元加 1 个 emoji；结果 42，单位 `utf16-code-unit`；同一请求的入口、上报、返回对应 | 手机环境通过 |
| S02 无效参数 | 513 个 emoji 的尝试没有目标脚本入口和上报证据 | 未验证，不随正常分支一起勾选 |
| A01/A03 | 两项系统日志都未经过自建 `AgentExtensionAbility` 的连接/数据回调 | 不能由该记录验收 |
| A02/E01 | 发起方为小艺；没有自建 Agent 的主动调用点及完整组件链路 | 不能由该记录验收 |

可运行 `node docs/records/2026-11-08-A-call-boundaries/verify-d-evidence.mjs` 重新核对两份日志中的调用参数、脚本、requestId、结果及 `replyCliResult`。输出见 [证据复核结果](d-evidence-review.json)。脚本检查已有证据，不会启动设备；截图与最终回复另经人工查看。

同时复跑既有 A 入口自测：共享核心 28 项、A 入口/装配 32 项通过，见[检查摘要](host-check-summary.json)。既有脚本末尾仍写“23 shared core checks”，这是历史提示文字；本次实际共享核心输出为 28。该检查使用本地 ETS 和平台基类替身，不能作为 A01/A03 的真实 IPC 通过证据。

S02 的无效参数缺口只能记为“未取得系统递参证据”。现有材料不足以确定是输入限制、模型处理或其他调用方行为，不把 C 的推测提升为已定位根因。

## 2. A01：已找到连接接口，尚无具备资格的外部调用方

OpenHarmony 官方 [agentManager 系统接口文档](https://github.com/openharmony/docs/blob/f41b9345badd47c7ab0c263344cd7f4b5a549afb/zh-cn/application-dev/reference/apis-ability-kit/js-apis-app-agent-agentManager-sys.md)及[接口声明](https://github.com/openharmony/interface_sdk-js/blob/8a86234f0d542e5062e24e948652f5a484d90904/api/%40ohos.app.agent.agentManager.d.ts)列出了客户端接口：

```typescript
connectAgentExtensionAbility(want: Want, agentId: string,
  callback: AgentExtensionConnectCallback): Promise<AgentProxy>;
disconnectAgentExtensionAbility(proxy: AgentProxy): Promise<void>;
```

该接口标注 `@systemapi`，需要 `ohos.permission.CONNECT_AGENT`，列出 201（无权限）及 202（非系统应用）等错误；客户端通过 `AgentProxy.sendData` 发送，`AgentExtensionConnectCallback.onData` 接收。`authorize` / `onAuth` 提供握手传输，但不规定本项目采用的认证协议。接口存在不等于当前普通应用能使用，也不等于华为当前设备已提供可给本项目调用的集成入口。

2026-11-08 对在线 MateBook 的只读检查确认：API 26；安装的 `com.yaorz26.g1m1.skillagent` 为 `isSystemApp=false`、`appPrivilegeLevel=normal`，请求权限列表为空。当前本机公共 SDK 没有发布 `agentManager`、`AgentProxy` 和客户端回调声明。详见 [SDK 核对](sdk-audit.json)与[设备选择性读回](device-readback.json)。没有执行受限接口，因此上述错误码是文档约束，不是本轮实测报错。

接下来需要一个受支持、具备系统接口使用资格和 CONNECT_AGENT 权限的实际调用方，或华为明确提供的等效测试通道；同时确定调用方身份、组件访问规则及握手约定。服务端当前 `exported:false`，任何导出调整应结合该调用方的访问条件处理。单改为 true、加入权限字符串、普通调试签名或换成普通 Service 连接都不能证明这些条件已具备。

## 3. A03：待真实连接后执行的固定用例

现有 [A 的桥接检查](../2026-11-04-A-integration/check-entry.mjs)和 [C 的策略确认](../2026-11-07-C-closeout-notes.md)可作为逻辑基线。真实 IPC 尚未执行，A03 保持未验证。

1. 连接 C1 后，不等待第一笔回复，连续发送 `{"requestId":"a03-echo","text":"回显 A03-one"}` 与 `{"requestId":"a03-length","text":"长度 你好ABC"}`。两份返回各自保留 ID，业务值分别为 `A03-one`、5；保存调用方接收及服务端关联日志。客户端背靠背发送不单独证明服务端执行有重叠，需记录真实回调时序。
2. 在原请求处理期间和完成后，各重发 `a03-echo`。每个 ID 仅执行一次、仅回传一份终态；重复消息有 `agent_duplicate_ignored`，不回放旧结果。若无法制造处理中重发，应注明只测到完成后重复。
3. 在独立连接 C2 使用相同 `a03-echo`，输入 `回显 A03-other-connection`，核对状态隔离和各自返回目标。
4. 断开再连，验证新连接能重新使用 ID；对断开期间的迟到结果核对不向旧调用方回传。只有真实调用方、连接回调、客户端返回记录齐备后才可申请 A03 验收。

## 4. A02：D 的 execCli2 是已观察到的系统路径，尚非应用调用接口

D 日志已证明小艺经 `execCli2` 调度 Skill；[C 的最新补充](../2026-11-07-C-closeout-notes.md)核对了公共 SDK 无该声明。本轮复查本机公共 API 26 仍无 `execCli2`、`executeSkill`、`invokeSkill`、`startSkill`、`callSkill` 或 `executeArkTSScript` 发起声明。

`scriptManager.completeArkTSScriptInApp` 用于结果上报；`skillManager.getSkillInfo*` 用于查询；`AgentProxy` 是 Agent 组件收发通道，不能据此推导它能执行 `skillProfiles` 脚本。现有唯一适配器 `InAppSkillInvoker` 仍是应用内业务复用。A02 需要华为确认可用发起 API/服务协议、调用方资格、目标标识及返回方式，之后才有可装配的真实适配器。当前状态为阻断，未新增冒充系统调用的实现。

## 5. 手机与 PC 的处理顺序

项目当前验收表没有要求 S01/S02 必须在 PC 完成，D 的手机结果可以独立作为该环境的正式证据。建议以 Pura 70 的已验证路径作为本轮演示和验收基线，PC 记录为额外兼容性调查，不阻塞已通过的手机条目。

目前不能断言 PC 小艺不适配。D 的成功基线使用 `com.g1m1.skillagent`、`g1-echo` / `g1-text-length`；A 的 PC 分支使用另一个包名及带前缀的 Skill 名称，平台账号、测试组、导入包、小艺入口也需分别核对。两套记录不能直接作为“同一发布只改变设备”的对照实验。[PC 已有记录的选择性核对](pc-comparison.json)显示“Skill真机测试中”入口未就绪；平台配置边界也仍需按实际入口分别核实，不能由一次保存拒绝推出整个平台不支持 PC。

PC 的后续诊断应先核实该设备/客户端是否支持同一真机测试通道，再以固定 HAP、匹配的包名/Skill、正确账号/用户组和发布状态做对照。缺少官方支持依据时保留“不确定”；若确认仅支持手机，就将 PC 标为本轮范围之外。小艺 UI 入口、普通 Ability 拉起或手机成功都不自动补齐 A01/A02/A03/E01。
