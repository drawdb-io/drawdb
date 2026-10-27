import { Toast } from "@douyinfe/semi-ui";
import { createContext, useState } from "react";
import { nanoid } from "nanoid";
import { useTranslation } from "react-i18next";
import { Action, ObjectType, defaultBlue } from "../data/constants";
import { useSelect, useTransform, useUndoRedo, useCollab } from "../hooks";
import { cascadePosition } from "../utils/rect";

export const AreasContext = createContext(null);

export default function AreasContextProvider({ children }) {
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const { transform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { emitDelta, isApplyingRemoteRef } = useCollab();
  const shouldEmit = () => !isApplyingRemoteRef?.current;

  const addArea = (data, addToHistory = true, index = areas.length) => {
    let created = data;
    if (data) {
      setAreas((prev) => {
        const temp = prev.slice();
        temp.splice(index, 0, data);
        return temp;
      });
    } else {
      const width = 200;
      const height = 200;
      const id = nanoid();
      created = {
        id,
        name: `area_${id}`,
        ...cascadePosition(
          { x: transform.pan.x - width / 2, y: transform.pan.y - height / 2 },
          areas,
        ),
        width,
        height,
        color: defaultBlue,
        locked: false,
      };
      setAreas((prev) => [...prev, created]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.AREA,
          data: created,
          message: t("add_area"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit() && created) {
      emitDelta({
        target: "area",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteArea = (id, addToHistory = true) => {
    if (addToHistory) {
      const index = areas.findIndex((a) => a.id === id);
      Toast.success(t("area_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.AREA,
          data: areas[index],
          index,
          message: t("delete_area", { areaName: areas[index].name }),
        },
      ]);
      setRedoStack([]);
    }
    setAreas((prev) => prev.filter((e) => e.id !== id));
    if (
      selectedElement.element === ObjectType.AREA &&
      id === selectedElement.id
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
        target: "area",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateArea = (id, values) => {
    setAreas((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      }),
    );
    if (shouldEmit()) {
      emitDelta({
        target: "area",
        action: "update",
        entityId: id,
        data: [id, values],
      });
    }
  };

  return (
    <AreasContext.Provider
      value={{
        areas,
        setAreas,
        updateArea,
        addArea,
        deleteArea,
        areasCount: areas.length,
      }}
    >
      {children}
    </AreasContext.Provider>
  );
}
