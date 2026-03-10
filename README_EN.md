# openclaw-feishu-custom

[中文](./README.md)

An OpenClaw plugin that extends the built-in Feishu integration with Bitable table management, role-based access control, and permission sharing tools.

## Why This Plugin

OpenClaw's bundled `feishu` plugin handles docs, chat, Wiki, Drive, and basic Bitable operations, but falls short in several areas:

1. **No table creation** — The official plugin can operate on existing Bitable tables but cannot create new ones inside a Bitable app
2. **No permission management** — Tables created by the agent (as a bot) may leave users with read-only access
3. **No role management** — No tools for creating custom roles, assigning table-level permissions, or adding collaborators

This plugin fills those gaps using Feishu's Open API and runs alongside the official plugin without conflicts.

## Tools

### Table Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_create_table` | Create a single table in an existing Bitable app with optional fields and views |
| `feishu_custom_bitable_create_tables_batch` | Create multiple tables sequentially |
| `feishu_custom_bitable_list_tables` | List tables in a Bitable app |
| `feishu_custom_bitable_update_table` | Rename a table |
| `feishu_custom_bitable_delete_table` | Delete a table |

### Roles & Permissions

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_list_app_roles` | List all custom roles in a Bitable app |
| `feishu_custom_bitable_create_app_role` | Create a custom role with table-level permissions; auto-applies to all tables if none specified |
| `feishu_custom_bitable_add_role_member` | Add a user/group/department to a custom role |
| `feishu_custom_perm_add_member` | Add collaborator via Drive permission API (recommended for sharing Bitable) |

### Record Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_delete_record` | Delete a single record |
| `feishu_custom_bitable_batch_create_records` | Create multiple records in one request |
| `feishu_custom_bitable_batch_update_records` | Update multiple records in one request |
| `feishu_custom_bitable_search_records` | Search records with structured filters |

### Field Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_update_field` | Update field configuration |
| `feishu_custom_bitable_delete_field` | Delete a field |

### Role Member Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_list_role_members` | List collaborators in a custom role |
| `feishu_custom_bitable_remove_role_member` | Remove a collaborator from a custom role |

### View Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_create_view` | Create a view |
| `feishu_custom_bitable_list_views` | List views |
| `feishu_custom_bitable_get_view` | Get a single view |
| `feishu_custom_bitable_update_view` | Update a view |
| `feishu_custom_bitable_delete_view` | Delete a view |

### Form Management

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_get_form` | Get form metadata |
| `feishu_custom_bitable_update_form` | Update form metadata |
| `feishu_custom_bitable_list_form_fields` | List form fields |
| `feishu_custom_bitable_update_form_field` | Update a form field |

### Dashboards & Workflows

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_list_dashboards` | List dashboards |
| `feishu_custom_bitable_copy_dashboard` | Copy a dashboard |
| `feishu_custom_bitable_list_workflows` | List workflows |
| `feishu_custom_bitable_update_workflow` | Update workflow status |

## Installation

### Option 1: Install directly from an OpenClaw chat

If you are already using OpenClaw, send this message in chat:

```text
Help me install this extension: https://github.com/endachao/openclaw-feishu-custom
```

If the current session has installer capability enabled, OpenClaw can fetch and install the extension directly from GitHub.

### Option 2: Install from GitHub via CLI

```bash
openclaw plugins install https://github.com/endachao/openclaw-feishu-custom.git
```

### Option 3: Install from npm

```bash
openclaw plugins install openclaw-feishu-custom
```

### Option 4: Link a local checkout for development

```bash
git clone https://github.com/endachao/openclaw-feishu-custom.git
openclaw plugins install --link ./openclaw-feishu-custom
```

Then enable in your config:

```json
{
  "plugins": {
    "entries": {
      "openclaw-feishu-custom": { "enabled": true }
    }
  }
}
```

> Keep the bundled `feishu` plugin enabled. This plugin is additive, not a replacement.

After installation or config changes, reload OpenClaw config or restart the gateway so the plugin is picked up.

## Credentials

Each tool accepts Feishu app credentials in two ways:

1. **Environment variables** (recommended): `FEISHU_APP_ID` and `FEISHU_APP_SECRET`
2. **Inline parameters**: pass `app_id` and `app_secret` per call

Required Feishu app permissions:
- `bitable:app` — Bitable operations
- `drive:permission:member` — Drive permission management

## Tool Reference

### feishu_custom_bitable_create_table

Create a single table. Has built-in API compatibility handling: tries the `table`-wrapped structure first, falls back to flat body for tenants with API variance.

**Parameters:**
- `app_token` (required) — Bitable app token
- `table_name` (required) — Table name
- `default_view_name` (optional) — Default view name
- `fields` (optional) — Initial field definitions array
- `app_id` / `app_secret` (optional) — Feishu app credentials

### feishu_custom_bitable_create_tables_batch

Create multiple tables sequentially.

**Parameters:**
- `app_token` (required) — Bitable app token
- `tables` (required) — Array of `{ table_name, default_view_name? }`

### feishu_custom_bitable_create_app_role

Create a custom role. If `table_roles` is not specified, automatically fetches all tables in the app and applies the default permission to each.

**Parameters:**
- `app_token` (required) — Bitable app token
- `role_name` (required) — Role name
- `table_perm` (optional, default 4) — Permission level (0=none, 1=read, 2=edit, 4=manage)
- `table_roles` (optional) — Per-table permissions with optional `allow_add_record` and `allow_delete_record`

### feishu_custom_bitable_add_role_member

Add a member to a custom role.

**Parameters:**
- `app_token` (required) — Bitable app token
- `role_id` (required) — Role ID
- `member_id` (required) — Member identifier
- `member_id_type` (optional, default `open_id`) — One of `open_id`, `union_id`, `user_id`, `chat_id`, `department_id`, `open_department_id`

### feishu_custom_perm_add_member

Add a collaborator via Feishu Drive permission API. Works with all Feishu document types.

**Parameters:**
- `token` (required) — Resource token
- `type` (required) — Resource type: `doc`, `sheet`, `file`, `wiki`, `bitable`, `docx`, `folder`, `mindnote`, `minutes`, `slides`
- `member_type` (required) — Member type: `email`, `openid`, `unionid`, `openchat`, `opendepartmentid`, `userid`, `groupid`, `wikispaceid`
- `member_id` (required) — Member identifier
- `perm` (required) — Permission: `view`, `edit`, `full_access`
- `need_notification` (optional, default false) — Whether to notify the member

## Typical Use Case

**Scenario: Agent builds a Bitable data system automatically**

1. User creates an empty Bitable app manually (avoids permission issues)
2. Agent uses `feishu_custom_bitable_create_table` to create the needed tables
3. Agent uses `feishu_custom_bitable_create_app_role` to create roles with permissions
4. Agent uses `feishu_custom_bitable_add_role_member` to add users to roles
5. Or uses `feishu_custom_perm_add_member` to share directly with users

## License

MIT
