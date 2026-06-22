import { DB, Cardinality, Constraint } from "../../data/constants";

export function createField(overrides = {}) {
  return {
    id: "field_id",
    name: "id",
    type: "INT",
    primary: false,
    unique: false,
    notNull: false,
    increment: false,
    default: "",
    comment: "",
    check: "",
    ...overrides,
  };
}

export function createTable(overrides = {}) {
  return {
    id: "table_users",
    name: "users",
    x: 0,
    y: 0,
    comment: "",
    color: "#175e7a",
    fields: [createField()],
    indices: [],
    uniqueConstraints: [],
    ...overrides,
  };
}

export function createDiagram(overrides = {}) {
  return {
    database: DB.MYSQL,
    tables: [createTable()],
    relationships: [],
    references: [],
    notes: [],
    areas: [],
    types: [],
    enums: [],
    ...overrides,
  };
}

export function createRelationship(overrides = {}) {
  return {
    id: "relationship_user_post",
    name: "fk_posts_user_id_users",
    startTableId: "table_posts",
    startFieldId: "field_user_id",
    endTableId: "table_users",
    endFieldId: "field_id",
    fields: [{ startFieldId: "field_user_id", endFieldId: "field_id" }],
    cardinality: Cardinality.MANY_TO_ONE,
    updateConstraint: Constraint.NONE,
    deleteConstraint: Constraint.NONE,
    ...overrides,
  };
}
