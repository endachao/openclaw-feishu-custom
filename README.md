# openclaw-feishu-custom

[English](./README_EN.md)

为 OpenClaw 补齐飞书多维表格（Bitable / Base）自动化能力的增强插件。

它解决的不是“能不能读表”，而是“能不能真的把一整套业务表系统搭起来并管起来”。

## 这个插件解决什么问题

OpenClaw 内置 `feishu` 插件已经覆盖了不少飞书能力，但在多维表格场景里，很多关键动作原生并没有完整暴露。真实业务里你通常还需要：

- 创建和管理数据表，而不只是读已有表
- 批量创建、更新、搜索记录
- 调整字段、视图、表单、仪表盘、工作流
- 给用户补权限、加角色、加协作者

`openclaw-feishu-custom` 就是为这些缺口准备的。

## 适合谁

- 想用 OpenClaw 自动搭建飞书多维表格业务系统的人
- 想让 Agent 自动维护表结构、记录、视图和表单的人
- 想把“创建表 + 配权限 + 加协作者”串成完整流程的人

## 你能得到什么

这个插件目前已经覆盖以下能力：

### 数据表

- 创建数据表
- 批量创建数据表
- 列出数据表
- 更新数据表名称
- 删除数据表

### 记录

- 删除记录
- 批量创建记录
- 批量更新记录
- 条件搜索记录

### 字段

- 更新字段
- 删除字段

### 视图

- 创建视图
- 列出视图
- 获取视图详情
- 更新视图
- 删除视图

### 表单

- 获取表单元数据
- 更新表单元数据
- 列出表单问题项
- 更新表单问题项

### 仪表盘与工作流

- 列出仪表盘
- 复制仪表盘
- 列出工作流
- 更新工作流状态

### 权限与协作

- 列出自定义角色
- 创建自定义角色
- 添加角色成员
- 列出角色成员
- 移除角色成员
- 通过 Drive 权限接口直接给 Bitable 加协作者

## 当前工具清单

### 数据表

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_create_table` | 创建单个数据表 |
| `feishu_custom_bitable_create_tables_batch` | 批量创建数据表 |
| `feishu_custom_bitable_list_tables` | 列出数据表 |
| `feishu_custom_bitable_update_table` | 更新数据表名称 |
| `feishu_custom_bitable_delete_table` | 删除数据表 |

### 记录

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_delete_record` | 删除单条记录 |
| `feishu_custom_bitable_batch_create_records` | 批量创建记录 |
| `feishu_custom_bitable_batch_update_records` | 批量更新记录 |
| `feishu_custom_bitable_search_records` | 按条件搜索记录 |

### 字段

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_update_field` | 更新字段 |
| `feishu_custom_bitable_delete_field` | 删除字段 |

### 视图

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_create_view` | 创建视图 |
| `feishu_custom_bitable_list_views` | 列出视图 |
| `feishu_custom_bitable_get_view` | 获取视图详情 |
| `feishu_custom_bitable_update_view` | 更新视图 |
| `feishu_custom_bitable_delete_view` | 删除视图 |

### 表单

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_get_form` | 获取表单元数据 |
| `feishu_custom_bitable_update_form` | 更新表单元数据 |
| `feishu_custom_bitable_list_form_fields` | 列出表单问题项 |
| `feishu_custom_bitable_update_form_field` | 更新表单问题项 |

### 仪表盘与工作流

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_list_dashboards` | 列出仪表盘 |
| `feishu_custom_bitable_copy_dashboard` | 复制仪表盘 |
| `feishu_custom_bitable_list_workflows` | 列出工作流 |
| `feishu_custom_bitable_update_workflow` | 更新工作流状态 |

### 权限与协作

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_list_app_roles` | 列出自定义角色 |
| `feishu_custom_bitable_create_app_role` | 创建自定义角色 |
| `feishu_custom_bitable_add_role_member` | 添加角色成员 |
| `feishu_custom_bitable_list_role_members` | 列出角色成员 |
| `feishu_custom_bitable_remove_role_member` | 移除角色成员 |
| `feishu_custom_perm_add_member` | 直接添加协作者权限 |

## 快速安装

### 方式一：直接在 OpenClaw 对话里安装

如果你已经在使用 OpenClaw，直接发送：

```text
帮我安装这个扩展：https://github.com/endachao/openclaw-feishu-custom
```

### 方式二：从 npm 安装

```bash
openclaw plugins install openclaw-feishu-custom
```

### 方式三：从 GitHub 安装

```bash
openclaw plugins install https://github.com/endachao/openclaw-feishu-custom.git
```

### 方式四：本地 link（开发用）

```bash
git clone https://github.com/endachao/openclaw-feishu-custom.git
openclaw plugins install --link ./openclaw-feishu-custom
```

安装后在 `openclaw.json` 中启用：

```json
{
  "plugins": {
    "entries": {
      "openclaw-feishu-custom": { "enabled": true }
    }
  }
}
```

> 请保持官方 `feishu` 插件同时启用。这个插件是增强层，不是替代品。

## 凭证方式

支持两种传参方式：

1. 环境变量：`FEISHU_APP_ID` + `FEISHU_APP_SECRET`
2. 调用参数：在工具参数里传 `app_id` / `app_secret`

推荐优先使用环境变量。

## 典型场景

### 场景一：Agent 自动搭建业务表

1. 用户先创建一个空的 Bitable 应用
2. Agent 创建多个数据表
3. Agent 批量写入初始记录
4. Agent 创建视图、表单、仪表盘
5. Agent 给团队成员补权限和协作关系

### 场景二：把飞书表当成业务数据库维护

- 批量导入记录
- 批量更新状态
- 搜索目标记录
- 调整字段和视图
- 维护工作流状态

## 一个最小示例

比如你想让 OpenClaw 在一个现有 Bitable 应用里新建表：

```text
调用 feishu_custom_bitable_create_table：
- app_token: 你的 bitable app_token
- table_name: 客户线索
```

或者批量写入记录：

```text
调用 feishu_custom_bitable_batch_create_records：
- app_token: 你的 bitable app_token
- table_id: 你的 table_id
- records:
  - fields: { 姓名: 张三, 状态: 新建 }
  - fields: { 姓名: 李四, 状态: 跟进中 }
```

## 为什么不是直接用官方插件

因为很多实际需要的 Bitable 操作，官方插件在当前 OpenClaw 环境里并没有完整开放。

这个插件的定位很明确：

- 不覆盖官方 `feishu`
- 不改内置插件行为
- 只补齐 Bitable 自动化缺口

## 已知说明

- 角色、角色成员等部分接口，可能受飞书高级权限或租户配置限制
- 这类场景下，插件会尽量返回更明确的 `code / msg / log_id`
- 某些表单、仪表盘、工作流接口是否可用，还取决于你的飞书侧资源和权限状态

## 仓库状态

这个插件已经完成并发布了以下能力阶段：

- P0：表与记录基础增强
- P1：字段、表、角色成员管理
- P2：视图管理
- P3：表单、仪表盘、工作流

## License

MIT
