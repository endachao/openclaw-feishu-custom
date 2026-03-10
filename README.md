# openclaw-feishu-custom

[English](./README_EN.md)

OpenClaw 飞书自定义扩展插件，补充官方 `feishu` 插件缺失的多维表格（Bitable）管理能力。

## 为什么需要这个插件

OpenClaw 内置的飞书插件提供了文档、聊天、Wiki、云盘、多维表格的基础操作，但在实际使用中存在以下问题：

1. **无法创建数据表** — 官方插件可以操作已有的多维表格，但不支持在 Bitable 应用内创建新的数据表
2. **权限管理缺失** — Agent 通过机器人身份创建的数据表，用户可能只有只读权限，无法编辑
3. **协作者管理不便** — 缺少批量设置角色、添加协作成员的工具

本插件通过飞书开放 API 补充了这些能力，与官方插件并行运行，互不干扰。

## 提供的工具

### 数据表管理

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_create_table` | 在已有 Bitable 应用中创建单个数据表，支持自定义字段和视图 |
| `feishu_custom_bitable_create_tables_batch` | 批量创建多个数据表 |

### 角色与权限

| 工具 | 说明 |
|------|------|
| `feishu_custom_bitable_list_app_roles` | 列出 Bitable 应用的所有自定义角色 |
| `feishu_custom_bitable_create_app_role` | 创建自定义角色并分配表级权限，不指定表时自动对所有表生效 |
| `feishu_custom_bitable_add_role_member` | 将用户/群组/部门添加为角色成员 |
| `feishu_custom_perm_add_member` | 通过云盘权限 API 添加协作者（推荐用于共享 Bitable） |

## 安装

### 方式一：在 OpenClaw 对话中直接安装

如果你已经在使用 OpenClaw，可以直接在对话里发送：

```text
帮我安装这个扩展：https://github.com/endachao/openclaw-feishu-custom
```

如果当前会话启用了技能安装能力，OpenClaw 会自动从 GitHub 拉取并安装该扩展。

### 方式二：命令行从 GitHub 安装

```bash
openclaw plugins install https://github.com/endachao/openclaw-feishu-custom.git
```

### 方式三：npm 安装

```bash
openclaw plugins install openclaw-feishu-custom
```

### 方式四：本地链接（开发用）

```bash
git clone https://github.com/endachao/openclaw-feishu-custom.git
openclaw plugins install --link ./openclaw-feishu-custom
```

安装后在配置中启用：

```json
{
  "plugins": {
    "entries": {
      "openclaw-feishu-custom": { "enabled": true }
    }
  }
}
```

> 请保持官方 `feishu` 插件同时启用。本插件是补充性质，不替代官方插件。

安装或修改配置后，重新加载 OpenClaw 配置或重启网关，使插件生效。

## 凭证配置

每个工具支持两种方式传入飞书应用凭证：

1. **环境变量**（推荐）：设置 `FEISHU_APP_ID` 和 `FEISHU_APP_SECRET`
2. **参数传入**：在调用时传入 `app_id` 和 `app_secret`

飞书应用需要开通以下权限：
- `bitable:app` — 多维表格操作
- `drive:permission:member` — 云盘权限管理

## 工具详细说明

### feishu_custom_bitable_create_table

创建单个数据表。内置 API 兼容性处理：先尝试 `table` 包裹结构，失败后自动降级为扁平结构，兼容不同租户的 API 差异。

**参数：**
- `app_token` (必填) — Bitable 应用 token
- `table_name` (必填) — 数据表名称
- `default_view_name` (可选) — 默认视图名称
- `fields` (可选) — 初始字段定义数组
- `app_id` / `app_secret` (可选) — 飞书应用凭证

### feishu_custom_bitable_create_tables_batch

顺序创建多个数据表。

**参数：**
- `app_token` (必填) — Bitable 应用 token
- `tables` (必填) — 表数组，每项包含 `table_name` 和可选的 `default_view_name`

### feishu_custom_bitable_create_app_role

创建自定义角色。如果不指定 `table_roles`，会自动获取应用内所有数据表并为每个表分配权限。

**参数：**
- `app_token` (必填) — Bitable 应用 token
- `role_name` (必填) — 角色名称
- `table_perm` (可选，默认 4) — 表权限级别（0=无权限, 1=只读, 2=可编辑, 4=管理）
- `table_roles` (可选) — 逐表指定权限，支持 `allow_add_record` 和 `allow_delete_record`

### feishu_custom_bitable_add_role_member

将成员添加到自定义角色。

**参数：**
- `app_token` (必填) — Bitable 应用 token
- `role_id` (必填) — 角色 ID
- `member_id` (必填) — 成员标识
- `member_id_type` (可选，默认 `open_id`) — 支持 `open_id`、`union_id`、`user_id`、`chat_id`、`department_id`、`open_department_id`

### feishu_custom_perm_add_member

通过飞书云盘权限 API 添加协作者，适用于所有飞书云文档类型。

**参数：**
- `token` (必填) — 资源 token
- `type` (必填) — 资源类型：`doc`、`sheet`、`file`、`wiki`、`bitable`、`docx`、`folder`、`mindnote`、`minutes`、`slides`
- `member_type` (必填) — 成员类型：`email`、`openid`、`unionid`、`openchat`、`opendepartmentid`、`userid`、`groupid`、`wikispaceid`
- `member_id` (必填) — 成员标识
- `perm` (必填) — 权限：`view`、`edit`、`full_access`
- `need_notification` (可选，默认 false) — 是否通知成员

## 典型使用场景

**场景：Agent 自动搭建 Bitable 数据系统**

1. 用户手动创建一个空的 Bitable 应用（避免权限问题）
2. Agent 使用 `feishu_custom_bitable_create_table` 创建所需的数据表
3. Agent 使用 `feishu_custom_bitable_create_app_role` 创建角色并分配权限
4. Agent 使用 `feishu_custom_bitable_add_role_member` 将用户添加为角色成员
5. 或者使用 `feishu_custom_perm_add_member` 直接共享给用户

## 许可证

MIT
