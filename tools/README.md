# D 的本机验收工具

要求 Node.js 24+、Git；零第三方 npm 依赖。先在仓库根目录执行 `node --version`。若未配置 PATH，可使用 DevEco 的 `tools/node/node.exe` 完整路径运行下列脚本。

```powershell
node tools/run-acceptance.mjs --out ../g1m1-evidence-001
```

输出目录必须不存在。工具运行结构检查、核心逻辑检查、A 的组件/装配独立检查、C 的执行器独立检查和证据工具自测；其中一项失败仍继续收集其他项，最终返回非零退出码。每项默认最多等待 120 秒，超时会终止该直接子进程，记录为 timeout，不自动重试。工具只调起本地 Node 检查，不用于管理任意子进程树。

输出包含 `manifest.json`、`summary.md`、`structure.log`、`core.log`、`a-entry.log`、`c-executor.log`、`evidence-tool.log`。清单记录 HEAD、分支、工作区状态、Node/OS、源码文件 SHA-256、检查期间源码一致性、退出码及每份日志的 SHA-256。`sourceFiles` 覆盖工程源码/配置/工具/CI 及作为检查入口的 A/C 脚本；普通文档报告不参与源码指纹。工作区有改动时必须同时交付对应改动，不能声称仅 checkout HEAD 即可复现。

`passed` 只表示本机基线检查通过，绝不代表设备、系统 Skill 或 A 装配后的终验通过。报告提交前人工检查日志中是否有本机路径或私人数据；工具不收集凭证、远端地址或设备序列号，不提供自动脱敏保证。

单独运行：

```powershell
node tools/check-structure.mjs
node tools/check-core.mjs
node --test tools/check-evidence.test.mjs
```

核心检查包含固定输入、UTF-16 边界、测试替身抛错/超时/迟到结果、日志顺序、并发关联、未命中不执行业务。`test-*` 路径都是 Node 测试替身；不把它们登记为真实系统适配器。

CI 保留 `Structure checks / structure` 作业，运行相同采集入口并保存 14 天 artifact。远端是否执行成功须查看实际 Actions 结果；本地通过不能代替远端结果。构建仍使用已有 [build-hap.ps1](build-hap.ps1)，设备操作按 [D 验收手册](../docs/acceptance-runbook.md)执行。
