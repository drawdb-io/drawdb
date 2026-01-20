import { createContext, useState } from "react";
import { Action, ObjectType } from "../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useUndoRedo } from "../hooks";
import { nanoid } from "nanoid";

export const BaseTablesContext = createContext(null);

export default function BaseTablesContextProvider({ children }) {
  const { t } = useTranslation();
  const [baseTables, setBaseTables] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const addBaseTable = (data, addToHistory = true) => {
    const newBaseTable = {
      id: nanoid(),
      name: `base_table_${baseTables.length}`,
      fields: [],
    };
    if (data) {
      setBaseTables((prev) => {
        const temp = prev.slice();
        temp.splice(data.index, 0, data.baseTable);
        return temp;
      });
    } else {
      setBaseTables((prev) => [...prev, newBaseTable]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          data: {
            index: baseTables.length,
            baseTable: data?.baseTable ?? newBaseTable,
          },
          element: ObjectType.BASETABLE,
          message: t("add_base_table"),
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteBaseTable = (id, addToHistory = true) => {
    const baseTableIndex = baseTables.findIndex((bt) => bt.id === id);
    if (addToHistory) {
      Toast.success(t("base_table_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.BASETABLE,
          data: {
            index: baseTableIndex,
            baseTable: baseTables[baseTableIndex],
          },
          message: t("delete_base_table", {
            baseTableName: baseTables[baseTableIndex].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setBaseTables((prev) => prev.filter((bt) => bt.id !== id));
  };

  const updateBaseTable = (id, values) => {
    setBaseTables((prev) =>
      prev.map((bt) => (bt.id === id ? { ...bt, ...values } : bt)),
    );
  };

  return (
    <BaseTablesContext.Provider
      value={{
        baseTables,
        setBaseTables,
        addBaseTable,
        updateBaseTable,
        deleteBaseTable,
        baseTablesCount: baseTables.length,
      }}
    >
      {children}
    </BaseTablesContext.Provider>
  );
}

