import { Parser } from "node-sql-parser";
import { Parser as OracleParser } from "oracle-sql-parser";
import { DB } from "../../data/constants";
import { importSQL } from "../importSQL";
import { fromDBML } from "./dbml";

/**
 * Supported file extensions for diagram import.
 */
export const SUPPORTED_FILE_EXTENSIONS = ["json", "ddb", "dbml", "sql"];

/**
 * Returns the file extension from a filename (lowercase, without dot).
 * @param {string} filename
 * @returns {string}
 */
function getFileExtension(filename) {
  return (filename.split(".").pop() || "").toLowerCase();
}

/**
 * Checks whether a file is supported for import based on its extension.
 * @param {File} file
 * @returns {boolean}
 */
export function isFileSupported(file) {
  const ext = getFileExtension(file.name);
  return SUPPORTED_FILE_EXTENSIONS.includes(ext);
}

/**
 * Parses a JSON/DDB diagram file and validates its structure.
 * Uses a lenient check that accepts any file with the minimum required
 * diagram structure (tables + relationships arrays), since drawdb's own
 * exports can sometimes fail the strict jsonschema validation.
 * @param {string} content - Raw file content
 * @param {string} extension - File extension ("json" or "ddb")
 * @param {string} database - Current diagram database type
 * @returns {{ data: object|null, error: string|null }}
 */
function parseJsonDiagram(content, extension, database) {
  let jsonObject;
  try {
    jsonObject = JSON.parse(content);
  } catch {
    return { data: null, error: "The file contains invalid JSON." };
  }

  // Check minimal diagram structure: must have tables and relationships arrays
  if (
    !jsonObject.tables ||
    !Array.isArray(jsonObject.tables) ||
    !jsonObject.relationships ||
    !Array.isArray(jsonObject.relationships)
  ) {
    return {
      data: null,
      error: "The file is missing necessary properties for a diagram.",
    };
  }

  if (!jsonObject.database) {
    jsonObject.database = DB.GENERIC;
  }

  if (jsonObject.database !== database) {
    return {
      data: null,
      error:
        "The imported diagram and the open diagram don't use matching databases.",
    };
  }

  // Validate relationship references
  for (const rel of jsonObject.relationships) {
    const startTable = jsonObject.tables.find(
      (t) => t.id === rel.startTableId,
    );
    const endTable = jsonObject.tables.find((t) => t.id === rel.endTableId);

    if (!startTable || !endTable) {
      return {
        data: null,
        error: `Relationship ${rel.name} references a table that does not exist.`,
      };
    }

    if (
      !startTable.fields.find((f) => f.id === rel.startFieldId) ||
      !endTable.fields.find((f) => f.id === rel.endFieldId)
    ) {
      return {
        data: null,
        error: `Relationship ${rel.name} references a field that does not exist.`,
      };
    }
  }

  return { data: jsonObject, error: null };
}

/**
 * Parses a DBML file into diagram data.
 * @param {string} content - Raw DBML content
 * @returns {{ data: object|null, error: string|null }}
 */
function parseDbmlDiagram(content) {
  try {
    const data = fromDBML(content);
    return { data, error: null };
  } catch (err) {
    const message =
      err.diags && err.diags[0]
        ? `${err.diags[0].name} [Ln ${err.diags[0].location.start.line}, Col ${err.diags[0].location.start.column}]: ${err.diags[0].message}`
        : err.message || "Failed to parse DBML file.";
    return { data: null, error: message };
  }
}

/**
 * Parses a SQL file into diagram data.
 * @param {string} content - Raw SQL content
 * @param {string} database - Current diagram database type
 * @returns {{ data: object|null, error: string|null }}
 */
function parseSqlDiagram(content, database) {
  const targetDatabase = database === DB.GENERIC ? DB.MYSQL : database;

  let ast;
  try {
    if (targetDatabase === DB.ORACLESQL) {
      const oracleParser = new OracleParser();
      ast = oracleParser.parse(content);
    } else {
      const parser = new Parser();
      ast = parser.astify(content, { database: targetDatabase });
    }
  } catch (err) {
    const message = err.location
      ? `${err.name} [Ln ${err.location.start.line}, Col ${err.location.start.column}]: ${err.message}`
      : err.message || "Failed to parse SQL file.";
    return { data: null, error: message };
  }

  try {
    const diagramData = importSQL(ast, targetDatabase, database);
    return { data: diagramData, error: null };
  } catch {
    return {
      data: null,
      error: "Failed to convert SQL to diagram. Please check for syntax errors.",
    };
  }
}

/**
 * Reads a file and parses it into diagram data based on its extension.
 * @param {File} file - The file to import
 * @param {string} database - Current diagram database type
 * @returns {Promise<{ data: object|null, error: string|null }>}
 */
export function importFromFile(file, database) {
  return new Promise((resolve) => {
    const extension = getFileExtension(file.name);

    if (!SUPPORTED_FILE_EXTENSIONS.includes(extension)) {
      resolve({
        data: null,
        error: `Unsupported file type ".${extension}". Supported types: ${SUPPORTED_FILE_EXTENSIONS.join(", ")}`,
      });
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;

      switch (extension) {
        case "json":
        case "ddb":
          resolve(parseJsonDiagram(content, extension, database));
          break;
        case "dbml":
          resolve(parseDbmlDiagram(content));
          break;
        case "sql":
          resolve(parseSqlDiagram(content, database));
          break;
        default:
          resolve({ data: null, error: "Unsupported file type." });
      }
    };

    reader.onerror = () => {
      resolve({ data: null, error: "Failed to read the file." });
    };

    reader.readAsText(file);
  });
}
