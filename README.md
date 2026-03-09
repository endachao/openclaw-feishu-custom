# Feishu Custom Extension（并行插件，不覆盖官方 feishu）

## 目标
- 不修改内置 `feishu` 插件
- 额外提供 `feishu_custom_bitable_create_table`
- 避免 duplicate plugin id（使用 `id=feishu-custom`）

## 目录
- `extensions/feishu-custom/openclaw.plugin.json`
- `extensions/feishu-custom/index.ts`
- `extensions/feishu-custom/package.json`

## 注意
当前实现为最小可用骨架：
- 通过参数显式传入 `app_id/app_secret`
- 不接管 channel，只注册工具

## 后续增强
1. 从现有 channels.feishu 账户配置读取 app 凭证（避免明文传参）
2. 增加 `WrongRequestBody` fallback 兼容逻辑
3. 增加创建字段/记录批量能力
4. 提供工具路由：官方优先，自定义兜底
