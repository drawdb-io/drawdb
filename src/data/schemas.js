const tableSchema = {
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

const areaSchema = {
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

const noteSchema = {
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

const typeSchema = {
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

const jsonSchema = {
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
          startX: { type: "number" },
          startY: { type: "number" },
          endX: { type: "number" },
          endY: { type: "number" },
          name: { type: "string" },
          cardinality: { type: "string" },
          updateConstraint: { type: "string" },
          deleteConstraint: { type: "string" },
          mandatory: { type: "boolean" },
          id: { type: "integer" },
        },
        required: [
          "startTableId",
          "startFieldId",
          "endTableId",
          "endFieldId",
          "startX",
          "startY",
          "endX",
          "endY",
          "name",
          "cardinality",
          "updateConstraint",
          "deleteConstraint",
          "mandatory",
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
    title: { type: "string" },
  },
  required: ["tables", "relationships", "notes", "subjectAreas"],
};

const ddbSchema = {
  type: "object",
  properties: {
    author: { type: "string" },
    project: { type: "string" },
    title: { type: "string" },
    date: { type: "string" },
    ...jsonSchema.properties,
  },
};

export {
  jsonSchema,
  ddbSchema,
  tableSchema,
  noteSchema,
  areaSchema,
  typeSchema,
};
