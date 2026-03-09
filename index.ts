import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { Type } from "@sinclair/typebox";
import * as Lark from "@larksuiteoapi/node-sdk";

type CredParams = {
  app_id?: string;
  app_secret?: string;
};

function getClient(params: CredParams) {
  const appId = params.app_id || process.env.FEISHU_APP_ID;
  const appSecret = params.app_secret || process.env.FEISHU_APP_SECRET;

  if (!appId || !appSecret) {
    throw new Error(
      "Missing Feishu credentials. Pass app_id/app_secret or set FEISHU_APP_ID + FEISHU_APP_SECRET.",
    );
  }
  return new Lark.Client({ appId, appSecret });
}

async function createTable(
  client: Lark.Client,
  appToken: string,
  tableName: string,
  defaultViewName?: string,
  fields?: Array<Record<string, unknown>>,
) {
  const requestWithTableWrapper = async () =>
    client.bitable.appTable.create({
      path: { app_token: appToken },
      data: {
        table: {
          name: tableName,
          ...(defaultViewName && { default_view_name: defaultViewName }),
          ...(fields && { fields: fields as any }),
        },
      },
    });

  const requestWithFlatBody = async () =>
    client.bitable.appTable.create({
      path: { app_token: appToken },
      data: {
        name: tableName,
        ...(defaultViewName && { default_view_name: defaultViewName }),
      } as unknown as Record<string, unknown>,
    });

  let res = await requestWithTableWrapper();
  if (res.code !== 0 && defaultViewName && res.msg === "WrongRequestBody") {
    res = await requestWithFlatBody();
  }

  if (res.code !== 0) throw new Error(res.msg || "create table failed");

  return {
    app_token: appToken,
    table_id: res.data?.table_id,
    default_view_id: res.data?.default_view_id,
    field_id_list: res.data?.field_id_list,
    hint: res.data?.table_id
      ? `Table created. Use app_token=\"${appToken}\" and table_id=\"${res.data.table_id}\" for next steps.`
      : undefined,
  };
}

const CreateTableSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_name: Type.String({ description: "Name for the new table" }),
  default_view_name: Type.Optional(Type.String({ description: "Optional default view name" })),
  fields: Type.Optional(
    Type.Array(Type.Record(Type.String(), Type.Any()), {
      description: "Optional initial fields passed through to Feishu app-table/create",
    }),
  ),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const CreateTablesBatchSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  tables: Type.Array(
    Type.Object({
      table_name: Type.String(),
      default_view_name: Type.Optional(Type.String()),
    }),
    { minItems: 1 },
  ),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
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
      fields?: Array<Record<string, unknown>>;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_create_table",
      description: "Create a new table in an existing Bitable app (custom plugin)",
      parameters: CreateTableSchema,
      async execute({ params }) {
        const client = getClient(params);
        return createTable(
          client,
          params.app_token,
          params.table_name,
          params.default_view_name,
          params.fields,
        );
      },
    });

    api.registerTool<{
      app_token: string;
      tables: Array<{ table_name: string; default_view_name?: string }>;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_create_tables_batch",
      description: "Create multiple tables in a Bitable app in sequence",
      parameters: CreateTablesBatchSchema,
      async execute({ params }) {
        const client = getClient(params);
        const results = [] as Array<Record<string, unknown>>;
        for (const t of params.tables) {
          const created = await createTable(client, params.app_token, t.table_name, t.default_view_name);
          results.push(created);
        }
        return {
          app_token: params.app_token,
          created_count: results.length,
          results,
        };
      },
    });

    api.logger.info?.(
      "feishu-custom: registered feishu_custom_bitable_create_table + feishu_custom_bitable_create_tables_batch",
    );
  },
};

export default plugin;
