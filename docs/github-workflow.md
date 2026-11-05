# GitHub 提交与合并

## 工作流

从最新 `main` 创建工作分支 → 完成本人自测 → 提交 PR，说明改动、证据和交接 → 处理讨论 → 开启 auto-merge → 必需检查通过后由 GitHub 合入。不要直接推送、强推或在本地合并后推送 `main`。

合并前检查接口兼容性、实测范围和未测项。审批人数暂不设为强制条件；不安排交叉审阅。CODEOWNERS 用于建议审阅人，不等于服务器端的批准门槛。

## 已核验状态（2026-11-03）

| 项目 | 状态 | 依据 |
| --- | --- | --- |
| 默认分支 | `main` | GitHub 公开 API |
| main 分支保护 | 已开启，`protected: true` | GitHub 公开 API |
| 必需检查 | `structure`，来源 GitHub Actions（app ID 15368） | GitHub 公开 API |
| 检查适用范围 | `everyone`，包括管理员 | GitHub 公开 API；此字段仅表示检查执行范围 |
| 必须提交 PR | 已在用户提供的配置截图中勾选 | 详细保护 API 需登录，尚未逐项读取保存值 |
| 分支保持最新、解决讨论、禁止绕过 | 已在配置截图中勾选 | 同上 |
| Require approvals | 截图中未勾选 | 同上 |
| 仓库 auto-merge | 截图中已开启 | 公开仓库 API 不暴露该字段 |
| 合并方式 | 截图中仅保留 Squash | 同上 |
| Rulesets | 公开 API 返回空列表 | 本仓库使用 classic branch protection，不代表保护失效 |

D 分支的 `structure` 工作流执行文件/契约结构检查、Node 纯逻辑检查、A/C 独立 Node 检查和证据工具自测，并上传主机日志；远端结果以实际 Actions 为准。它没有鸿蒙 SDK，不能替代 DevEco 构建、安装或真机调度验证。

## 保护范围与限制

1. `Allow auto-merge` 开启后，仍需对每个 PR 单独启用。所有条件已满足时，GitHub 可能只显示立即合并按钮。
2. 当前配置**不会禁止在 PR 页面手动合并，也不会要求某一位成员批准**。因此“只接受 PR 和必需检查”与“技术上只能自动合并”是不同的验收项，后者尚未实现。
3. 仓库没有公开可验证的“自动合并身份专属权限”或合并队列证据；不能把团队约定当作此类权限限制。若后续仍需严格限制，需单独设计、配置并验证相应门禁，不能绕过现有保护。
4. 本地只向工作分支推送；不以向 main 试推真实提交的方式验证保护，避免误更新主分支。

参考：[GitHub 保护分支说明](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)、[auto-merge 说明](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)。
