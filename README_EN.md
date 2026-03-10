# openclaw-feishu-custom

[中文](./README.md)

An OpenClaw plugin that fills the real automation gaps in Feishu Bitable (Base).

This is not just about reading tables. It is about letting an agent create, shape, populate, share, and maintain an entire Bitable-driven workflow.

## What Problem This Plugin Solves

OpenClaw's bundled `feishu` plugin already covers a broad set of Feishu capabilities, but real Bitable automation usually needs more than basic read/write access. In practice, teams also need to:

- create and manage tables, not only operate on existing ones
- batch create, batch update, and search records
- adjust fields, views, forms, dashboards, and workflows
- assign roles, add collaborators, and fix permission gaps

`openclaw-feishu-custom` is built for those missing pieces.

## Who This Is For

- Teams using OpenClaw to build Feishu Bitable-powered internal systems
- Builders who want agents to maintain table structure, records, views, and forms
- Anyone who needs a full workflow: create tables, write data, assign permissions, and share access

## What You Get

The plugin currently covers these capability areas:

### Tables

- Create tables
- Batch create tables
- List tables
- Rename tables
- Delete tables

### Records

- Delete records
- Batch create records
- Batch update records
- Search records with structured filters

### Fields

- Update fields
- Delete fields

### Views

- Create views
- List views
- Get view details
- Update views
- Delete views

### Forms

- Get form metadata
- Update form metadata
- List form fields
- Update form fields

### Dashboards & Workflows

- List dashboards
- Copy dashboards
- List workflows
- Update workflow status

### Permissions & Collaboration

- List custom roles
- Create custom roles
- Add role members
- List role members
- Remove role members
- Add collaborators through the Drive permission API

## Current Tool List

### Tables

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_create_table` | Create a single table |
| `feishu_custom_bitable_create_tables_batch` | Create multiple tables |
| `feishu_custom_bitable_list_tables` | List tables |
| `feishu_custom_bitable_update_table` | Rename a table |
| `feishu_custom_bitable_delete_table` | Delete a table |

### Records

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_delete_record` | Delete a single record |
| `feishu_custom_bitable_batch_create_records` | Create records in batch |
| `feishu_custom_bitable_batch_update_records` | Update records in batch |
| `feishu_custom_bitable_search_records` | Search records with filters |

### Fields

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_update_field` | Update a field |
| `feishu_custom_bitable_delete_field` | Delete a field |

### Views

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_create_view` | Create a view |
| `feishu_custom_bitable_list_views` | List views |
| `feishu_custom_bitable_get_view` | Get view details |
| `feishu_custom_bitable_update_view` | Update a view |
| `feishu_custom_bitable_delete_view` | Delete a view |

### Forms

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

### Permissions & Collaboration

| Tool | Description |
|------|-------------|
| `feishu_custom_bitable_list_app_roles` | List custom roles |
| `feishu_custom_bitable_create_app_role` | Create a custom role |
| `feishu_custom_bitable_add_role_member` | Add a role member |
| `feishu_custom_bitable_list_role_members` | List role members |
| `feishu_custom_bitable_remove_role_member` | Remove a role member |
| `feishu_custom_perm_add_member` | Add collaborator permission directly |

## Quick Install

### Option 1: Install directly from an OpenClaw chat

If you already use OpenClaw, send:

```text
Help me install this extension: https://github.com/endachao/openclaw-feishu-custom
```

### Option 2: Install from npm

```bash
openclaw plugins install openclaw-feishu-custom
```

### Option 3: Install from GitHub

```bash
openclaw plugins install https://github.com/endachao/openclaw-feishu-custom.git
```

### Option 4: Link a local checkout for development

```bash
git clone https://github.com/endachao/openclaw-feishu-custom.git
openclaw plugins install --link ./openclaw-feishu-custom
```

Then enable it in `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "openclaw-feishu-custom": { "enabled": true }
    }
  }
}
```

> Keep the bundled `feishu` plugin enabled. This plugin is an augmentation layer, not a replacement.

## Credentials

Two credential patterns are supported:

1. Environment variables: `FEISHU_APP_ID` and `FEISHU_APP_SECRET`
2. Inline tool parameters: `app_id` and `app_secret`

Environment variables are recommended for normal use.

## Typical Use Cases

### Use Case 1: Agent builds a business system in Bitable

1. A user creates an empty Bitable app
2. The agent creates multiple tables
3. The agent writes initial records in batch
4. The agent creates views, forms, and dashboards
5. The agent assigns roles and shares access with the team

### Use Case 2: Use Feishu Bitable like an operational database

- import records in bulk
- update status fields in batches
- search target records
- adjust fields and views
- maintain workflow status

## Minimal Example

If you want OpenClaw to create a table in an existing Bitable app:

```text
Call feishu_custom_bitable_create_table with:
- app_token: your bitable app_token
- table_name: Customer Leads
```

Or batch insert records:

```text
Call feishu_custom_bitable_batch_create_records with:
- app_token: your bitable app_token
- table_id: your table_id
- records:
  - fields: { Name: Alice, Status: New }
  - fields: { Name: Bob, Status: In Progress }
```

## Why Not Just Use the Official Plugin

Because many practical Bitable actions are still not fully exposed by the bundled plugin in real OpenClaw workflows.

This plugin has a very clear position:

- it does not override the official `feishu` plugin
- it does not change bundled plugin behavior
- it only fills Bitable automation gaps

## Notes and Limitations

- Some role and role-member APIs may be restricted by Feishu advanced permissions or tenant-level settings
- In those cases, the plugin tries to surface clearer `code / msg / log_id` details
- Form, dashboard, and workflow endpoints still depend on what resources and permissions exist in your Feishu environment

## Project Status

The plugin has already shipped these milestones:

- P0: core table and record enhancements
- P1: field, table, and role-member management
- P2: view management
- P3: form, dashboard, and workflow support

## License

MIT
