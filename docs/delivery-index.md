# D 交付索引与剩余依赖

维护人：唐欣卓 / `pourf`。本文件用于汇总交付材料；最终 Demo 是否完成以 A 装配后的固定版本验收为准。

## D 已独立准备的材料

| 材料 | 入口 | 用途 |
| --- | --- | --- |
| 本机检查与证据采集 | [工具说明](../tools/README.md) | 一次执行结构、逻辑、采集工具自测，保存版本/哈希/退出码/日志 |
| 实际基线与工具验证 | [D 初始报告](records/2026-11-04-D-preparation/report.md)、[合并 A/C 后复核](records/2026-11-05-D-upstream-review/report.md)、[当前模拟器验收](records/2026-11-06-D-acceptance/report.md)、[F07/F10 补测](records/2026-11-06-D-followup/report.md)、[IDE 同步](records/2026-11-06-D-ide-sync/report.md)、[真机签名安装](records/2026-11-06-D-signed-device/report.md)、[真机 F05–F10](records/2026-11-07-D-device-followup/report.md) | 分别对应固定源码版本的实测结果、限制与复现方法；`ab9691f` 已覆盖 F01 同步与签名构建、F02–F10 真机应用内/自检路径 |
| 逐项验收操作 | [执行手册](acceptance-runbook.md)、[验收表](acceptance.md) | 覆盖 F/S/A/E 所有用例，区分纯逻辑和设备结果 |
| 构建与运行 | [运行指南](build-and-run.md) | 全英文工程路径、SDK、签名、运行与日志 |
| 架构与阶段流程 | [流程图](architecture.md) | 当前路径、系统入口源码预期、目标路径及验收门槛 |
| 设备排期 | [设备表](device-schedule.md) | 已知设备事实、资源缺口与待确认时段 |
| 版本交接 | [交接单](templates/acceptance-handoff.md) | A 给 D 的固定 commit/HAP/接口/权限材料 |
| 实验与问题模板 | [运行](templates/run-report.md)、[构建](templates/build-record.md)、[问题](templates/acceptance-issue.md) | 正常、失败、阻断、复测可追溯 |
| CI | [structure.yml](../.github/workflows/structure.yml) | 同一采集入口运行共享及 A/C 独立 Node 检查并保存日志；远端结果以实际 Actions 为准 |
| D 收尾核对 | [收尾记录](records/2026-11-06-D-closeout.md) | 本机检查、补测清单哈希、IDE 同步尝试与待交接状态 |

## 需要外部交付后执行

| 尚未完成项 | 接手条件 | 提供方 | D 接到后的动作 |
| --- | --- | --- | --- |
| S01/S02 系统 Skill 发现/执行/上报 | [Pura 70 小艺尝试](records/2026-11-07-D-xiaoyi-discovery/report.md)点名两个 Skill 均未找到；需核实平台导入、测试组、发布及账号资格，再定位注册或代码问题 | 平台权限持有人；若平台条件齐备仍失败，再由 A/C 定位 | 条件确认后重测系统匹配、入口和结果；当前 S01 未通过、S02 阻断 |
| A01 扩展组件 | A 的源码、注册及本地替身自测已交付；仍需设备、受支持调用方和认证条件 | A | 验证真实生命周期与请求回调 |
| A02 自建 Agent 调用 | C 的公共 API 26 调研未找到应用发起 Skill 的接口，真实适配器未交付 | A/C 或平台方 | 有可验证接口及装配后再校验真实调用与返回；当前标阻断 |
| A03 外部并发/重复 | A 已定义本地桥接策略；仍需真实外部调用方、设备与固定版本 | A/B/C | 验证真实回调与并发/重复行为 |
| E01 与最终交付结论 | 上述材料和集成版本完整 | A | 连续端到端验收，交 A 确认 |
| 真机排期落实 | Pura 70 的 API 26、HDC 连接和本机调试签名安装已确认；系统调用方材料和实际实验时段仍待确认 | 组员/实验组 | 更新真实预约与交接，不把建议时段当已预约 |
| GitHub 检查/PR | D 证据分支包含本地补测与小艺阴性尝试；合入前须核对远端分支及 PR 的 Actions 结果 | D/仓库管理员 | 审核 D 分支，查看远端检查并按协作约定合入；不要以 `main` 的旧检查代替新分支检查 |

F01 IDE/签名构建、F02 真机安装/操作和 F03–F10 真机应用内/自检已留证；S01 已在小艺尝试但两个 Skill 未被发现，S02 因此阻断，其他真实系统/外部路径仍未测或阻断。D 的应用内结果不代表项目真实系统调用目标完成。[C 原始证据包的行尾哈希问题](records/2026-11-06-D-acceptance/manifest-issue.md)已由 C 补充 Git LF 检出形态的清单：[模拟器](records/2026-11-06-C-emulator/manifest-lf.txt)、[自检](records/2026-11-06-C-selfcheck/manifest-lf.txt)及[F05 补测](records/2026-11-06-C-f05-align/manifest-lf.txt)；D 已复核三份清单共 34 项哈希匹配。原始 CRLF 清单继续保留作实验时文件哈希。

## 给任务二 C3 的交接目录

准备固定 commit/HAP 哈希、输入输出样例、入口/路由/真实调用点、业务与 Ability 生命周期、返回关联日志和录屏、环境与已知限制。材料引用同一轮报告，不能拼接不同版本的成功片段。当前只提供框架及验收准备材料；真实调用和性能结论待对应实验。
