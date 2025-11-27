import { createContext, useState } from "react";
import { Action, ObjectType } from "../data/constants";
import { useUndoRedo } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";

export const TypesContext = createContext(null);

export default function TypesContextProvider({ children }) {
  const { t } = useTranslation();
  const [types, setTypes] = useState([]);
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const addType = (data, addToHistory = true) => {
    const id = nanoid();
    if (data) {
      setTypes((prev) => {
        const temp = prev.slice();
        temp.splice(data.index, 0, data.type);
        return temp;
      });
    } else {
      setTypes((prev) => [
        ...prev,
        {
          id,
          name: `type_${prev.length}`,
          fields: [],
          comment: "",
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          data: {
            index: types.length,
            type: data?.type ?? {
              id,
              name: `type_${prev.length}`,
              fields: [],
              comment: "",
            },
          },
          action: Action.ADD,
          element: ObjectType.TYPE,
          message: t("add_type"),
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteType = (id, addToHistory = true) => {
    if (addToHistory) {
      const deletedTypeIndex = types.findIndex((e, i) =>
        typeof id === "number" ? i === id : e.id === id,
      );
      Toast.success(t("type_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.TYPE,
          data: { type: types[deletedTypeIndex], index: deletedTypeIndex },
          message: t("delete_type", {
            typeName: types[deletedTypeIndex].name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setTypes((prev) =>
      prev.filter((e, i) => (typeof id === "number" ? i !== id : e.id !== id)),
    );
  };

  const updateType = (id, values) => {
    setTypes((prev) =>
      prev.map((item, index) => {
        const isMatch = typeof id === "number" ? index === id : item.id === id;

        return isMatch ? { ...item, ...values } : item;
      }),
    );
  };

  return (
    <TypesContext.Provider
      value={{
        types,
        setTypes,
        addType,
        updateType,
        deleteType,
        typesCount: types.length,
      }}
    >
      {children}
    </TypesContext.Provider>
  );
}
