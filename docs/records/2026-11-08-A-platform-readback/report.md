# A：通过 Edge 独立核对小艺平台配置

日期：2026-11-08（北京时间）。承接[平台发布后的系统入口复测](../2026-11-07-A-published-system-probes/report.md)。按用户要求操作 Edge，读取已登录账号下的小艺开放平台页面及这些页面实际发出的查询响应；没有保存平台设置、取消或重新发布，没有修改应用实现或 D 的验收表。

后续更正：本记录仅反映最初的只读核对。随后实际保存验证发现，当前平台配置界面只提供 cloud / cloudSandbox，主对话发布也使用这两个范围；加入 pc 或仅设置 pc 均被接口以参数错误拒绝。因此下文“补齐 pc”的建议不适用于已验证的当前平台入口，不能据此认定缺少 pc 就是根因。两个 Skill 的 API 26 已补齐并重新发布；小艺也已更新，复测结果和仍未就绪的证据见[配置与客户端跟进](../2026-11-08-A-platform-config-client/report.md)。

## 已核实的信息

| 项目 | 文本回显 | 文本长度 |
| --- | --- | --- |
| 平台注册名 | yaorz26-g1m1-echo-20261107 | yaorz26-g1m1-text-length-20261107 |
| 中文映射 | G1M1文本回显 | G1M1文本长度 |
| 应用包名 | com.yaorz26.g1m1.skillagent | com.yaorz26.g1m1.skillagent |
| 已有真机测试发布 | 是，hasTestRelease=true | 是，hasTestRelease=true |
| 发布窗口目标入口 | 小艺主对话 | 小艺主对话 |
| 测试组 | test，1 人，包含当前平台登录用户 | test，1 人，包含当前平台登录用户 |
| availableOn | 仅 cloud | 仅 cloud |
| minAPIVersion / targetAPIVersion | 空字符串 | 空字符串 |
| 平台代码树 | 只列出 SKILL.md | 只列出 SKILL.md |

真机测试窗口均显示“取消发布 / 重新发布”，并提示测试有效期 15 天。列表仍显示“草稿”，不能据此否定真机测试已发布：查询的 hasTestRelease 和发布窗口共同确认了测试发布状态。没有取得确切测试发布时间，不能用更新时间替代。

测试组的 hasCurrentUser=true 指当前浏览器的平台账号。本轮没有重新读取并比对 MateBook 登录账号；两端账号一致仍沿用用户此前确认，不把该字段写成独立设备账号核验。

另外两条同名历史记录绑定旧包名 com.g1m1.skillagent，hasTestRelease=false，不是此次有效测试发布。它们也仅列出 cloud。当前账号/团队的 Agent 列表查询成功（code=0），返回 total=0，页面显示无结果；这表明当前平台范围内未查到 Agent，不能推广为其他账号也未注册。

## 可以确定的配置差异及其限度

官方[HarmonyOS Skill 开发规范](https://developer.huawei.com/consumer/cn/doc/doccenter-celia/skill-development-standards-0000002592931546)说明，availableOn 规定哪些运行位置的 Agent 可以发现 Skill，pc 表示 PC，cloud 表示云端。当前平台记录没有声明 pc；应用 module.json5 中的 2in1 也不等于平台 availableOn。后续实测表明当前主对话配置入口不接受 pc，不能把通用规范中的可选值直接当作这个入口的修复方式。

本轮发现的是具体配置差异，尚未完成“修改范围 → 重新发布 → 客户端就绪 → 实际调度”的对照实验，不能直接认定它是唯一根因，也不能保证补上 pc 就会出现“Skill真机测试中”。云端 Agent 还可能参与跨设备调度；实际行为仍要用设备上的入口和回包日志确认。

平台编辑器没有列出独立 module.json；API 版本字段也没有读回 26。这些是需进一步核对 HAP 导入、配置生成链路的观察，不直接证明脚本缺失。ArkTS 脚本在 HAP 中编译为 ABC，平台代码树没有 .ets 本身不能证明设备没有代码。

附件名称是每个 Skill 对应的 ZIP。HAP 导入流程也可能提取并生成 ZIP，单凭文件名不能断言用户选错了上传文件；本轮也未取得平台原始上传 HAP 的哈希。

## 后续处理顺序

1. 核对平台对当前 HAP 的设备范围和端侧配置解析，以及当前主对话测试对 PC 的实际支持；同时核对 API 26 与应用内脚本注册。原先“补齐 pc”的设想已经被后续保存实验否定，详见上方更正。
2. 确认配置后，再将两个新包名 Skill 发布到同一测试组，并在 MateBook 检查“Skill真机测试中”。若仍缺失，继续核查客户端资格/能力下发，保留云端与 PC 调度的区别。
3. 就绪后重跑 S01/S02，收集实际脚本进入、结果上报和最终回复的关联证据。当前仍不能标通过。
4. AgentExtensionAbility 的真实调用另需处理平台端 A2A 注册、认证和受支持调用方等前提；本轮未创建 Agent，也不将平台 Skill 发布当作 Agent 回调证据。

所选平台字段见[核对数据](platform-readback.json)，代码树局部截图见[回显文件树](echo-file-tree.png)。记录排除了 Cookie、签名下载地址、团队标识和个人账号号码；完整查询响应未写入仓库。文件校验见[清单](manifest.json)。
