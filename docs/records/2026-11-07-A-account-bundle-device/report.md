# A：新包名签名、安装与真机复测

日期：2026-11-07（北京时间）。用户在独立新工程完成自动签名后，由 A 验证签名身份、构建、安装与应用内回归。源码固定为 `c7d23d7f8c669bee56b59db3b246f26e19c4e142`；本轮没有修改 B/C 的业务与执行器，也没有代改 D 的验收表。

## 签名、构建与安装

- 新工程：`D:/Temp/g1m1-yaorz26-signing-20261107`。只读核对生成的调试 Profile，绑定包名为 `com.yaorz26.g1m1.skillagent`。将临时工程的 default product 关联到已生成的 default 签名配置后构建。仓库不保存本机签名配置、密钥、证书、Profile 或设备标识。
- 构建成功：9.680 秒，33 tasks（26 executed、7 up-to-date）。仓库与临时工程的应用源码、资源、Skill 和 AppScope 共 26 个文件逐字节比较，差异为零。
- 签名 HAP：`D:/Temp/g1m1-yaorz26-signed-20261107.hap`，162634 bytes，SHA-256 `8BEAB624AE116B9E81A5733C3F43B92EFBFFE62F3FD88E3E55E05A423877615D`。这是提交给安装器的本机产物哈希，未从设备回读安装包做字节比较。
- 最终 HAP 的应用包名、AgentCard 包名和签名 Profile 包名一致。两个平台注册名为 `yaorz26-g1m1-echo-20261107`、`yaorz26-g1m1-text-length-20261107`；内部业务标识继续使用 `g1-echo`、`g1-text-length`。见[打包配置](packaged-registration.json)。
- 安装器返回 `install bundle successfully`。首次启动因设备锁屏返回 10106102；用户解锁后再次启动返回 `start ability successfully`，后续 UI 结果均来自新包名对应的应用子树。
- 设备包管理器读回新包名下的 AgentExtensionAbility，扩展类型为 37。这里只证明已安装的注册信息，不能据此判定系统连接和回调通过。见[安装注册摘录](installed-registration.json)。

构建、身份和验证数量见[安全摘要](build-summary.json)。此前旧包名的 HAP 与本轮未签名 HAP 都不用于此次平台导入。

## MateBook 应用内复测

同一台 HUAWEI MateBook 14（MNTXM-24B），API 26、2in1。设备详情沿用[前轮设备记录](../2026-11-07-A-matebook/report.md)。每次输入后核对实际输入框内容，再点击运行并读取 JSON 结果；所有 UI 操作均定位到 `com.yaorz26.g1m1.skillagent` 的应用子树。

| 覆盖 | 结果 |
| --- | --- |
| F03–F05：中文回显、混合文字长度、单个 emoji | 通过；长度分别为 5、2 个 UTF-16 码元 |
| F06：未匹配指令 | 通过，ERR_NO_SKILL |
| F07：缺参、空输入、空格、1025 码元参数、1101 码元整条指令 | 5 个变体通过，ERR_INVALID_PARAMS |
| F07：512/513 个 emoji 参数边界 | 2 个变体通过；512 个返回 1024，513 个拒绝 |
| F10：顺序执行 first、second | 通过；独立 requestId、内容对应 |
| F08/F09：页面执行器自检 | 9 项断言通过，executionPath=self-check |

共 13 笔应用内输入通过，详见[UI 结果](ui-results.json)。每笔请求只从该笔运行后的 hilog 快照按 requestId 提取事件，没有合并其他快照或去重，共 48 条；13 笔请求均恰好一次 response_returned，成功请求完整经过五个阶段，失败请求没有 skill_started。见[关联检查](trace-checks.json)与[事件摘录](runtime-trace.jsonl)。日志快照和完整桌面布局留本机；本轮测试沿用了旧临时工程下的原始证据目录，但仓库历史记录未覆盖，新证据通过 requestId 单独归档。

F08/F09 继续使用 C 已交付的测试替身，包含抛错、超时、迟到结果不改写、不重试及正常对照；[自检结果](selfcheck.json)为 UI 断言记录，未另存本轮自检日志。它不证明真实系统 Skill 调用；F10 的顺序请求也不替代外部并发测试。

## 平台与系统链路状态

本轮完成新签名包的构建、安装和应用内复测，没有在开发者平台完成新包导入、测试用户组或测试发布，因此 S01/S02、真实 Agent 连接与回调、外部并发及端到端录屏仍无通过证据。旧包名的小艺尝试不移作本轮系统证据。

可供下一步导入的文件是上述 `g1m1-yaorz26-signed-20261107.hap`。平台导入及测试发布完成后，才继续使用该测试组账号检查真实小艺调用与对应设备日志。公共 SDK 发起系统 Skill 调用的接口限制仍按[前轮记录](../2026-11-07-A-matebook-system-checks/report.md)保留，单次签名和安装不能解除该限制。

证据文件校验见[清单](manifest.json)。

后续进展：用户确认两个 Skill 已发布真机测试，已执行[平台发布后的系统入口复测](../2026-11-07-A-published-system-probes/report.md)。当前仍未获得真实系统调用证据，且未观察到客户端的测试就绪标志；以该复测记录说明后续状态。
