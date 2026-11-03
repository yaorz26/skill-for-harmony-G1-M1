# GitHub 协作规则与设置状态

## 1. 工作流

每人从最新 `main` 创建自己的分支 → 自测 → 提交 PR → **yaorz26－姚睿哲综合审阅** → 在 GitHub 开启 auto-merge → 必需检查通过后由 GitHub 合入 `main`。不直接推送 `main`，不在本地合并后推送，不安排成员之间的交叉审阅。

B/C/D 交付的 PR 由姚睿哲审阅。姚睿哲本人的 PR 同样保留自测、变更说明和必需检查，但不要求另找一位成员审阅；GitHub 不允许 PR 作者批准自己的 PR，因此不能简单对所有 PR 强制“至少一位其他人批准”而仍保证只有姚睿哲综合审阅。

## 2. 当前实际状态（2026-11-03）

**远端分支保护和自动合并设置尚未应用，不能把此文档或 CODEOWNERS 当成已生效的保护。**

已通过 GitHub 的公开分支 API 核实 `main.protected = false`，main 仍为初始化提交 `eccefd5`；本轮没有把工作分支直接合入 main。

- 已准备：分工、目录归属、前后交接、PR 模板，以及指定 `@yaorz26` 的 `.github/CODEOWNERS`。
- 待应用：仓库 auto-merge、main 分支保护、必需检查，以及综合审阅授权的强制执行方式。
- 阻断：浏览器控制因无法可靠识别当前 URL 被环境中止；Git 的 SSH 登录可推送分支，但现有 HTTPS 凭据助手没有提供 GitHub API 凭据，无法用现有通道修改仓库设置或创建 PR。
- 本轮只推送独立工作分支，不更新 `main`。本文件合入默认分支后 CODEOWNERS 才能用于后续 PR 的审阅路由。

## 3. 需要应用的基础设置

仓库 [General 设置](https://github.com/yaorz26/skill-for-harmony-G1-M1/settings)：

| 位置 | 目标值 |
| --- | --- |
| Pull Requests → Allow auto-merge | 开启 |
| 合并方式 | 建议统一使用 Squash merge |

仓库 [Branches 设置](https://github.com/yaorz26/skill-for-harmony-G1-M1/settings/branches)，新增或更新匹配 `main` 的保护规则：

| 选项 | 目标值 / 说明 |
| --- | --- |
| Require a pull request before merging | 开启，禁止直接推送 |
| Require approvals | 基础规则先不强制其他人批准，以免姚睿哲自己的 PR 被锁住；综合审阅的强制门禁见下节 |
| Require status checks to pass before merging | 开启；选择现有 Actions 的 `structure` 检查 |
| Require branches to be up to date before merging | 开启，确保基于最新 main 检查 |
| Require conversation resolution before merging | 开启 |
| Do not allow bypassing the above settings | 开启，管理员也遵守 PR 与检查规则 |
| Allow force pushes | 关闭 |
| Allow deletions | 关闭 |

检查来源应限定 GitHub Actions，规则作用于 `main` 且没有 bypass actor。上述设置是待应用清单，不是远端当前值。[GitHub 保护分支说明](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)

## 4. 综合审阅和“只能自动合并”的精确边界

**开启 auto-merge 只提供自动合并功能，不会单独禁止手动点击合并。** 基础保护可以确保 PR 与必需检查，但要严格落实“只有姚睿哲决定放行、全部由 GitHub 自动合并”，还需要额外门禁，不能仅勾选 Allow auto-merge 后宣称全部完成。[GitHub auto-merge 说明](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository)

建议补一个受保护的审阅/放行工作流：B/C/D 的 PR 必须获得 `yaorz26` 对当前版本的批准；A 自己的 PR 则由 A 在 GitHub 显式放行。门禁须校验当前 head commit，并仅允许姚睿哲触发授权。然后由 GitHub 的自动合并通道更新 main。CI 配置、门禁源码和分支规则也应受同一审阅约束。

如需在权限层面完全去掉其他人手动合并的能力，需要结合 GitHub 当前计划支持的规则、合并队列或受限合并执行身份核实；不能为此留下管理员绕过或引入新的永久凭据。本次因设置通道受阻，未创建机器人、访问令牌或此类门禁，也没有修改成员权限。

恢复可用的 GitHub 设置通道后，应先应用基础保护，再完成门禁和一次 PR 验证：直接 push 被拒绝、未放行/检查未通过不能合并、由姚睿哲放行后自动合入，最后把本节待办更新为真实设置及证据。
