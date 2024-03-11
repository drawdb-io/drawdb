import { createContext, useState } from "react";
import { Action, ObjectType, defaultTableTheme } from "../data/data";
import useTransform from "../hooks/useTransform";
import useUndoRedo from "../hooks/useUndoRedo";
import useSelect from "../hooks/useSelect";

export const TablesContext = createContext(null);

export default function TablesContextProvider({ children }) {
  const [tables, setTables] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const addTable = (addToHistory = true, data) => {
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
          name: `table_${prev.length}`,
          x: -transform.pan.x,
          y: -transform.pan.y,
          fields: [
            {
              name: "id",
              type: "INT",
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
          color: defaultTableTheme,
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.TABLE,
          message: `Add new table`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteTable = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TABLE,
          data: tables[id],
          message: `Delete table`,
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
      setSelectedElement({
        element: ObjectType.NONE,
        id: -1,
        openDialogue: false,
        openCollapse: false,
      });
    }
  };

  const updateTable = (id, updatedValues, updateRelationships = false) => {
    setTables((prev) =>
      prev.map((table) => {
        if (table.id === id) {
          if (updateRelationships) {
            setRelationships((prev) =>
              prev.map((r) => {
                let newR = { ...r };
                if (r.startTableId === id) {
                  newR.startX = updatedValues.x + 15;
                  newR.startY = updatedValues.y + r.startFieldId * 36 + 69;
                }
                if (r.endTableId === id) {
                  newR.endX = updatedValues.x + 15;
                  newR.endY = updatedValues.y + r.endFieldId * 36 + 69;
                }
                return newR;
              })
            );
          }
          return {
            ...table,
            ...updatedValues,
          };
        }
        return table;
      })
    );
  };

  const updateField = (tid, fid, updatedValues) => {
    setTables((prev) =>
      prev.map((table, i) => {
        if (tid === i) {
          return {
            ...table,
            fields: table.fields.map((field, j) =>
              fid === j ? { ...field, ...updatedValues } : field
            ),
          };
        }
        return table;
      })
    );
  };

  const addRelationship = (addToHistory = true, data) => {
    if (addToHistory) {
      setRelationships((prev) => {
        setUndoStack((prevUndo) => [
          ...prevUndo,
          {
            action: Action.ADD,
            element: ObjectType.RELATIONSHIP,
            data: data,
            message: `Add new relationship`,
          },
        ]);
        setRedoStack([]);
        return [...prev, data];
      });
    } else {
      setRelationships((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    }
  };

  const deleteRelationship = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.RELATIONSHIP,
          data: relationships[id],
          message: `Delete relationship`,
        },
      ]);
      setRedoStack([]);
    }
    setRelationships((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
  };

  return (
    <TablesContext.Provider
      value={{
        tables,
        setTables,
        addTable,
        updateTable,
        updateField,
        deleteTable,
        relationships,
        setRelationships,
        addRelationship,
        deleteRelationship,
      }}
    >
      {children}
    </TablesContext.Provider>
  );
}
