import { Cardinality, Constraint, DB } from "../../data/constants";
import { dbToTypes } from "../../data/datatypes";
import { databases } from "../../data/databases";
import i18n from "../../i18n/i18n";
import {
  getRelationshipFields,
  isFunction,
  isKeyword,
  strHasQuotes,
} from "../utils";

const INDENT = "    ";
const MAX_LINE_LENGTH = 88;

const PYTHON_KEYWORDS = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

// Names that the generated module imports, so models must not shadow them.
const RESERVED_MODEL_NAMES = new Set(["ArrayField", "Decimal", "Now"]);

// Names that field definitions refer to. A field with one of these names would
// shadow it for the rest of the class body. Django also reserves `pk`.
const RESERVED_FIELD_NAMES = new Set(["dict", "list", "models", "pk", "uuid"]);

// Keyed by lowercased constraint, since SQL imports keep the parser's casing.
const ON_DELETE = {
  [Constraint.NONE.toLowerCase()]: "DO_NOTHING",
  [Constraint.RESTRICT.toLowerCase()]: "RESTRICT",
  [Constraint.CASCADE.toLowerCase()]: "CASCADE",
  [Constraint.SET_NULL.toLowerCase()]: "SET_NULL",
  [Constraint.SET_DEFAULT.toLowerCase()]: "SET_DEFAULT",
};

const DEFAULT_DECIMAL_PRECISION = {
  [DB.MSSQL]: 18,
  [DB.ORACLESQL]: 38,
};

const TIMESTAMP_FUNCTIONS = new Set([
  "CURRENT_TIMESTAMP",
  "CURRENT_TIMESTAMP()",
  "LOCALTIMESTAMP",
  "LOCALTIMESTAMP()",
  "NOW()",
  "GETDATE()",
  "SYSDATETIME()",
  "SYSDATE",
  "SYSTIMESTAMP",
]);

const UUID_FUNCTIONS = new Set([
  "GEN_RANDOM_UUID()",
  "UUID_GENERATE_V4()",
  "UUID()",
  "NEWID()",
  "SYS_GUID()",
]);

// Prefers double quotes, like Black, unless that needs more escaping.
function pyStr(value) {
  const str = String(value);
  const literal = JSON.stringify(str);
  if (!str.includes('"') || str.includes("'")) return literal;

  return `'${literal.slice(1, -1).replaceAll('\\"', '"')}'`;
}

function pyList(items) {
  return `[${items.join(", ")}]`;
}

function capitalize(word) {
  const rest = word.slice(1);
  return (
    word.charAt(0).toUpperCase() +
    (word === word.toUpperCase() ? rest.toLowerCase() : rest)
  );
}

function toModelName(tableName) {
  let name = String(tableName)
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(capitalize)
    .join("");

  if (!name) name = "Table";
  if (/^\d/.test(name)) name = `Table${name}`;
  if (PYTHON_KEYWORDS.has(name) || RESERVED_MODEL_NAMES.has(name)) {
    name = `${name}Model`;
  }

  return name;
}

function toFieldName(columnName) {
  let name = String(columnName)
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (!name) name = "field";
  if (/^\d/.test(name)) name = `number_${name}`;

  return name;
}

// Django rejects Python keywords, trailing underscores and `__` in field
// names. `toFieldName` already strips the last two.
function ensureValidFieldName(name) {
  return PYTHON_KEYWORDS.has(name) || RESERVED_FIELD_NAMES.has(name)
    ? `${name}_field`
    : name;
}

function uniqueName(name, used) {
  let candidate = name;
  for (let i = 2; used.has(candidate); i++) {
    candidate = `${name}${i}`;
  }
  used.add(candidate);
  return candidate;
}

function parseSize(size) {
  const match = /^\s*(\d+)\s*(?:,\s*(\d+)\s*)?$/.exec(String(size ?? ""));
  if (!match) return null;

  return {
    length: Number(match[1]),
    scale: match[2] === undefined ? null : Number(match[2]),
  };
}

function isOneToOne(relationship) {
  return (
    relationship.cardinality === Cardinality.ONE_TO_ONE ||
    relationship.cardinality === i18n.t(Cardinality.ONE_TO_ONE)
  );
}

function enumValuesFor(field, enums) {
  if (Array.isArray(field.values) && field.values.length > 0) {
    return field.values;
  }

  const type = String(field.type).toUpperCase();
  const match = enums.find((e) => String(e.name).toUpperCase() === type);
  return match?.values ?? null;
}

function choicesField(values) {
  const maxLength = Math.max(1, ...values.map((v) => String(v).length));
  const choices = values.map((v) => `(${pyStr(v)}, ${pyStr(v)})`);

  return {
    fieldClass: "CharField",
    args: [`max_length=${maxLength}`, { keyword: "choices", items: choices }],
    kind: "string",
  };
}

function decimalField(maxDigits, decimalPlaces) {
  return {
    fieldClass: "DecimalField",
    args: [`max_digits=${maxDigits}`, `decimal_places=${decimalPlaces}`],
    kind: "decimal",
  };
}

function sizedDecimalField(field, database) {
  const size = parseSize(field.size);
  return decimalField(
    size?.length ?? DEFAULT_DECIMAL_PRECISION[database] ?? 10,
    size?.scale ?? 0,
  );
}

function integerField(signedClass, unsignedClass, field, database) {
  const unsigned = dbToTypes[database][field.type]?.signed && field.unsigned;
  return { fieldClass: unsigned ? unsignedClass : signedClass, kind: "int" };
}

function charField(field, fixedLength) {
  const size = parseSize(field.size);
  const maxLength = size?.length ?? (fixedLength ? 1 : null);

  if (maxLength === null) {
    return { fieldClass: "TextField", kind: "string" };
  }

  return {
    fieldClass: "CharField",
    args: [`max_length=${maxLength}`],
    kind: "string",
  };
}

/**
 * Maps a drawDB field to the Django field class that stores it, along with the
 * arguments that class needs. `kind` drives how the default value is written.
 */
function mapFieldType(field, database, enums) {
  const type = String(field.type).toUpperCase();

  switch (type) {
    case "TINYINT":
    case "SMALLINT":
      return integerField(
        "SmallIntegerField",
        "PositiveSmallIntegerField",
        field,
        database,
      );
    case "INT":
    case "INTEGER":
    case "MEDIUMINT":
      return integerField(
        "IntegerField",
        "PositiveIntegerField",
        field,
        database,
      );
    case "BIGINT":
      return integerField(
        "BigIntegerField",
        "PositiveBigIntegerField",
        field,
        database,
      );
    case "SMALLSERIAL":
      return { fieldClass: "SmallIntegerField", kind: "int" };
    case "SERIAL":
      return { fieldClass: "IntegerField", kind: "int" };
    case "BIGSERIAL":
      return { fieldClass: "BigIntegerField", kind: "int" };
    case "YEAR":
      return { fieldClass: "PositiveSmallIntegerField", kind: "int" };
    case "FLOAT":
    case "REAL":
    case "DOUBLE":
    case "DOUBLE PRECISION":
      return { fieldClass: "FloatField", kind: "float" };
    case "DECIMAL":
    case "NUMERIC":
    case "NUMBER":
      return sizedDecimalField(field, database);
    case "MONEY":
      return decimalField(19, database === DB.POSTGRES ? 2 : 4);
    case "SMALLMONEY":
      return decimalField(10, 4);
    case "BOOLEAN":
    case "BOOL":
      return { fieldClass: "BooleanField", kind: "bool" };
    case "BIT": {
      const size = parseSize(field.size);
      if (!size || size.length === 1) {
        return { fieldClass: "BooleanField", kind: "bool" };
      }
      return { fieldClass: "BinaryField", kind: "other" };
    }
    case "CHAR":
    case "NCHAR":
      return charField(field, true);
    case "VARCHAR":
    case "NVARCHAR":
    case "VARCHAR2":
    case "NVARCHAR2":
      return charField(field, false);
    case "TEXT":
    case "TINYTEXT":
    case "MEDIUMTEXT":
    case "LONGTEXT":
    case "NTEXT":
    case "CLOB":
    case "NCLOB":
    case "LONG":
    case "XML":
      return { fieldClass: "TextField", kind: "string" };
    case "DATE":
      return { fieldClass: "DateField", kind: "string" };
    case "TIME":
    case "TIMETZ":
      return { fieldClass: "TimeField", kind: "string" };
    case "DATETIME":
    case "DATETIME2":
    case "SMALLDATETIME":
    case "DATETIMEOFFSET":
    case "TIMESTAMP":
    case "TIMESTAMPTZ":
      return { fieldClass: "DateTimeField", kind: "datetime" };
    case "INTERVAL":
      return { fieldClass: "DurationField", kind: "other" };
    case "BINARY":
    case "VARBINARY":
    case "BLOB":
    case "TINYBLOB":
    case "MEDIUMBLOB":
    case "LONGBLOB":
    case "BYTEA":
    case "IMAGE":
    case "RAW":
      return { fieldClass: "BinaryField", kind: "other" };
    case "JSON":
    case "JSONB":
      return { fieldClass: "JSONField", kind: "json" };
    case "UUID":
    case "UNIQUEIDENTIFIER":
      return { fieldClass: "UUIDField", kind: "uuid" };
    case "INET":
      return { fieldClass: "GenericIPAddressField", kind: "string" };
    case "INET4":
      return {
        fieldClass: "GenericIPAddressField",
        args: [`protocol="IPv4"`],
        kind: "string",
      };
    case "INET6":
      return {
        fieldClass: "GenericIPAddressField",
        args: [`protocol="IPv6"`],
        kind: "string",
      };
    case "SET": {
      const values = enumValuesFor(field, enums) ?? [];
      const maxLength = values.reduce(
        (total, v, i) => total + String(v).length + (i > 0 ? 1 : 0),
        0,
      );
      return {
        fieldClass: "CharField",
        args: [`max_length=${Math.max(1, maxLength)}`],
        kind: "string",
      };
    }
    default: {
      const values = enumValuesFor(field, enums);
      if (values) return choicesField(values);

      return { fieldClass: "TextField", kind: "other", unsupported: true };
    }
  }
}

function autoFieldClass(field, mapped) {
  if (!field.increment && !/SERIAL$/i.test(field.type)) return null;

  switch (mapped.fieldClass) {
    case "SmallIntegerField":
    case "PositiveSmallIntegerField":
      return "SmallAutoField";
    case "IntegerField":
    case "PositiveIntegerField":
      return "AutoField";
    case "BigIntegerField":
    case "PositiveBigIntegerField":
      return "BigAutoField";
    default:
      return null;
  }
}

function unquote(value) {
  if (!strHasQuotes(value)) return value;

  const quote = value[0];
  return value.slice(1, -1).replaceAll(quote + quote, quote);
}

/**
 * Translates a drawDB default into a Django `default`/`db_default` argument.
 * Returns `{ arg }` when it can be expressed, `{ unsupported }` when it can't,
 * and `null` when there is no default to carry over.
 */
function mapDefault(field, mapped, imports) {
  if (field.default === undefined || field.default === null) return null;

  if (typeof field.default === "boolean") {
    return mapped.kind === "bool"
      ? { arg: `default=${field.default ? "True" : "False"}` }
      : { unsupported: String(field.default) };
  }

  const raw = String(field.default).trim();
  if (raw === "" || raw.toUpperCase() === "NULL") return null;

  const quoted = strHasQuotes(raw);
  const value = unquote(raw);
  const upper = raw.toUpperCase();

  switch (mapped.kind) {
    case "bool":
      if (/^(TRUE|1|B'1')$/.test(upper)) return { arg: "default=True" };
      if (/^(FALSE|0|B'0')$/.test(upper)) return { arg: "default=False" };
      break;
    case "int":
      if (/^[-+]?\d+$/.test(value)) {
        // Python rejects leading zeros in integers; avoid Number() precision loss.
        return { arg: `default=${value.replace(/^([-+]?)0+(?=\d)/, "$1")}` };
      }
      break;
    case "float":
      if (/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(value)) {
        return { arg: `default=${Number(value)}` };
      }
      break;
    case "decimal":
      if (/^[-+]?(\d+\.?\d*|\.\d+)$/.test(value)) {
        imports.decimal = true;
        return { arg: `default=Decimal(${pyStr(value)})` };
      }
      break;
    case "datetime":
      if (TIMESTAMP_FUNCTIONS.has(upper)) {
        imports.now = true;
        return { arg: "db_default=Now()" };
      }
      if (quoted || (!isFunction(raw) && !isKeyword(raw))) {
        return { arg: `default=${pyStr(value)}` };
      }
      break;
    case "uuid":
      if (UUID_FUNCTIONS.has(upper)) {
        imports.uuid = true;
        return { arg: "default=uuid.uuid4" };
      }
      if (quoted || /^[0-9a-f-]{32,36}$/i.test(value)) {
        return { arg: `default=${pyStr(value)}` };
      }
      break;
    case "json":
      if (value.trim() === "{}") return { arg: "default=dict" };
      if (value.trim() === "[]") return { arg: "default=list" };
      break;
    case "string":
      if (quoted || (!isFunction(raw) && !isKeyword(raw))) {
        return { arg: `default=${pyStr(value)}` };
      }
      break;
    default:
      break;
  }

  return { unsupported: raw };
}

function findForeignKeys(tables, relationships) {
  const foreignKeys = new Map();
  const compositeKeys = new Map();

  for (const relationship of relationships) {
    const startTable = tables.find((t) => t.id === relationship.startTableId);
    const endTable = tables.find((t) => t.id === relationship.endTableId);
    if (!startTable || !endTable) continue;

    const pairs = getRelationshipFields(relationship).map((pair) => ({
      startField: startTable.fields.find((f) => f.id === pair.startFieldId),
      endField: endTable.fields.find((f) => f.id === pair.endFieldId),
    }));
    if (pairs.some((pair) => !pair.startField || !pair.endField)) continue;

    if (pairs.length > 1) {
      // Django has no composite foreign keys, so the columns stay plain fields.
      const notes = compositeKeys.get(startTable.id) ?? [];
      notes.push(
        `(${pairs.map((p) => p.startField.name).join(", ")}) -> ` +
          `${endTable.name} (${pairs.map((p) => p.endField.name).join(", ")})`,
      );
      compositeKeys.set(startTable.id, notes);
      continue;
    }

    const byField = foreignKeys.get(startTable.id) ?? new Map();
    if (!byField.has(pairs[0].startField.id)) {
      byField.set(pairs[0].startField.id, {
        relationship,
        endTable,
        endField: pairs[0].endField,
      });
    }
    foreignKeys.set(startTable.id, byField);
  }

  return { foreignKeys, compositeKeys };
}

function nameFields(table, foreignKeys) {
  const used = new Set();
  const names = new Map();
  const primaryKeys = table.fields.filter((f) => f.primary);

  for (const field of table.fields) {
    const isForeignKey = foreignKeys?.has(field.id);
    let base = toFieldName(field.name);
    if (isForeignKey && base.length > 3 && base.endsWith("_id")) {
      base = base.slice(0, -3);
    }
    base = ensureValidFieldName(base);
    // Django only allows a field named `id` if it is the primary key.
    if (base === "id" && !(primaryKeys.length === 1 && field.primary)) {
      base = "id_field";
    }

    // A foreign key also occupies `<name>_id`, Django's attribute for the
    // raw column value, so neither may clash with another field.
    let name = base;
    for (
      let i = 2;
      used.has(name) || (isForeignKey && used.has(`${name}_id`));
      i++
    ) {
      name = `${base}_${i}`;
    }
    used.add(name);
    if (isForeignKey) used.add(`${name}_id`);

    names.set(field.id, name);
  }

  return names;
}

function pyComment(text) {
  return `# ${String(text).replace(/\s+/g, " ").trim()}`;
}

// Call arguments are strings, or `{ keyword, items }` for a list argument
// that can be split over several lines on its own.
function inlineArg(arg) {
  return typeof arg === "string" ? arg : `${arg.keyword}=${pyList(arg.items)}`;
}

function splitArg(arg, indent) {
  const line = `${indent}${inlineArg(arg)},`;
  if (typeof arg === "string" || line.length <= MAX_LINE_LENGTH) return line;

  return [
    `${indent}${arg.keyword}=[`,
    ...arg.items.map((item) => `${indent}${INDENT}${item},`),
    `${indent}],`,
  ].join("\n");
}

// Lays out a call the way Black would: on one line when it fits, otherwise
// with one argument per line and a trailing comma.
function wrapCall(prefix, callee, args, { comment = "", trailing = "" } = {}) {
  const suffix = comment ? `  ${pyComment(comment)}` : "";
  const inline = `${prefix}${callee}(${args.map(inlineArg).join(", ")})${trailing}`;
  if (inline.length + suffix.length <= MAX_LINE_LENGTH || args.length === 0) {
    return inline + suffix;
  }

  const indent = prefix.match(/^\s*/)[0];
  return [
    `${prefix}${callee}(${suffix}`,
    ...args.map((arg) => splitArg(arg, indent + INDENT)),
    `${indent})${trailing}`,
  ].join("\n");
}

function renderField(field, context) {
  const { model, models, database, enums, imports, foreignKey, primaryKeys } =
    context;
  const name = model.fieldNames.get(field.id);
  const isPrimaryKey = primaryKeys.length === 1 && field.primary;
  const comments = [];
  let args = [];
  let callee;

  const mapped = mapFieldType(field, database, enums);
  const isArray = field.isArray && databases[database].hasArrays;
  let defaultValue = mapDefault(field, isArray ? {} : mapped, imports);

  let nullable = !field.notNull && !field.primary;

  if (foreignKey) {
    const { relationship, endTable, endField } = foreignKey;
    const target = models.get(endTable.id);
    const oneToOne = isPrimaryKey || field.unique || isOneToOne(relationship);
    let onDelete =
      ON_DELETE[String(relationship.deleteConstraint).toLowerCase()] ??
      "DO_NOTHING";

    // Without a default, SET DEFAULT leaves the column NULL in the database.
    if (onDelete === "SET_DEFAULT" && !defaultValue?.arg) {
      onDelete = "SET_NULL";
    }
    // Django requires SET_NULL foreign keys to be nullable.
    if (onDelete === "SET_NULL") nullable = true;

    callee = `models.${oneToOne ? "OneToOneField" : "ForeignKey"}`;
    args.push(
      endTable.id === model.table.id ? `"self"` : pyStr(target.name),
      `models.${onDelete}`,
    );

    const endPrimaryKeys = endTable.fields.filter((f) => f.primary);
    if (endPrimaryKeys.length !== 1 || endPrimaryKeys[0].id !== endField.id) {
      args.push(`to_field=${pyStr(target.fieldNames.get(endField.id))}`);
    }
    if (context.repeatedTargets.has(endTable.id)) {
      args.push(
        `related_name=${pyStr(`${model.name.toLowerCase()}_${name}_set`)}`,
      );
    }
    if (isPrimaryKey) args.push("primary_key=True");
    if (`${name}_id` !== field.name) {
      args.push(`db_column=${pyStr(field.name)}`);
    }
  } else {
    const autoField = isPrimaryKey ? autoFieldClass(field, mapped) : null;
    if (mapped.unsupported) comments.push(`Original type: ${field.type}`);

    callee = `models.${autoField ?? mapped.fieldClass}`;
    if (!autoField) args.push(...(mapped.args ?? []));

    if (isArray) {
      imports.arrayField = true;
      args = [`${callee}(${args.map(inlineArg).join(", ")})`];
      callee = "ArrayField";
      if (/^('\{\}'|\{\}|ARRAY\[\])$/i.test(defaultValue?.unsupported)) {
        defaultValue = { arg: "default=list" };
      }
    }

    if (isPrimaryKey) args.push("primary_key=True");
    if (field.unique && !field.primary) args.push("unique=True");
    if (name !== field.name) args.push(`db_column=${pyStr(field.name)}`);
  }

  if (nullable) args.push("blank=True", "null=True");

  if (defaultValue?.arg) {
    args.push(defaultValue.arg);
  } else if (defaultValue) {
    comments.push(`Default: ${defaultValue.unsupported}`);
  }

  if (field.comment?.trim()) {
    args.push(`db_comment=${pyStr(field.comment.trim())}`);
  }

  return wrapCall(`${INDENT}${name} = `, callee, args, {
    comment: comments.join("; "),
  });
}

function renderMeta(table, model) {
  const columns = new Map(
    table.fields.map((f) => [f.name, model.fieldNames.get(f.id)]),
  );
  const fieldList = (fields) => {
    if (!Array.isArray(fields) || fields.length === 0) return null;
    const names = fields.map((f) => columns.get(f));
    if (names.some((n) => !n)) return null;
    return pyList(names.map(pyStr));
  };

  const constraints = [
    ...(table.indices ?? []).filter((index) => index.unique),
    ...(table.uniqueConstraints ?? []),
  ]
    .map((constraint) => {
      const fields = fieldList(constraint.fields);
      if (!fields) return null;
      return [
        "models.UniqueConstraint",
        [`fields=${fields}`, `name=${pyStr(constraint.name)}`],
      ];
    })
    .filter(Boolean);

  const indexes = (table.indices ?? [])
    .filter((index) => !index.unique)
    .map((index) => {
      const fields = fieldList(index.fields);
      if (!fields) return null;
      // Django limits index names to 30 characters that start with a letter;
      // otherwise let it generate one.
      const name = /^[a-zA-Z]\w{0,29}$/.test(index.name ?? "")
        ? [`name=${pyStr(index.name)}`]
        : [];
      return ["models.Index", [`fields=${fields}`, ...name]];
    })
    .filter(Boolean);

  const metaIndent = INDENT.repeat(2);
  const listOption = (option, entries) =>
    entries.length
      ? [
          `${metaIndent}${option} = [`,
          ...entries.map(([callee, args]) =>
            wrapCall(`${metaIndent}${INDENT}`, callee, args, {
              trailing: ",",
            }),
          ),
          `${metaIndent}]`,
        ]
      : [];

  return [
    `${INDENT}class Meta:`,
    `${metaIndent}db_table = ${pyStr(table.name)}`,
    ...(table.comment?.trim()
      ? [`${metaIndent}db_table_comment = ${pyStr(table.comment.trim())}`]
      : []),
    ...listOption("constraints", constraints),
    ...listOption("indexes", indexes),
  ].join("\n");
}

function renderModel(table, context) {
  const model = context.models.get(table.id);
  const foreignKeys = context.foreignKeys.get(table.id);
  const primaryKeys = table.fields.filter((f) => f.primary);

  const targets = [...(foreignKeys?.values() ?? [])].map(
    (fk) => fk.endTable.id,
  );
  const repeatedTargets = new Set(
    targets.filter((id, i) => targets.indexOf(id) !== i),
  );

  const lines = (context.compositeKeys.get(table.id) ?? []).map(
    (note) =>
      `${INDENT}${pyComment(`Composite foreign key ${note} is not supported by Django.`)}`,
  );

  if (primaryKeys.length > 1) {
    const keys = primaryKeys.map((f) => {
      const name = model.fieldNames.get(f.id);
      return pyStr(foreignKeys?.has(f.id) ? `${name}_id` : name);
    });
    lines.push(wrapCall(`${INDENT}pk = `, "models.CompositePrimaryKey", keys));
  }

  for (const field of table.fields) {
    lines.push(
      renderField(field, {
        ...context,
        model,
        primaryKeys,
        repeatedTargets,
        foreignKey: foreignKeys?.get(field.id),
      }),
    );
  }

  return [
    `class ${model.name}(models.Model):`,
    ...lines,
    ...(lines.length ? [""] : []),
    renderMeta(table, model),
  ].join("\n");
}

function renderImports(imports) {
  // Ordered like isort: plain imports before `from` imports in each section.
  const standard = [
    imports.uuid && "import uuid",
    imports.decimal && "from decimal import Decimal",
  ].filter(Boolean);
  const django = [
    imports.arrayField &&
      "from django.contrib.postgres.fields import ArrayField",
    "from django.db import models",
    imports.now && "from django.db.models.functions import Now",
  ].filter(Boolean);

  return [standard.join("\n"), django.join("\n")].filter(Boolean).join("\n\n");
}

export function jsonToDjangoModels(diagram) {
  const database = diagram.database ?? DB.GENERIC;
  const tables = diagram.tables ?? [];
  const { foreignKeys, compositeKeys } = findForeignKeys(
    tables,
    diagram.relationships ?? [],
  );

  const usedModelNames = new Set();
  const models = new Map(
    tables.map((table) => [
      table.id,
      {
        table,
        name: uniqueName(toModelName(table.name), usedModelNames),
        fieldNames: nameFields(table, foreignKeys.get(table.id)),
      },
    ]),
  );

  const imports = {};
  const context = {
    database,
    enums: diagram.enums ?? [],
    models,
    foreignKeys,
    compositeKeys,
    imports,
  };
  const classes = tables.map((table) => renderModel(table, context));

  return [renderImports(imports), ...classes].join("\n\n\n") + "\n";
}
