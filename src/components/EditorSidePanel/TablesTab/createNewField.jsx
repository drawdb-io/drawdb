import { Action, ObjectType } from "../../../data/constants";

export function createNewField({
  data,
  settings,
  database,
  dbToTypes,
  addFieldToTable,
  setUndoStack,
  setRedoStack,
  t,
  tid,
}) {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.TABLE,
        component: "field_add",
        tid: tid,
        message: t("edit_table", {
          tableName: data.name,
          extra: "[add field]",
        }),
      },
    ]);
    setRedoStack([]);

    const incr = data.increment && !!dbToTypes[database][settings.defaultFieldType].canIncrement;
    // Function to get the default size configured by the user
    const getUserDefaultSize = (typeName) => {
      const dbSettings = settings?.defaultTypeSizes?.[database] || {};
      const userSize = dbSettings[typeName];
      if (typeof userSize === 'number') {
        return userSize;
      }
      return dbToTypes[database][typeName]?.defaultSize || '';
    };
    // Function to get the combined size for types with precision and scale
    const getUserDefaultPrecisionScale = (typeName) => {
      const dbSettings = settings?.defaultTypeSizes?.[database] || {};
      const userSettings = dbSettings[typeName];
      if (typeof userSettings === 'object') {
        const precision = userSettings?.precision || 10;
        const scale = userSettings?.scale;
        // If it has a defined scale, combine as "precision,scale"
        if (scale !== undefined && scale !== null) {
          return `${precision},${scale}`;
        }
        // If it only has precision, return just the precision
        return precision.toString();
      }
      // Default value for types with precision
      return "10";
    };

    // Base field data
    const newFieldData = {
      name: "",
      type: settings.defaultFieldType,
      default: "",
      check: "",
      primary: false,
      unique: false,
      notNull: settings.defaultNotNull,
      increment: false,
      comment: "",
      foreignK: false,
    };

    // Field updates based on type
    let fieldUpdates = {
      increment: incr,
    };

    if (settings.defaultFieldType === "ENUM" || settings.defaultFieldType === "SET") {
      fieldUpdates = {
        ...fieldUpdates,
        values: data.values ? [...data.values] : [],
      };
    } else if (dbToTypes[database][settings.defaultFieldType].hasPrecision) {
      fieldUpdates = {
        ...fieldUpdates,
        size: getUserDefaultPrecisionScale(settings.defaultFieldType),
      };
    } else if (dbToTypes[database][settings.defaultFieldType].isSized) {
      fieldUpdates = {
        ...fieldUpdates,
        size: getUserDefaultSize(settings.defaultFieldType),
      };
    } else if (!dbToTypes[database][settings.defaultFieldType].hasDefault || incr) {
      fieldUpdates = {
        ...fieldUpdates,
        default: "",
        size: "",
        values: [],
      };
    } else if (dbToTypes[database][settings.defaultFieldType].hasCheck) {
      fieldUpdates = {
        ...fieldUpdates,
        check: "",
      };
    } else {
      fieldUpdates = {
        ...fieldUpdates,
        size: "",
        values: [],
      };
    }
    // Use the new atomic function
    addFieldToTable(tid, newFieldData, fieldUpdates);
}
