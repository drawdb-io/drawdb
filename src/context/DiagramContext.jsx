import { createContext, useState } from "react";
import { Action, DB, ObjectType, defaultBlue } from "../data/constants";
import { useTransform, useUndoRedo, useSelect, useSettings } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export const DiagramContext = createContext(null);

export default function DiagramContextProvider({ children }) {
  const { t } = useTranslation();
  const [database, setDatabase] = useState(DB.GENERIC);
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { settings } = useSettings();

  const addTable = (data, addToHistory = true) => {
    if (data) {
      setTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      setTables((prev) => [
        ...prev,
        {
          id: prev.length,
          name: settings.upperCaseFields ? `TABLE_${prev.length}` : `table_${prev.length}`,
          x: transform.pan.x,
          y: transform.pan.y,
          fields: [
            {
              name: settings.upperCaseFields ? "ID" : "id",
              type: database === DB.GENERIC ? "INT" : database === DB.ORACLE ? "NUMBER" : "INTEGER",
              default: "",
              check: "",
              primary: true,
              unique: true,
              notNull: true,
              increment: true,
              comment: "",
              id: 0,
            },
          ],
          comment: "",
          indices: [],
          color: defaultBlue,
          key: Date.now(),
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TABLE,
          message: t("add_table"),
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteTable = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("table_deleted"));
      const rels = relationships.reduce((acc, r) => {
        if (r.startTableId === id || r.endTableId === id) {
          acc.push(r);
        }
        return acc;
      }, []);
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TABLE,
          data: { table: tables[id], relationship: rels },
          message: t("delete_table", { tableName: tables[id].name }),
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prevR) => {
      return prevR
        .filter((e) => !(e.startTableId === id || e.endTableId === id))
        .map((e, i) => {
          const newR = { ...e };

          if (e.startTableId > id) {
            newR.startTableId = e.startTableId - 1;
          }
          if (e.endTableId > id) {
            newR.endTableId = e.endTableId - 1;
          }

          return { ...newR, id: i };
        });
    });
    setTables((prev) => {
      return prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }));
    });
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateTable = (id, updatedValues) => {
    setTables((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t)),
    );
  };

  const updateField = (tid, fid, updatedValues) => {
    setTables((prev) =>
      prev.map((table, i) => {
        if (tid === i) {
          return {
            ...table,
            fields: table.fields.map((field, j) =>
              fid === j ? { ...field, ...updatedValues } : field,
            ),
          };
        }
        return table;
      }),
    );
  };

  const deleteField = (field, tid, addToHistory = true) => {
    const currentTable = tables[tid];

    // If table has a composite pk
    const pkFieldIds = currentTable.fields.filter(f => f.primary).map(f => f.id);
    const isPartOfCompositePK = field.primary && pkFieldIds.length > 1;

    // If the field is a composite FK
    const isPartOfCompositeFK = (() => {
      if (!field.foreignK) return false;
      const fkTableId = field.foreignKey.tableId;

      // Get all the fields Fk pointing to the same tables
      const relatedFKs = tables[tid].fields.filter(
        f =>
          f.foreignK &&
          f.foreignKey.tableId === fkTableId
      );
      return relatedFKs.length > 1;
    })();

    // get associated relationships
    let affectedRelationships = relationships.filter(
      (r) =>
        (r.startTableId === tid && r.startFieldId === field.id) ||
        (r.endTableId === tid && r.endFieldId === field.id)
    );

    // If PKs is composite, get all its relationships
    if (isPartOfCompositePK) {
      affectedRelationships = relationships.filter(
        (r) => r.startTableId === tid && pkFieldIds.includes(r.startFieldId)
      );
    }

    // If FKs is composite, get all its relationships
    if (isPartOfCompositeFK && field.foreignK) {
      const fkTableId = field.foreignKey.tableId;
      const relatedFKFieldIds = tables[tid].fields
        .filter(f => f.foreignK && f.foreignKey.tableId === fkTableId)
        .map(f => f.id);

      affectedRelationships = relationships.filter(
        (r) => r.endTableId === tid && relatedFKFieldIds.includes(r.endFieldId)
      );
    }

    let childFieldsSnapshot = {}

    if (affectedRelationships.length > 0) {
      affectedRelationships.forEach((rel) => {
        const childTable = tables.find((t) => t.id === rel.endTableId);
        if(childTable){
          childFieldsSnapshot[childTable.id] = JSON.parse(JSON.stringify(childTable.fields));
        }
      });
    }

    const previousFields = JSON.parse(JSON.stringify(currentTable.fields));
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.TABLE,
          component: "field_delete",
          tid: tid,
          data: {
            field: field,
            relationship: affectedRelationships,
            previousFields: previousFields,
            childFieldsSnapshot: childFieldsSnapshot,
          },
          message: t("edit_table", {
            tableName: currentTable.name,
            extra: "[delete field]",
          }),
        },
      ]);
      setRedoStack([]);
    }

    // Delete relationships
    setRelationships((prev) => {
      const affectedRelIds = new Set(affectedRelationships.map((r) => r.id));

      const temp = prev
        .filter((r) => !affectedRelIds.has(r.id))
        .map((r, i) => {
          // Reindex relationships
          const newRel = { ...r, id: i };

          // Adjust fieldId if there are fields after deleting
          if (newRel.startTableId === tid && newRel.startFieldId > field.id) {
            newRel.startFieldId -= 1;
          }
          if (newRel.endTableId === tid && newRel.endFieldId > field.id) {
            newRel.endFieldId -= 1;
          }

          return newRel;
        });

      return temp;
    });

    const updatedTables = [...tables];

    // Delete FKs in child tables if a composite PK is deleted
    if (isPartOfCompositePK) {
      affectedRelationships.forEach((rel) => {
        const childTable = updatedTables.find((t) => t.id === rel.endTableId);
        const fksToRemove = childTable.fields.filter(
          (f) =>
            f.foreignK &&
            f.foreignKey.tableId === tid &&
            pkFieldIds.includes(f.foreignKey.fieldId)
        );
        childTable.fields = childTable.fields
          .filter((f) => !fksToRemove.includes(f))
          .map((f, i) => ({ ...f, id: i }));
      });
    }

    // Delete FKs in child tables if a composite FK is deleted
    if (isPartOfCompositeFK && field.foreignK) {
      const fkTableId = field.foreignKey.tableId;
      const childTable = updatedTables[tid];
      childTable.fields = childTable.fields
        .filter(
          (f) =>
            !(
              f.foreignK &&
              f.foreignKey.tableId === fkTableId
            )
        )
        .map((f, i) => ({ ...f, id: i }));
    }

    // Delete any FK references in other tables
    updatedTables.forEach((table) => {
      table.fields = table.fields.filter(
        (f) =>
          !(
            f.foreignK &&
            f.foreignKey.tableId === tid &&
            f.foreignKey.fieldId === field.id
          )
      );
    });

    // Delete the field from the table
    updatedTables[tid].fields = updatedTables[tid].fields
      .filter((f) => f.id !== field.id)
      .map((f, i) => ({ ...f, id: i }));

    // Update the tables state
    updatedTables.forEach((table) => updateTable(table.id, { fields: table.fields }));
  };

  const addRelationship = (data, addToHistory = true) => {
    if (addToHistory) {
      // First, update the relationships
      setRelationships((prev) => [...prev, data]);

      // After that, update the component undo stack
      setUndoStack((prevUndo) => [
        ...prevUndo,
        {
          action: Action.ADD,
          element: ObjectType.RELATIONSHIP,
          data: data,
          message: t("add_relationship"),
        },
      ]);
      setRedoStack([]);
    } else {
      setRelationships((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });

      const tableIndex = data.endTableId;
      if(tables[tableIndex]){

        const currentFields = tables[tableIndex].fields;
        const fieldToInsert = data.endField[0];
        const exists = currentFields.some((field) => field.id === fieldToInsert.id);

        if (!exists){
          const newFieldsArray = [
            ...currentFields.slice(0, data.endFieldId),
            ...data.endField.map((field) => ({...field})),
            ...currentFields.slice(data.endFieldId),
          ];
          updateTable(tableIndex, {
            fields: newFieldsArray,
          });
        }
      }
    }
  };

  const deleteRelationship = (id, addToHistory = true) => {
    const relationship = relationships[id];

    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.RELATIONSHIP,
          data: relationship,
          message: t("delete_relationship", {
            refName: relationship.name,
          }),
        },
      ]);
      setRedoStack([]);
    }

    const chieldTableId = relationship.endTableId;
    const chieldTable = tables.find((table) => table.id === chieldTableId);

    const fieldsToDelete = chieldTable.fields.filter(
      (field) =>
        field.foreignKey &&
        field.foreignKey.tableId === relationship.startTableId // compare the thableId from the relationship
    );

    if (fieldsToDelete.length > 0) {
      updateTable(chieldTableId, {
        fields: chieldTable.fields.filter(
          (field) =>
            !fieldsToDelete.some((toDelete) => toDelete.id === field.id) // Delete all fk from the child table
        ),
      });
    }

    setRelationships((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
  };

  const updateRelationship = (id, updatedValues) => {
    setRelationships((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedValues } : t)),
    );
  };

  return (
    <DiagramContext.Provider
      value={{
        tables,
        setTables,
        addTable,
        updateTable,
        updateField,
        deleteField,
        deleteTable,
        relationships,
        setRelationships,
        addRelationship,
        deleteRelationship,
        updateRelationship,
        database,
        setDatabase,
        tablesCount: tables.length,
        relationshipsCount: relationships.length,
      }}
    >
      {children}
    </DiagramContext.Provider>
  );
}
