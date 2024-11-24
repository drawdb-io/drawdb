import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";

export const languageExtension = {
  sql: [sql()],
  json: [json()],
};
