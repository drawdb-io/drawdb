import { parseDefault, escapeQuotes, resolveFKDirection } from "./shared";

import { dbToTypes } from "../../data/datatypes";
import { DB } from "../../data/constants";

function generateAddExtendedPropertySQL(value, level1name, level2name = null) {
  if (!value || value.trim() === "") {
    return "";
  }
  const escapedValue = escapeQuotes(value.replace(/\n/g, " "));
  const escapedTableName = escapeQuotes(level1name);

  if (level2name) {
    const escapedColumnName = escapeQuotes(level2name);
    return `
EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'${escapedValue}',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'${escapedTableName}',
    @level2type=N'COLUMN',@level2name=N'${escapedColumnName}';
GO
`;
  } else {
    return `
EXEC sys.sp_addextendedproperty
    @name=N'MS_Description', @value=N'${escapedValue}',
    @level0type=N'SCHEMA',@level0name=N'dbo',
    @level1type=N'TABLE',@level1name=N'${escapedTableName}';
GO
`;
  }
}

export function toMSSQL(diagram) {
  const tablesSql = diagram.tables
    .map((table) => {
      const fieldsSql = table.fields
        .map((field) => {
          const typeMetaData = dbToTypes[DB.MSSQL][field.type.toUpperCase()];
          const isSized = typeMetaData.isSized || typeMetaData.hasPrecision;

          return `\t[${field.name}] ${field.type}${field.size && isSized ? `(${field.size})` : ""}${
            field.notNull ? " NOT NULL" : ""
          }${field.increment ? " IDENTITY" : ""}${
            field.unique ? " UNIQUE" : ""
          }${
            field.default !== ""
              ? ` DEFAULT ${parseDefault(field, diagram.database)}`
              : ""
          }${
            field.check === "" ||
            !dbToTypes[diagram.database][field.type].hasCheck
              ? ""
              : ` CHECK(${field.check})`
          }`;
        })
        .join(",\n");

      const primaryKeys = table.fields.filter((f) => f.primary);
      const primaryKeySql =
        primaryKeys.length > 0
          ? `,\n\tPRIMARY KEY(${primaryKeys
              .map((f) => `[${f.name}]`)
              .join(", ")})`
          : "";

      const createTableSql = `CREATE TABLE [${table.name}] (\n${fieldsSql}${primaryKeySql}\n);\nGO\n`;

      const tableCommentSql = generateAddExtendedPropertySQL(
        table.comment,
        table.name,
      );

      const columnCommentsSql = table.fields
        .map((field) =>
          generateAddExtendedPropertySQL(field.comment, table.name, field.name),
        )
        .join("");

      const indicesSql = table.indices
        .map(
          (i) =>
            `\nCREATE ${i.unique ? "UNIQUE " : ""}INDEX [${
              i.name
            }]\nON [${table.name}] (${i.fields
              .map((f) => `[${f}]`)
              .join(", ")});\nGO\n`,
        )
        .join("");

      return `${createTableSql}${tableCommentSql}${columnCommentsSql}${indicesSql}`;
    })
    .join("\n");

  const referencesSql = diagram.references
    .map((r) => {
      const { fkTableId, fkFieldId, refTableId, refFieldId } = resolveFKDirection(r);
      const fkTable = diagram.tables.find((t) => t.id === fkTableId);
      const refTable = diagram.tables.find((t) => t.id === refTableId);

      if (!fkTable || !refTable) return "";

      const fkField = fkTable.fields.find((f) => f.id === fkFieldId);
      const refField = refTable.fields.find((f) => f.id === refFieldId);

      if (!fkField || !refField) return "";

      return `\nALTER TABLE [${fkTable.name}]
ADD FOREIGN KEY([${fkField.name}])
REFERENCES [${refTable.name}]([${refField.name}])
ON UPDATE ${r.updateConstraint.toUpperCase()} ON DELETE ${r.deleteConstraint.toUpperCase()};
GO`;
    })
    .join("");

  return `${tablesSql}\n${referencesSql}`;
}
