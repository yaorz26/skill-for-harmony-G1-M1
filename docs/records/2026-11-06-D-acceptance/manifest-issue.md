# 既有 C 证据包行尾哈希问题

D 在 2026-11-06 接收 C 的两份模拟器记录时，按各自 `manifest.txt` 对仓库检出文件逐一计算 SHA-256。`2026-11-06-C-emulator` 共 24 项，20 项原始字节匹配、4 项不匹配；`2026-11-06-C-selfcheck` 共 5 项，3 项原始字节匹配、2 项不匹配。

| 记录 | 原始 SHA-256 不匹配的文件 |
| --- | --- |
| C emulator | `environment/apiversion.txt`、`environment/software_version.txt`、`environment/targets.txt`、`traces/live-g1m1.txt` |
| C selfcheck | `hilog-selfcheck.log`、`selfcheck-summary.json` |

六个文件的 Git 检出版本均使用 LF 行尾；把这些字节的 LF 还原为 CRLF 后，重新计算的 SHA-256 均匹配 manifest。仓库 `.gitattributes` 对文本设置 `eol=lf`，与该现象一致。其余文件原始字节即匹配。**问题在原始字节哈希的可复现性，不能据此判定运行结果失败或伪造。**

首个失败节点：接收方按 manifest 校验 Git 检出文件的原始字节。交回 C：可补充基于 Git 检出字节的新 manifest，或说明原 manifest 对应提交前 CRLF 原件；不要覆盖原始实验记录。D 不改 C 目录。后续证据包应在最终检出形式上生成/校验哈希，并注明仓库行尾规则。
