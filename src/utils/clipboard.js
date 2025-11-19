import { Validator } from "jsonschema";
import { tableSchema, areaSchema, noteSchema } from "../data/schemas.js";

const validator = new Validator();

const schemaMap = [
  { type: "table", schema: tableSchema },
  { type: "area", schema: areaSchema },
  { type: "note", schema: noteSchema },
];

export function classifyClipboardPayload(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  for (const { type, schema } of schemaMap) {
    if (validator.validate(payload, schema).valid) {
      return { type, payload };
    }
  }

  return null;
}

