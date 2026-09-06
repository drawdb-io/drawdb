import { createContext, useState } from "react";
import { Action, ObjectType, defaultBlue } from "../data/constants";
import { useTransform, useUndoRedo, useSelect, useCollab } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { nanoid } from "nanoid";

export const ViewsContext = createContext(null);

export default function ViewsContextProvider({ children }) {
  const { t } = useTranslation();
  const [views, setViews] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { emitDelta, isApplyingRemoteRef } = useCollab();

  const shouldEmit = () => !isApplyingRemoteRef?.current;

  const addView = (data, addToHistory = true) => {
    const id = nanoid();
    const newView = {
      id,
      name: `view_${views.length}`,
      x: transform.pan.x,
      y: transform.pan.y,
      baseTableId: null,
      joins: [],
      columns: [],
      conditions: [],
      comment: "",
      materialized: false,
      color: defaultBlue,
      locked: false,
    };
    if (data) {
      setViews((prev) => {
        const temp = prev.slice();
        temp.splice(data.index ?? prev.length, 0, data.view);
        return temp;
      });
    } else {
      setViews((prev) => [...prev, newView]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.VIEW,
          data: data || { view: newView, index: views.length },
          message: t("add_view"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit()) {
      const created = data?.view ?? newView;
      emitDelta({
        target: "view",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteView = (id, addToHistory = true) => {
    const index = views.findIndex((v) => v.id === id);
    if (index === -1) return;

    if (addToHistory) {
      Toast.success(t("view_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.VIEW,
          data: { view: views[index], index },
          message: t("delete_view", { viewName: views[index].name }),
        },
      ]);
      setRedoStack([]);
    }
    setViews((prev) => prev.filter((v) => v.id !== id));
    if (
      selectedElement.element === ObjectType.VIEW &&
      selectedElement.id === id
    ) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
    if (shouldEmit()) {
      emitDelta({
        target: "view",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateView = (id, updatedValues) => {
    setViews((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updatedValues } : v)),
    );
    if (shouldEmit()) {
      emitDelta({
        target: "view",
        action: "update",
        entityId: id,
        data: [id, updatedValues],
      });
    }
  };

  return (
    <ViewsContext.Provider
      value={{
        views,
        setViews,
        addView,
        updateView,
        deleteView,
        viewsCount: views.length,
      }}
    >
      {children}
    </ViewsContext.Provider>
  );
}
