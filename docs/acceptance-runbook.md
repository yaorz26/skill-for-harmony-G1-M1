# D 验收执行手册

负责人：唐欣卓 / `pourf`。依据 [接口 v0](interfaces.md)、[验收清单](acceptance.md)和[当前架构](architecture.md)。本手册是可执行步骤，结果以每次独立报告为准。

2026-11-08 本轮按框架及已有证据交付，不要求重复手机测试；S02 只接收正常调用范围，错误分支未验证；A01/A02/A03/E01 和 PC 小艺限制保留。以下完整测试步骤供复现或未来恢复使用，最终范围见[交付索引](delivery-index.md)。

## 1. 开始条件和判定口径

本机基线检查现在即可执行。正式整体验收须先收到 A 的固定 commit、对应 HAP SHA-256、签名/SDK/设备要求、B/C 交付说明、调用方及操作步骤；按[交接模板](templates/acceptance-handoff.md)逐项核对。缺少其中某个路径的材料，将该路径记为“阻断”，其他路径照常测试。

- 通过：实际值符合预期，证据可定位到同一版本、设备和请求。
- 失败：已执行，实际值违反预期；记录首个失败节点。
- 阻断：版本、设备、账号资格、调用方或实现等前置条件缺失，未执行目标步骤。
- 未测：满足条件但尚未执行；不适用需解释用例为何不属于本轮路径。

框架交付与真实调用分别结论。F01–F10 的应用内路径通过不自动通过 S/A/E。Node 检查只填写“本机纯逻辑”，不得替换目标鸿蒙运行时栏。IDE 同步、命令行构建、安装也分别记录。

## 2. 固定版本与证据目录

每轮新建 `docs/records/<日期>-D-<用例>-<序号>/`，参考[运行模板](templates/run-report.md)。本机自动采集可以先输出到仓库外，人工检查后再纳入记录。文件建议为 `report.md`、`manifest.json`、`build.log`、`hilog.txt`、`results.json`、`screenshots/`；录屏过大时用有访问权限的团队链接，注明文件名和 SHA-256。失败实验保留原目录，复测另建目录并链接原问题。

```powershell
git rev-parse HEAD
git status --short
node tools/run-acceptance.mjs --out ../g1m1-evidence-001
Get-FileHash -Algorithm SHA256 -LiteralPath '<A提供的HAP绝对路径>'
```

清单中的源码哈希、脏工作区说明和 HAP 哈希一起固定被测对象。拒绝用旧 C 副本或其他分支的产物充当当前 D 基线。正式交付最好使用已审阅的干净 commit；当前本地 D 准备记录允许未提交，但必须明示。

## 3. 构建、设备与日志（F01/F02）

1. 在全英文路径的独立副本或 checkout 打开根目录，等待 IDE 同步，保存同步面板截图/日志及结果。
2. 使用 DevEco 26 / API 26 工具链执行 `tools/build-hap.ps1 -DevEcoRoot '<本机DevEco目录>'`，保存完整输出和退出码；记录 unsigned/signed、产物 SHA-256。命令行构建成功只填 F01 的构建子项。
3. 明确设备是真机还是模拟器，核对系统/API 满足工程最低版本。使用 DevEco 自带 HDC 的完整路径执行 `hdc list targets -v`；只选当前被测设备，不把离线模拟器当成真机。
4. 设备需由持有人开启 USB 调试并允许电脑连接。HDC 不可见时，记录当前现象、设备系统版本和驱动状态；不要更改 SDK 基线或签名来掩盖不兼容。
5. 真机安装前由 A 提供可安装且匹配设备的签名 HAP。执行 `hdc -t <target> install <HAP>`，记录完整返回；失败就停止依赖安装的用例，交 A 排查。
6. 安装成功后执行 `hdc -t <target> shell aa start -a EntryAbility -b <本轮HAP的应用包名>`；当前 A 版本为 `com.yaorz26.g1m1.skillagent`，D 的 `ab9691f` 历史基线为 `com.g1m1.skillagent`。按[版本表](system-skill-device-runbook.md#1-先记录这一轮使用的版本)核对签名、平台名称与脚本路径；保存启动返回及实际页面。
7. 在另一个终端执行 `hdc -t <target> hilog` 并保存原始日志，实验结束用 Ctrl+C 停止；从中摘出 `[G1M1]` 关联记录。不要清空设备全局日志。提交前脱敏序列号、私人输入和账号数据。

启动 `EntryAbility` 是 F02 的页面启动证据；后续 `in-app` 业务并不因此成为一次新的 Ability 启动。若目标路径实际启动其他 Ability，另记调用 API、目标及 onCreate/onForeground/onBackground 等真实生命周期证据；没有启动就写“不适用”。

## 4. 应用内用例（F03–F10）

每个输入单独点击运行，抄录页面完整结果与 requestId。成功外壳应为 `status=success`、空错误码/消息、`executionPath=in-app`；失败应为 `status=failed`、`data={}`、预期错误码和非空错误消息。

| ID | 操作/输入 | 精确判定 | 证据 |
| --- | --- | --- | --- |
| F03 | `回显 你好，鸿蒙` | g1-echo，data.text 完全一致 | 结果 JSON、页面截图、同 requestId 的五阶段日志 |
| F04 | `长度 你好ABC` | g1-text-length，length=5，unit=utf16-code-unit | 结果 JSON、对应日志 |
| F05 | `长度 😀` | length=2 | 结果 JSON、对应日志 |
| F06 | `查天气` | ERR_NO_SKILL，skillId 为空；无 skill_started | 结果及同 requestId 的日志 |
| F07 | 空输入、纯空格、`回显`、`回显 `+1025 个 a、1101 个 a | ERR_INVALID_PARAMS；初检失败 skillId 为空，匹配后缺参/超限保留 g1-echo | 每个输入各一行结果；保存长度和生成方式 |
| F07 边界 | `长度 `+512 个 😀；再试 513 个 | 前者 length=1024；后者 ERR_INVALID_PARAMS | 输入码元数、结果与日志；页面无法输入时报告限制，不能冒充业务结果 |
| F08 | C 提供可注入测试入口：invoke 抛错 | ERR_INTERNAL，一次回包；不修改正式业务加入故障开关 | 测试入口版本、异常、结果、日志 |
| F09 | C 测试入口：执行超过 timeout，随后返回；再测试迟到拒绝 | ERR_TIMEOUT，一次回包，无自动重试；迟到结果不改写已返回结果；不宣称底层已取消 | timeout 值、调用次数、迟到前后日志、结果 |
| F10 | 先后运行 `回显 first`、`回显 second` | requestId 不同，各自文本正确，日志不串包 | 两份结果与关联日志 |

边界输入可在 Node 中用 `'😀'.repeat(512)` / `'😀'.repeat(513)` 精确生成。不得手工估计 emoji 数量。当前演示页已有 C 交付的“执行器自检”按钮，F08/F09 使用其中的抛错/慢调用替身及正常对照，保存 `allPassed` 和 9 项断言；本机 `check-core.mjs` 的通过独立记录，不当作设备结果。

正常日志顺序为 request_received → intent_matched → skill_started → skill_finished → response_returned；未命中为 request_received → intent_matched(ERR_NO_SKILL) → response_returned。每个请求恰有一条最终返回。多个请求日志可以交错，但 requestId、skillId、路径和结果必须对应。

## 5. 系统、组件和端到端

S01 与 S02 本轮正常调用范围已有[D 手机复测记录](records/2026-11-07-D-system-skill/report.md)。S02 无效参数分支未取得系统入口证据，原因未定位，按本轮范围不追加补测、不改判通过。其他设备的复现步骤见[换设备手册](system-skill-device-runbook.md)。A/E 项列为未来完整目标的验收条件，当前保留未验证/阻断，不作为本周框架交付前置。

| ID | 前置材料与步骤 | 通过条件 / 证据 |
| --- | --- | --- |
| S01 | A/C 提供已注册的 HAP、平台导入与测试资格、受支持系统调用方；按其已验证入口分别发出回显/长度请求 | 系统匹配/调度指向本轮 HAP 的两项平台注册名，按版本表核对；仅展示 SKILL.md 不算发现成功 |
| S02 | 以 S01 匹配结果用正常文本真实触发两个入口；无效参数分支列为未来扩展测试 | requestCode 对应 system_skill_entered、业务结果、system_result_reported、调用方收到结果及最终回复；上报失败保留 system_report_failed/ERR_REPORT_FAILED，不标成功 |
| A01 | A 提供 AgentExtensionAbility、实际调用方、权限和连接步骤；按步骤连接并发送固定请求 | 真实连接/接收/断开回调与调用方证据；页面 aa start 不代替组件回调 |
| A02 | C 提供主动调用 API/权限/目标可见性/适配器，A 完成注入和配置；从自建 Agent 发起固定请求 | 发起调用点、目标 Skill、真实执行、返回通道可关联；测试替身不能通过 |
| A03 | A/B/C 明确外部入口的重复 requestId 策略；提交两个不同 ID 的并发请求，再提交重复 ID | 不串包；重复行为符合交接策略；未规定策略时记录阻断，不擅自要求幂等 |
| E01 | 接收 A 装配的固定版本，从受支持外部入口输入并获得最终回复 | 组件→路由→真实 Skill→业务/Ability→上报→最终返回的连续证据；每段说明实际调用方与 requestId 映射 |

S01/S02 的系统调用方可能是小艺；即使通过，也不能自动证明 A02 的自建 Agent 主动调用。C 尚无主动调用接口时，A02/E01 标阻断并注明 C/A 接手条件。

## 6. 失败回交与收口

首个失败节点明确后，按[问题模板](templates/acceptance-issue.md)记录输入、预期/实际、错误码、版本、日志行及负责人：工程/签名/组件归 A，路由/目录/关联契约归 B，业务/执行器/真实调用适配归 C，检查工具与报告归 D。由 A 分派修复；D 不在验收中直接更改 A/B/C 实现。

复测收到新 commit/HAP 后重跑失败用例及受影响路径，保留旧结论。最终填写[交付索引](delivery-index.md)，框架结果与真实系统目标分别给出通过/未完成/阻断结论。给任务二 C3 的交接仅包含固定工程、输入、路径和证据；不把 Date.now 日志差值当成性能实验结论。
