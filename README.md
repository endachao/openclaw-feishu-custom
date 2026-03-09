# feishu-custom-plugin

Custom OpenClaw extension that adds missing Feishu Bitable table-creation tools without modifying bundled `feishu` plugin.

## Plugin ID

`feishu-custom`

> Keep bundled `feishu` plugin enabled. This plugin is additive.

## Tools

1. `feishu_custom_bitable_create_table`
2. `feishu_custom_bitable_create_tables_batch`

## Parameters (credentials)

Each tool supports either:
- `app_id` + `app_secret` in params, or
- environment variables: `FEISHU_APP_ID` + `FEISHU_APP_SECRET`

## Local dev wiring (symlink)

```bash
ln -s /Users/chao/endachao/feishu-custom-plugin ~/.openclaw/extensions/feishu-custom
```

## Config snippet (`~/.openclaw/openclaw.json`)

```json
{
  "plugins": {
    "entries": {
      "feishu-custom": { "enabled": true }
    }
  }
}
```

## Notes

- This plugin does **not** register a channel, only tools.
- Use unique plugin id (`feishu-custom`) to avoid duplicate-id conflicts.
- Recommended strategy: official tools first, custom tools as fallback.
