import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import * as Lark from "@larksuiteoapi/node-sdk";

function getClient(params: { app_id?: string; app_secret?: string }) {
  if (!params.app_id || !params.app_secret) {
    throw new Error("Missing app_id/app_secret. Please pass Feishu app credentials explicitly.");
  }
  return new Lark.Client({ appId: params.app_id, appSecret: params.app_secret });
}

const CreateTableSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_name: Type.String({ description: "Name for the new table" }),
  default_view_name: Type.Optional(Type.String()),
  app_id: Type.String({ description: "Feishu app id" }),
  app_secret: Type.String({ description: "Feishu app secret" })
});

const plugin = {
  id: "feishu-custom",
  name: "Feishu Custom Tools",
  description: "Custom Feishu tools without overriding bundled feishu plugin",
  register(api: OpenClawPluginApi) {
    api.registerTool<{
      app_token: string;
      table_name: string;
      default_view_name?: string;
      app_id: string;
      app_secret: string;
    }>({
      name: "feishu_custom_bitable_create_table",
      description: "Create a new table in an existing Bitable app (custom plugin)",
      parameters: CreateTableSchema,
      async execute({ params }) {
        const client = getClient(params);
        const res = await client.bitable.appTable.create({
          path: { app_token: params.app_token },
          data: {
            table: {
              name: params.table_name,
              ...(params.default_view_name && { default_view_name: params.default_view_name })
            }
          }
        });

        if (res.code !== 0) throw new Error(res.msg || "create table failed");
        return {
          app_token: params.app_token,
          table_id: res.data?.table_id,
          default_view_id: res.data?.default_view_id,
          field_id_list: res.data?.field_id_list
        };
      }
    });

    api.logger.info?.("feishu-custom: registered feishu_custom_bitable_create_table");
  }
};

export default plugin;
