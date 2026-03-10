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
        const res = await client.bitable.appRole.list({
          path: { app_token: params.app_token },
          params: { page_size: 30 },
        });
        if (res.code !== 0) throw new Error(res.msg || "list app roles failed");
        const items = res.data?.items || [];
        return {
          app_token: params.app_token,
          total: items.length,
          roles: items.map((r: any) => ({ role_id: r.role_id, role_name: r.role_name })),
        };
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

        let tableRoles = params.table_roles;
        if (!tableRoles || tableRoles.length === 0) {
          const listRes = await client.bitable.appTable.list({
            path: { app_token: params.app_token },
            params: { page_size: 100 },
          });
          if (listRes.code !== 0) throw new Error(listRes.msg || "list app tables failed");
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
        if (res.code !== 0) throw new Error(res.msg || "create app role failed");
        return {
          app_token: params.app_token,
          role_id: res.data?.role?.role_id,
          role_name: res.data?.role?.role_name || params.role_name,
          table_roles_count: res.data?.role?.table_roles?.length ?? tableRoles.length,
        };
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
        if (res.code !== 0) throw new Error(res.msg || "add role member failed");
        return {
          ok: true,
          app_token: params.app_token,
          role_id: params.role_id,
          member_id: params.member_id,
          member_id_type: params.member_id_type || "open_id",
        };
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
      "feishu-custom: registered create_table/create_tables_batch + list_app_roles + create_app_role + add_role_member + perm_add_member",
    );
  },
};

export default plugin;
