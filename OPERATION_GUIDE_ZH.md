# Benchmark Evolution 人类标注平台操作文档

本标注任务用于复核论文中的 benchmark evolution operator mapping 是否可以被独立人类标注者复现。平台已经为每条 benchmark 版本变化提供了公开记录中整理出的客观事实字段，你需要根据这些字段并核实来源，选择最合适的演化操作类型。

## 开始

打开标注网页后，输入你的标注者代号，例如：

```text
coder_A
```

然后点击“加载任务”或“加载/创建标注文件”。

## 每条数据是什么

每条样本是一条 benchmark 版本演化事件，例如：

```text
SWE-bench -> SWE-bench Verified
```

页面会展示：

- `from_version`：演化前版本
- `to_version`：演化后版本
- `date`：大致发布时间
- `source_url`：公开来源链接
- `capability_axis_change`：能力轴是否变化
- `morphology_change`：任务/数据/验证形态如何变化
- `saturation_driver`：饱和、污染、质量或覆盖不足等驱动因素

最终正确答案不会展示。

## 需要填写什么

核心必填：

```text
operator
```

可选：

```text
driver
note
```

后续主要用 `operator` 计算一致性。

## Operator 标签

| operator | 什么时候选 |
| --- | --- |
| `integrity_gate` | 主要修复标注、oracle、验证器、歧义、shortcut、可复现性等质量问题 |
| `harden` | 主要在同一能力方向上增加难度 |
| `capability_expand` | 主要加入新的能力轴、模态、任务形态或应用场景 |
| `freshness` | 主要用更新近、动态或 live 数据抵抗污染/记忆 |
| `recombine` | 主要组合多个已有 benchmark、数据集或任务族 |

## 常见歧义

`harden` vs `capability_expand`：

- 同一能力更难：选 `harden`
- 新增能力轴/模态/任务形态：选 `capability_expand`
- 两者都有：选主要变化，并在 `note` 说明

`integrity_gate` vs `freshness`：

- 修复质量：选 `integrity_gate`
- 更新时间新鲜度：选 `freshness`

`capability_expand` vs `recombine`：

- 新增能力：选 `capability_expand`
- 整合多个已有来源：选 `recombine`

## Source 怎么用

先看页面上的 objective facts，再打开 `source_url` 核实。优先看 README、abstract、introduction、release note、motivation/contribution 段落。

如果来源打不开但 facts 足够判断，可以正常标注，并在 `note` 写明：

```text
source unreachable; labeled from objective facts
```

如果完全无法判断，`operator` 选 `UNREACHABLE`。

## 保存与提交

每条标完后点击“保存并下一条”。全部完成后点击“下载 CSV”，把下载得到的 `coder_*.csv` 发回给项目方。

提交前确认：

- 每条都有 `operator`
- 不确定处写了 `note`
- 没有查看作者答案
- 没有和其他标注者讨论具体样本
- 没有使用 LLM 辅助判断
