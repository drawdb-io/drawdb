import { Parser } from "node-sql-parser";
import { nanoid } from "nanoid";
import { Cardinality, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { buildSQLFromAST } from "./shared";

const affinity = {
  [DB.MSSQL]: new Proxy(
    { INT: "INTEGER" },
    { get: (target, prop) => (prop in target ? target[prop] : "TEXT") },
  ),
  [DB.GENERIC]: new Proxy(
    {
      INTEGER: "INT",
      TINYINT: "SMALLINT",
      MEDIUMINT: "INTEGER",
      BIT: "BOOLEAN",
      DATETIME2: "DATETIME",
      MONEY: "NUMERIC",
      SMALLMONEY: "NUMERIC",
      NCHAR: "CHAR",
      NVARCHAR: "VARCHAR",
      NTEXT: "TEXT",
      IMAGE: "BLOB",
      XML: "BLOB",
      DATETIMEOFFSET: "TEXT",
      SQL_VARIANT: "TEXT",
      UNIQUEIDENTIFIER: "UUID",
      SMALLDATETIME: "DATETIME",
      CURSOR: "BLOB",
    },
    { get: (target, prop) => (prop in target ? target[prop] : "TEXT") },
  ),
};

export function fromMSSQL(ast, diagramDb = DB.GENERIC) {
  const tables = [];
  const relationships = [];

  const parseSingleStatement = (e) => {
    if (e.type === "create") {
      if (e.keyword === "table") {
        const table = {};
        table.name = e.table[0].table;
        table.comment = "";
        table.color = "#175e7a";
        table.fields = [];
        table.indices = [];
        table.uniqueConstraints = [];
        table.id = nanoid();
        e.create_definitions.forEach((d) => {
          if (d.resource === "column") {
            const field = {};
            field.id = nanoid();
            field.name = d.column.column;

            let type = d.definition.dataType;
            if (!dbToTypes[diagramDb][type]) {
              type = affinity[diagramDb][type];
            }
            field.type = type;

            if (d.definition.expr && d.definition.expr.type === "expr_list") {
              field.values = d.definition.expr.value.map((v) => v.value);
            }
            field.comment = d.comment ? d.comment.value.value : "";
            field.unique = false;
            if (d.unique) field.unique = true;
            field.increment = false;
            if (d.auto_increment) field.increment = true;
            field.notNull = false;
            if (d.nullable) field.notNull = true;
            field.primary = false;
            if (d.primary_key) field.primary = true;
            field.default = "";
            if (d.default_val) {
              let defaultValue = "";
              if (d.default_val.value.type === "function") {
                defaultValue = d.default_val.value.name.name[0].value;
                if (d.default_val.value.args) {
                  defaultValue +=
                    "(" +
                    d.default_val.value.args.value
                      .map((v) => {
                        if (
                          v.type === "single_quote_string" ||
                          v.type === "double_quote_string"
                        )
                          return "'" + v.value + "'";
                        return v.value;
                      })
                      .join(", ") +
                    ")";
                }
              } else if (d.default_val.value.type === "null") {
                defaultValue = "NULL";
              } else {
                defaultValue = d.default_val.value.value.toString();
              }
              field.default = defaultValue;
            }
            if (d.definition["length"]) {
              if (d.definition.scale) {
                field.size = d.definition["length"] + "," + d.definition.scale;
              } else {
                field.size = d.definition["length"];
              }
            }
            field.check = "";
            if (d.check) {
              field.check = buildSQLFromAST(d.check.definition[0], DB.MSSQL);
            }

            table.fields.push(field);
          } else if (d.resource === "constraint") {
            if (d.constraint_type === "primary key") {
              d.definition.forEach((c) => {
                table.fields.forEach((f) => {
                  if (f.name === c.column && !f.primary) {
                    f.primary = true;
                  }
                });
              });
            } else if (d.constraint_type.toLowerCase() === "foreign key") {
              const relationship = {};
              const startTableId = table.id;
              const startTableName = e.table[0].table;
              const startFieldNames = d.definition.map((c) => c.column);
              const endTableName = d.reference_definition.table[0].table;
              const endFieldNames = d.reference_definition.definition.map(
                (c) => c.column,
              );
              const startFieldName = startFieldNames[0];

              const endTable = tables.find((t) => t.name === endTableName);
              if (!endTable) return;

              const fieldPairs = [];
              for (let i = 0; i < startFieldNames.length; i++) {
                const sf = table.fields.find(
                  (f) => f.name === startFieldNames[i],
                );
                const ef = endTable.fields.find(
                  (f) => f.name === endFieldNames[i],
                );
                if (!sf || !ef) break;
                fieldPairs.push({ startFieldId: sf.id, endFieldId: ef.id });
              }
              if (fieldPairs.length !== startFieldNames.length) return;

              const startField = table.fields.find(
                (f) => f.name === startFieldName,
              );

              relationship.name = `fk_${startTableName}_${startFieldName}_${endTableName}`;
              relationship.startTableId = startTableId;
              relationship.endTableId = endTable.id;
              relationship.fields = fieldPairs;
              relationship.endFieldId = fieldPairs[0].endFieldId;
              relationship.startFieldId = fieldPairs[0].startFieldId;
              relationship.id = nanoid();

              let updateConstraint = "No action";
              let deleteConstraint = "No action";
              d.reference_definition.on_action.forEach((c) => {
                if (c.type === "on update") {
                  updateConstraint = c.value.value;
                  updateConstraint =
                    updateConstraint[0].toUpperCase() +
                    updateConstraint.substring(1);
                } else if (c.type === "on delete") {
                  deleteConstraint = c.value.value;
                  deleteConstraint =
                    deleteConstraint[0].toUpperCase() +
                    deleteConstraint.substring(1);
                }
              });

              relationship.updateConstraint = updateConstraint;
              relationship.deleteConstraint = deleteConstraint;

              if (startField.unique) {
                relationship.cardinality = Cardinality.ONE_TO_ONE;
              } else {
                relationship.cardinality = Cardinality.MANY_TO_ONE;
              }

              relationships.push(relationship);
            } else if (
              d.constraint_type &&
              d.constraint_type.toLowerCase().includes("unique")
            ) {
              const fields = d.definition.map((c) => c.column);
              const name =
                d.constraint ||
                d.index ||
                `${table.name}_unique_${table.uniqueConstraints.length}`;
              table.uniqueConstraints.push({ name, fields });
              table.uniqueConstraints.forEach((u, j) => {
                u.id = j;
              });
            }
          }
        });
        tables.push(table);
      } else if (e.keyword === "index") {
        const index = {
          name: e.index,
          unique: e.index_type === "unique",
          fields: e.index_columns.map((f) => f.column),
        };

        const table = tables.find((t) => t.name === e.table.table);

        if (table) {
          table.indices.push(index);
          table.indices.forEach((i, j) => {
            i.id = j;
          });
        }
      }
    } else if (e.type === "alter") {
      e.expr.forEach((expr) => {
        if (
          expr.action === "add" &&
          expr.create_definitions.constraint_type.toLowerCase() ===
            "foreign key"
        ) {
          const relationship = {};
          const startTableName = e.table[0].table;
          const startFieldNames = expr.create_definitions.definition.map(
            (c) => c.column,
          );
          const endTableName =
            expr.create_definitions.reference_definition.table[0].table;
          const endFieldNames =
            expr.create_definitions.reference_definition.definition.map(
              (c) => c.column,
            );
          const startFieldName = startFieldNames[0];
          let updateConstraint = "No action";
          let deleteConstraint = "No action";
          expr.create_definitions.reference_definition.on_action.forEach(
            (c) => {
              if (c.type === "on update") {
                updateConstraint = c.value.value;
                updateConstraint =
                  updateConstraint[0].toUpperCase() +
                  updateConstraint.substring(1);
              } else if (c.type === "on delete") {
                deleteConstraint = c.value.value;
                deleteConstraint =
                  deleteConstraint[0].toUpperCase() +
                  deleteConstraint.substring(1);
              }
            },
          );

          const startTable = tables.find((t) => t.name === startTableName);
          if (!startTable) return;

          const endTable = tables.find((t) => t.name === endTableName);
          if (!endTable) return;

          const fieldPairs = [];
          for (let i = 0; i < startFieldNames.length; i++) {
            const sf = startTable.fields.find(
              (f) => f.name === startFieldNames[i],
            );
            const ef = endTable.fields.find(
              (f) => f.name === endFieldNames[i],
            );
            if (!sf || !ef) break;
            fieldPairs.push({ startFieldId: sf.id, endFieldId: ef.id });
          }
          if (fieldPairs.length !== startFieldNames.length) return;

          const startField = startTable.fields.find(
            (f) => f.name === startFieldName,
          );

          relationship.name = `fk_${startTableName}_${startFieldName}_${endTableName}`;
          relationship.startTableId = startTable.id;
          relationship.startFieldId = fieldPairs[0].startFieldId;
          relationship.endTableId = endTable.id;
          relationship.endFieldId = fieldPairs[0].endFieldId;
          relationship.fields = fieldPairs;
          relationship.updateConstraint = updateConstraint;
          relationship.deleteConstraint = deleteConstraint;
          relationship.id = nanoid();

          if (startField.unique) {
            relationship.cardinality = Cardinality.ONE_TO_ONE;
          } else {
            relationship.cardinality = Cardinality.MANY_TO_ONE;
          }

          relationships.push(relationship);
        }
      });
    }
  };

  if (ast.go_next) {
    let x = { ...ast };
    let done = false;
    while (!done) {
      parseSingleStatement(x.ast);
      done = Array.isArray(x.go_next) && x.go_next.length === 0;
      x = { ...x.go_next };
    }
  } else if (Array.isArray(ast)) {
    ast.forEach((e) => {
      parseSingleStatement(e);
    });
  } else if (typeof ast === "object") {
    parseSingleStatement(ast);
  }

  return { tables, relationships };
}

const GO_BATCH_SEPARATOR = /^[ \t]*GO[ \t]*(--[^\n]*)?$/gim;
const GO_MARKER = "\0";
const ALTER_FK_STATEMENT = new RegExp(
  [
    "ALTER\\s+TABLE\\s+",
    "(?:[\\[\\w\\].]+\\.)?", // optional schema prefix
    "((?:\\[[^\\]]+\\])|[\\w$]+)", // table
    "\\s+ADD\\s+",
    "(?:CONSTRAINT\\s+((?:\\[[^\\]]+\\])|[\\w$]+)\\s+)?",
    "FOREIGN\\s+KEY\\s*\\(\\s*([^)]+?)\\s*\\)",
    "\\s+REFERENCES\\s+",
    "(?:[\\[\\w\\].]+\\.)?",
    "((?:\\[[^\\]]+\\])|[\\w$]+)",
    "\\s*\\(\\s*([^)]+?)\\s*\\)",
    "([^;]*?)",
    "(?:;(?:\\s*GO\\b)?|\\s*GO\\b|\\s*$)",
  ].join(""),
  "gi",
);

function unquoteIdentifier(identifier) {
  return identifier.startsWith("[")
    ? identifier.slice(1, -1).replace(/\]\]/g, "]")
    : identifier;
}

function quoteIdentifier(identifier) {
  return "`" + identifier.replace(/`/g, "``") + "`";
}

function parseColumns(columns) {
  return columns
    .split(",")
    .map((column) => column.trim())
    .filter(Boolean)
    .map(unquoteIdentifier);
}

function parseReferentialAction(actions) {
  const onUpdate =
    /on\s+update\s+(cascade|no\s+action|restrict|set\s+null|set\s+default)/i.exec(
      actions,
    );
  const onDelete =
    /on\s+delete\s+(cascade|no\s+action|restrict|set\s+null|set\s+default)/i.exec(
      actions,
    );

  let action = "";
  if (onUpdate) {
    action += ` ON UPDATE ${onUpdate[1].replace(/\s+/g, " ").toUpperCase()}`;
  }
  if (onDelete) {
    action += ` ON DELETE ${onDelete[1].replace(/\s+/g, " ").toUpperCase()}`;
  }
  return action;
}

function toMysqlAlterForeignKey([
  table,
  constraintName,
  startColumns,
  endTable,
  endColumns,
  actions,
]) {
  const startColumnList = parseColumns(startColumns)
    .map(quoteIdentifier)
    .join(", ");
  const endColumnList = parseColumns(endColumns)
    .map(quoteIdentifier)
    .join(", ");
  const constraint = constraintName
    ? `CONSTRAINT ${quoteIdentifier(unquoteIdentifier(constraintName))} `
    : "";

  return (
    `ALTER TABLE ${quoteIdentifier(unquoteIdentifier(table))} ` +
    `ADD ${constraint}FOREIGN KEY (${startColumnList}) ` +
    `REFERENCES ${quoteIdentifier(unquoteIdentifier(endTable))} (${endColumnList})` +
    parseReferentialAction(actions)
  );
}

/**
 * Parses a transactsql script into a list of statements.
 *
 * The transactsql grammar of node-sql-parser cannot parse `ALTER TABLE ... ADD
 * FOREIGN KEY` statements and fails when a semicolon-terminated statement is
 * followed by a GO batch separator, which breaks importing scripts that
 * drawdb itself exported (issue #320). GO batches are therefore parsed as
 * semicolon-separated statements and foreign keys are parsed with the mysql
 * grammar, which produces the alter statement shape fromMSSQL already
 * understands.
 */
export function parseMssqlSource(source) {
  const foreignKeys = [];
  const statementsSource = source
    .replace(ALTER_FK_STATEMENT, (match, ...groups) => {
      foreignKeys.push(toMysqlAlterForeignKey(groups));
      return "";
    })
    .replace(GO_BATCH_SEPARATOR, GO_MARKER)
    .replace(/;[ \t\r\n]*\0|\0[ \t\r\n]*;/g, GO_MARKER)
    .replace(/\0/g, ";");

  const parser = new Parser();
  const parsed = parser.astify(statementsSource, { database: DB.MSSQL });
  const statements = Array.isArray(parsed) ? parsed : [parsed];

  for (const foreignKey of foreignKeys) {
    statements.push(parser.astify(foreignKey, { database: DB.MYSQL }));
  }

  return statements;
}
