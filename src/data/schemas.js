export const tableSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          default: { type: "string" },
          check: { type: "string" },
          primary: { type: "boolean" },
          unique: { type: "boolean" },
          notNull: { type: "boolean" },
          increment: { type: "boolean" },
          comment: { type: "string" },
          size: { type: ["string", "number"] },
          values: { type: "array", items: { type: "string" } },
        },
        required: [
          "name",
          "type",
          "default",
          "check",
          "primary",
          "unique",
          "notNull",
          "increment",
          "comment",
        ],
      },
    },
    comment: { type: "string" },
    indices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          unique: { type: "boolean" },
          fields: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "unique", "fields"],
      },
    },
    color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
  },
  required: ["id", "name", "x", "y", "fields", "comment", "indices", "color"],
};

export const areaSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
    width: { type: "number" },
    height: { type: "number" },
    color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
  },
  required: ["id", "name", "x", "y", "width", "height", "color"],
};

export const noteSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    x: { type: "number" },
    y: { type: "number" },
    title: { type: "string" },
    content: { type: "string" },
    color: { type: "string", pattern: "^#[0-9a-fA-F]{6}$" },
    height: { type: "number" },
  },
  required: ["id", "x", "y", "title", "content", "color", "height"],
};

export const typeSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          values: {
            type: "array",
            items: { type: "string" },
          },
        },
        required: ["name", "type"],
      },
    },
    comment: { type: "string" },
  },
  required: ["name", "fields", "comment"],
};

export const enumSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    values: {
      type: "array",
      items: { type: "string" },
    },
  },
};

export const jsonSchema = {
  type: "object",
  properties: {
    tables: {
      type: "array",
      items: { ...tableSchema },
    },
    relationships: {
      type: "array",
      items: {
        type: "object",
        properties: {
          startTableId: { type: "integer" },
          startFieldId: { type: "integer" },
          endTableId: { type: "integer" },
          endFieldId: { type: "integer" },
          name: { type: "string" },
          cardinality: { type: "string" },
          updateConstraint: { type: "string" },
          deleteConstraint: { type: "string" },
          id: { type: "integer" },
        },
        required: [
          "startTableId",
          "startFieldId",
          "endTableId",
          "endFieldId",
          "name",
          "cardinality",
          "updateConstraint",
          "deleteConstraint",
          "id",
        ],
      },
    },
    notes: {
      type: "array",
      items: { ...noteSchema },
    },
    subjectAreas: {
      type: "array",
      items: { ...areaSchema },
    },
    types: {
      type: "array",
      items: { ...typeSchema },
    },
    enums: {
      type: "array",
      items: { ...enumSchema },
    },
    title: { type: "string" },
    database: { type: "string" },
  },
  required: ["tables", "relationships", "notes", "subjectAreas"],
};

export const ddbSchema = {
  type: "object",
  properties: {
    author: { type: "string" },
    project: { type: "string" },
    title: { type: "string" },
    date: { type: "string" },
    ...jsonSchema.properties,
  },
};
