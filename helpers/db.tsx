import { Kysely, CamelCasePlugin } from "kysely";
import { PostgresJSDialect } from "kysely-postgres-js";
import postgres from "postgres";
import { DB } from "./schema";

export const db = new Kysely<DB>({
  plugins: [new CamelCasePlugin()],
  dialect: new PostgresJSDialect({
    postgres: postgres(process.env.FLOOT_DATABASE_URL, {
      prepare: false,
      idle_timeout: 10,
      max: 5,
    }),
  }),
});
