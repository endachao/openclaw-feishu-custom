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

function throwFeishuError(
  res: { code?: number; msg?: string; log_id?: string; error?: { log_id?: string } },
  fallbackMessage: string,
  hint?: string,
): never {
  const parts = [res.msg || fallbackMessage];
  if (res.code !== undefined) parts.push(`code=${res.code}`);
  const logId = res.log_id || res.error?.log_id;
  if (logId) parts.push(`log_id=${logId}`);
  if (hint) parts.push(hint);
  throw new Error(parts.join(" | "));
}

function rethrowFeishuException(error: any, fallbackMessage: string, hint?: string): never {
  const data = error?.response?.data;
  if (data && typeof data === "object") {
    throwFeishuError(
      {
        code: data.code,
        msg: data.msg,
        log_id: data.log_id,
        error: data.error,
      },
      fallbackMessage,
      hint,
    );
  }
  throw error;
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
          ...(fields && { fields: fields as any }),
        },
      },
    });

  const requestWithFlatBody = async () =>
    client.bitable.appTable.create({
      path: { app_token: appToken },
      data: {
        name: tableName,
      } as unknown as Record<string, unknown>,
    });

  let res = await requestWithTableWrapper();
  if (res.code !== 0) {
    // Feishu app-table/create has compatibility variance across tenants; flat body is safest fallback.
    res = await requestWithFlatBody();
  }

  if (res.code !== 0) throwFeishuError(res, "create table failed");

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

const ListTablesSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  page_size: Type.Optional(Type.Number({ description: "Page size (max 100)" })),
  page_token: Type.Optional(Type.String({ description: "Pagination token" })),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const DeleteRecordSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  record_id: Type.String({ description: "Record id to delete" }),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const BatchCreateRecordsSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  records: Type.Array(
    Type.Object({
      fields: Type.Record(Type.String(), Type.Any(), {
        description: "Record fields keyed by field name",
      }),
    }),
    { minItems: 1, description: "Records to create (max 500)" },
  ),
  user_id_type: Type.Optional(
    Type.Union([Type.Literal("user_id"), Type.Literal("union_id"), Type.Literal("open_id")]),
  ),
  client_token: Type.Optional(Type.String({ description: "Optional idempotency token" })),
  ignore_consistency_check: Type.Optional(Type.Boolean()),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const BatchUpdateRecordsSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  records: Type.Array(
    Type.Object({
      record_id: Type.String({ description: "Existing record id" }),
      fields: Type.Record(Type.String(), Type.Any(), {
        description: "Fields to update, keyed by field name",
      }),
    }),
    { minItems: 1, description: "Records to update (max 500)" },
  ),
  user_id_type: Type.Optional(
    Type.Union([Type.Literal("user_id"), Type.Literal("union_id"), Type.Literal("open_id")]),
  ),
  ignore_consistency_check: Type.Optional(Type.Boolean()),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const SearchRecordsSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  view_id: Type.Optional(Type.String({ description: "Optional view id to scope the search" })),
  field_names: Type.Optional(
    Type.Array(Type.String(), { description: "Optional field names to return" }),
  ),
  sort: Type.Optional(
    Type.Array(
      Type.Object({
        field_name: Type.Optional(Type.String()),
        desc: Type.Optional(Type.Boolean()),
      }),
      { description: "Sort rules" },
    ),
  ),
  filter: Type.Optional(
    Type.Any({
      description:
        "Feishu search filter object. Example: { conjunction: 'and', conditions: [{ field_name: '状态', operator: 'is', value: ['进行中'] }] }",
    }),
  ),
  user_id_type: Type.Optional(
    Type.Union([Type.Literal("user_id"), Type.Literal("union_id"), Type.Literal("open_id")]),
  ),
  page_size: Type.Optional(Type.Number({ description: "Page size (max 500)" })),
  page_token: Type.Optional(Type.String({ description: "Pagination token" })),
  automatic_fields: Type.Optional(Type.Boolean()),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const UpdateFieldSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  field_id: Type.String({ description: "Field id to update" }),
  field_name: Type.String({ description: "Field name" }),
  type: Type.Number({ description: "Field type number" }),
  property: Type.Optional(Type.Record(Type.String(), Type.Any())),
  description: Type.Optional(Type.Record(Type.String(), Type.Any())),
  ui_type: Type.Optional(Type.String({ description: "Optional UI type" })),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const DeleteFieldSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  field_id: Type.String({ description: "Field id to delete" }),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const UpdateTableSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  name: Type.String({ description: "New table name" }),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const DeleteTableSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  table_id: Type.String({ description: "Bitable table id" }),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const ListRoleMembersSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  role_id: Type.String({ description: "Bitable custom role id" }),
  page_size: Type.Optional(Type.Number({ description: "Page size" })),
  page_token: Type.Optional(Type.String({ description: "Pagination token" })),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const RemoveAppRoleMemberSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  role_id: Type.String({ description: "Bitable custom role id" }),
  member_id: Type.String({ description: "Member id to remove" }),
  member_id_type: Type.Optional(
    Type.Union([
      Type.Literal("open_id"),
      Type.Literal("union_id"),
      Type.Literal("user_id"),
      Type.Literal("chat_id"),
      Type.Literal("department_id"),
      Type.Literal("open_department_id"),
    ]),
  ),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const ListAppRolesSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const CreateAppRoleSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  role_name: Type.String({ description: "Custom role name" }),
  table_perm: Type.Optional(
    Type.Number({ description: "Table permission level for auto-generated table_roles (valid: 0,1,2,4; default 4)" }),
  ),
  table_roles: Type.Optional(
    Type.Array(
      Type.Object({
        table_id: Type.String(),
        table_perm: Type.Number(),
        allow_add_record: Type.Optional(Type.Boolean()),
        allow_delete_record: Type.Optional(Type.Boolean()),
      }),
      { minItems: 1 },
    ),
  ),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const AddAppRoleMemberSchema = Type.Object({
  app_token: Type.String({ description: "Bitable app token" }),
  role_id: Type.String({ description: "Bitable custom role id" }),
  member_id: Type.String({ description: "Member id value matching member_id_type" }),
  member_id_type: Type.Optional(
    Type.Union([
      Type.Literal("open_id"),
      Type.Literal("union_id"),
      Type.Literal("user_id"),
      Type.Literal("chat_id"),
      Type.Literal("department_id"),
      Type.Literal("open_department_id"),
    ]),
  ),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const PermAddMemberSchema = Type.Object({
  token: Type.String({ description: "Feishu resource token (for bitable: app_token)" }),
  type: Type.Union([
    Type.Literal("doc"),
    Type.Literal("sheet"),
    Type.Literal("file"),
    Type.Literal("wiki"),
    Type.Literal("bitable"),
    Type.Literal("docx"),
    Type.Literal("folder"),
    Type.Literal("mindnote"),
    Type.Literal("minutes"),
    Type.Literal("slides"),
  ]),
  member_type: Type.Union([
    Type.Literal("email"),
    Type.Literal("openid"),
    Type.Literal("unionid"),
    Type.Literal("openchat"),
    Type.Literal("opendepartmentid"),
    Type.Literal("userid"),
    Type.Literal("groupid"),
    Type.Literal("wikispaceid"),
  ]),
  member_id: Type.String({ description: "Target member id" }),
  perm: Type.Union([Type.Literal("view"), Type.Literal("edit"), Type.Literal("full_access")]),
  need_notification: Type.Optional(Type.Boolean()),
  app_id: Type.Optional(Type.String({ description: "Feishu app id (optional if env provided)" })),
  app_secret: Type.Optional(
    Type.String({ description: "Feishu app secret (optional if env provided)" }),
  ),
});

const plugin = {
  id: "openclaw-feishu-custom",
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
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_name: string;
          default_view_name?: string;
          fields?: Array<Record<string, unknown>>;
          app_id?: string;
          app_secret?: string;
        };
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
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          tables: Array<{ table_name: string; default_view_name?: string }>;
          app_id?: string;
          app_secret?: string;
        };
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

    api.registerTool<{
      app_token: string;
      page_size?: number;
      page_token?: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_list_tables",
      description: "List tables in a Bitable app",
      parameters: ListTablesSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          page_size?: number;
          page_token?: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTable.list({
          path: { app_token: params.app_token },
          params: {
            ...(params.page_size !== undefined && { page_size: params.page_size }),
            ...(params.page_token && { page_token: params.page_token }),
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "list tables failed");
        const items = res.data?.items || [];
        return {
          app_token: params.app_token,
          total: res.data?.total ?? items.length,
          has_more: res.data?.has_more ?? false,
          page_token: res.data?.page_token,
          tables: items.map((t: any) => ({
            table_id: t.table_id,
            name: t.name,
            revision: t.revision,
          })),
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      record_id: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_delete_record",
      description: "Delete a record from a Bitable table",
      parameters: DeleteRecordSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          record_id: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableRecord.delete({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
            record_id: params.record_id,
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "delete record failed");
        return {
          ok: res.data?.deleted ?? true,
          app_token: params.app_token,
          table_id: params.table_id,
          record_id: res.data?.record_id || params.record_id,
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      records: Array<{ fields: Record<string, unknown> }>;
      user_id_type?: "user_id" | "union_id" | "open_id";
      client_token?: string;
      ignore_consistency_check?: boolean;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_batch_create_records",
      description: "Create multiple records in a Bitable table",
      parameters: BatchCreateRecordsSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          records: Array<{ fields: Record<string, unknown> }>;
          user_id_type?: "user_id" | "union_id" | "open_id";
          client_token?: string;
          ignore_consistency_check?: boolean;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableRecord.batchCreate({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
          },
          params: {
            ...(params.user_id_type && { user_id_type: params.user_id_type }),
            ...(params.client_token && { client_token: params.client_token }),
            ...(params.ignore_consistency_check !== undefined && {
              ignore_consistency_check: params.ignore_consistency_check,
            }),
          },
          data: {
            records: params.records.map((record) => ({
              fields: record.fields as Record<string, any>,
            })),
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "batch create records failed");
        const items = res.data?.records || [];
        return {
          app_token: params.app_token,
          table_id: params.table_id,
          created_count: items.length,
          records: items.map((record: any) => ({
            record_id: record.record_id,
            fields: record.fields,
            record_url: record.record_url,
          })),
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      records: Array<{ record_id: string; fields: Record<string, unknown> }>;
      user_id_type?: "user_id" | "union_id" | "open_id";
      ignore_consistency_check?: boolean;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_batch_update_records",
      description: "Update multiple records in a Bitable table",
      parameters: BatchUpdateRecordsSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          records: Array<{ record_id: string; fields: Record<string, unknown> }>;
          user_id_type?: "user_id" | "union_id" | "open_id";
          ignore_consistency_check?: boolean;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableRecord.batchUpdate({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
          },
          params: {
            ...(params.user_id_type && { user_id_type: params.user_id_type }),
            ...(params.ignore_consistency_check !== undefined && {
              ignore_consistency_check: params.ignore_consistency_check,
            }),
          },
          data: {
            records: params.records.map((record) => ({
              record_id: record.record_id,
              fields: record.fields as Record<string, any>,
            })),
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "batch update records failed");
        const items = res.data?.records || [];
        return {
          app_token: params.app_token,
          table_id: params.table_id,
          updated_count: items.length,
          records: items.map((record: any) => ({
            record_id: record.record_id,
            fields: record.fields,
            record_url: record.record_url,
          })),
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      view_id?: string;
      field_names?: string[];
      sort?: Array<{ field_name?: string; desc?: boolean }>;
      filter?: Record<string, unknown>;
      user_id_type?: "user_id" | "union_id" | "open_id";
      page_size?: number;
      page_token?: string;
      automatic_fields?: boolean;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_search_records",
      description: "Search records in a Bitable table with structured filters",
      parameters: SearchRecordsSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          view_id?: string;
          field_names?: string[];
          sort?: Array<{ field_name?: string; desc?: boolean }>;
          filter?: Record<string, unknown>;
          user_id_type?: "user_id" | "union_id" | "open_id";
          page_size?: number;
          page_token?: string;
          automatic_fields?: boolean;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableRecord.search({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
          },
          params: {
            ...(params.user_id_type && { user_id_type: params.user_id_type }),
            ...(params.page_size !== undefined && { page_size: params.page_size }),
            ...(params.page_token && { page_token: params.page_token }),
          },
          data: {
            ...(params.view_id && { view_id: params.view_id }),
            ...(params.field_names && { field_names: params.field_names }),
            ...(params.sort && { sort: params.sort }),
            ...(params.filter && { filter: params.filter as Record<string, any> }),
            ...(params.automatic_fields !== undefined && {
              automatic_fields: params.automatic_fields,
            }),
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "search records failed");
        const items = res.data?.items || [];
        return {
          app_token: params.app_token,
          table_id: params.table_id,
          has_more: res.data?.has_more ?? false,
          page_token: res.data?.page_token,
          total: res.data?.total ?? items.length,
          items: items.map((record: any) => ({
            record_id: record.record_id,
            fields: record.fields,
            record_url: record.record_url,
          })),
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      field_id: string;
      field_name: string;
      type: number;
      property?: Record<string, unknown>;
      description?: Record<string, unknown>;
      ui_type?: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_update_field",
      description: "Update a field in a Bitable table",
      parameters: UpdateFieldSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          field_id: string;
          field_name: string;
          type: number;
          property?: Record<string, unknown>;
          description?: Record<string, unknown>;
          ui_type?: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableField.update({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
            field_id: params.field_id,
          },
          data: {
            field_name: params.field_name,
            type: params.type,
            ...(params.property && { property: params.property as Record<string, any> }),
            ...(params.description && { description: params.description as Record<string, any> }),
            ...(params.ui_type && { ui_type: params.ui_type as any }),
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "update field failed");
        return {
          app_token: params.app_token,
          table_id: params.table_id,
          field: res.data?.field,
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      field_id: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_delete_field",
      description: "Delete a field from a Bitable table",
      parameters: DeleteFieldSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          field_id: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTableField.delete({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
            field_id: params.field_id,
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "delete field failed");
        return {
          ok: res.data?.deleted ?? true,
          app_token: params.app_token,
          table_id: params.table_id,
          field_id: res.data?.field_id || params.field_id,
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      name: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_update_table",
      description: "Rename a table in a Bitable app",
      parameters: UpdateTableSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          name: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTable.patch({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
          },
          data: { name: params.name },
        });
        if (res.code !== 0) throw new Error(res.msg || "update table failed");
        return {
          app_token: params.app_token,
          table_id: params.table_id,
          name: res.data?.name || params.name,
        };
      },
    });

    api.registerTool<{
      app_token: string;
      table_id: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_delete_table",
      description: "Delete a table from a Bitable app",
      parameters: DeleteTableSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          table_id: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.bitable.appTable.delete({
          path: {
            app_token: params.app_token,
            table_id: params.table_id,
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "delete table failed");
        return {
          ok: true,
          app_token: params.app_token,
          table_id: params.table_id,
        };
      },
    });

    api.registerTool<{
      app_token: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_list_app_roles",
      description: "List custom roles in a Bitable app",
      parameters: ListAppRolesSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        try {
          const res = await client.bitable.appRole.list({
            path: { app_token: params.app_token },
            params: { page_size: 30 },
          });
          if (res.code !== 0) {
            throwFeishuError(
              res,
              "list app roles failed",
              "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
            );
          }
          const items = res.data?.items || [];
          return {
            app_token: params.app_token,
            total: items.length,
            roles: items.map((r: any) => ({ role_id: r.role_id, role_name: r.role_name })),
          };
        } catch (error) {
          rethrowFeishuException(
            error,
            "list app roles failed",
            "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
          );
        }
      },
    });

    api.registerTool<{
      app_token: string;
      role_id: string;
      page_size?: number;
      page_token?: string;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_list_role_members",
      description: "List collaborators in a Bitable custom role",
      parameters: ListRoleMembersSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          role_id: string;
          page_size?: number;
          page_token?: string;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        try {
          const res = await client.bitable.appRoleMember.list({
            path: {
              app_token: params.app_token,
              role_id: params.role_id,
            },
            params: {
              ...(params.page_size !== undefined && { page_size: params.page_size }),
              ...(params.page_token && { page_token: params.page_token }),
            },
          });
          if (res.code !== 0) {
            throwFeishuError(
              res,
              "list role members failed",
              "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
            );
          }
          const items = res.data?.items || [];
          return {
            app_token: params.app_token,
            role_id: params.role_id,
            total: res.data?.total ?? items.length,
            has_more: res.data?.has_more ?? false,
            page_token: res.data?.page_token,
            members: items,
          };
        } catch (error) {
          rethrowFeishuException(
            error,
            "list role members failed",
            "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
          );
        }
      },
    });

    api.registerTool<{
      app_token: string;
      role_id: string;
      member_id: string;
      member_id_type?:
        | "open_id"
        | "union_id"
        | "user_id"
        | "chat_id"
        | "department_id"
        | "open_department_id";
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_remove_role_member",
      description: "Remove a collaborator from a Bitable custom role",
      parameters: RemoveAppRoleMemberSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          role_id: string;
          member_id: string;
          member_id_type?:
            | "open_id"
            | "union_id"
            | "user_id"
            | "chat_id"
            | "department_id"
            | "open_department_id";
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        try {
          const res = await client.bitable.appRoleMember.delete({
            path: {
              app_token: params.app_token,
              role_id: params.role_id,
              member_id: params.member_id,
            },
            params: {
              ...(params.member_id_type && { member_id_type: params.member_id_type }),
            },
          });
          if (res.code !== 0) {
            throwFeishuError(
              res,
              "remove role member failed",
              "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
            );
          }
          return {
            ok: true,
            app_token: params.app_token,
            role_id: params.role_id,
            member_id: params.member_id,
            member_id_type: params.member_id_type || "open_id",
          };
        } catch (error) {
          rethrowFeishuException(
            error,
            "remove role member failed",
            "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
          );
        }
      },
    });

    api.registerTool<{
      app_token: string;
      role_name: string;
      table_perm?: number;
      table_roles?: Array<{
        table_id: string;
        table_perm: number;
        allow_add_record?: boolean;
        allow_delete_record?: boolean;
      }>;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_create_app_role",
      description: "Create a custom role for a Bitable app",
      parameters: CreateAppRoleSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          role_name: string;
          table_perm?: number;
          table_roles?: Array<{
            table_id: string;
            table_perm: number;
            allow_add_record?: boolean;
            allow_delete_record?: boolean;
          }>;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);

        try {
          let tableRoles = params.table_roles;
          if (!tableRoles || tableRoles.length === 0) {
            const listRes = await client.bitable.appTable.list({
              path: { app_token: params.app_token },
              params: { page_size: 100 },
            });
            if (listRes.code !== 0) throwFeishuError(listRes, "list app tables failed");
            const items = listRes.data?.items || [];
            if (!items.length) throw new Error("no tables found in app; cannot create role");
            const defaultPerm = params.table_perm ?? 4;
            tableRoles = items
              .map((t: any) => t.table_id)
              .filter(Boolean)
              .map((tableId: string) => ({ table_id: tableId, table_perm: defaultPerm }));
          }

          const res = await client.bitable.appRole.create({
            path: { app_token: params.app_token },
            data: {
              role_name: params.role_name,
              table_roles: tableRoles.map((t) => ({
                table_id: t.table_id,
                table_perm: t.table_perm,
                ...(t.allow_add_record !== undefined && { allow_add_record: t.allow_add_record }),
                ...(t.allow_delete_record !== undefined && { allow_delete_record: t.allow_delete_record }),
              })),
            },
          });
          if (res.code !== 0) {
            throwFeishuError(
              res,
              "create app role failed",
              "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
            );
          }
          return {
            app_token: params.app_token,
            role_id: res.data?.role?.role_id,
            role_name: res.data?.role?.role_name || params.role_name,
            table_roles_count: res.data?.role?.table_roles?.length ?? tableRoles.length,
          };
        } catch (error) {
          rethrowFeishuException(
            error,
            "create app role failed",
            "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
          );
        }
      },
    });

    api.registerTool<{
      app_token: string;
      role_id: string;
      member_id: string;
      member_id_type?:
        | "open_id"
        | "union_id"
        | "user_id"
        | "chat_id"
        | "department_id"
        | "open_department_id";
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_bitable_add_role_member",
      description: "Add a collaborator to a Bitable custom role (app.role.member.create)",
      parameters: AddAppRoleMemberSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          app_token: string;
          role_id: string;
          member_id: string;
          member_id_type?:
            | "open_id"
            | "union_id"
            | "user_id"
            | "chat_id"
            | "department_id"
            | "open_department_id";
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        try {
          const res = await client.bitable.appRoleMember.create({
            path: {
              app_token: params.app_token,
              role_id: params.role_id,
            },
            params: {
              member_id_type: params.member_id_type || "open_id",
            },
            data: {
              member_id: params.member_id,
            },
          });
          if (res.code !== 0) {
            throwFeishuError(
              res,
              "add role member failed",
              "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
            );
          }
          return {
            ok: true,
            app_token: params.app_token,
            role_id: params.role_id,
            member_id: params.member_id,
            member_id_type: params.member_id_type || "open_id",
          };
        } catch (error) {
          rethrowFeishuException(
            error,
            "add role member failed",
            "This API may require Feishu Bitable advanced permissions to be enabled for the app or tenant.",
          );
        }
      },
    });

    api.registerTool<{
      token: string;
      type:
        | "doc"
        | "sheet"
        | "file"
        | "wiki"
        | "bitable"
        | "docx"
        | "folder"
        | "mindnote"
        | "minutes"
        | "slides";
      member_type:
        | "email"
        | "openid"
        | "unionid"
        | "openchat"
        | "opendepartmentid"
        | "userid"
        | "groupid"
        | "wikispaceid";
      member_id: string;
      perm: "view" | "edit" | "full_access";
      need_notification?: boolean;
      app_id?: string;
      app_secret?: string;
    }>({
      name: "feishu_custom_perm_add_member",
      description: "Add collaborator via drive.permissionMember.create (recommended for bitable share)",
      parameters: PermAddMemberSchema,
      async execute(ctxOrParams: any, rawParams?: any) {
        const params = (ctxOrParams && typeof ctxOrParams === "object" && "params" in ctxOrParams
          ? (ctxOrParams as any).params
          : (rawParams ?? ctxOrParams)) as {
          token: string;
          type:
            | "doc"
            | "sheet"
            | "file"
            | "wiki"
            | "bitable"
            | "docx"
            | "folder"
            | "mindnote"
            | "minutes"
            | "slides";
          member_type:
            | "email"
            | "openid"
            | "unionid"
            | "openchat"
            | "opendepartmentid"
            | "userid"
            | "groupid"
            | "wikispaceid";
          member_id: string;
          perm: "view" | "edit" | "full_access";
          need_notification?: boolean;
          app_id?: string;
          app_secret?: string;
        };
        const client = getClient(params);
        const res = await client.drive.permissionMember.create({
          path: { token: params.token },
          params: {
            type: params.type,
            need_notification: params.need_notification ?? false,
          },
          data: {
            member_type: params.member_type,
            member_id: params.member_id,
            perm: params.perm,
          },
        });
        if (res.code !== 0) throw new Error(res.msg || "permission add member failed");
        return {
          ok: true,
          token: params.token,
          type: params.type,
          member_id: params.member_id,
          member_type: params.member_type,
          perm: params.perm,
          member: res.data?.member,
        };
      },
    });

    api.logger.info?.(
      "feishu-custom: registered table/record/role/permission tools",
    );
  },
};

export default plugin;
