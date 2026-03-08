import { Toast } from "@douyinfe/semi-ui";
import { createContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Action, ObjectType, defaultBlue } from "../data/constants";
import { useSelect, useTransform, useUndoRedo, useCollab } from "../hooks";

export const AreasContext = createContext(null);

export default function AreasContextProvider({ children }) {
  const { t } = useTranslation();
  const [areas, setAreas] = useState([]);
  const { transform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { socket, isApplyingRemoteRef, inSession, roomId } = useCollab();

  const emitDelta = (target, action, data) => {
    if (!socket) return;
    if (!inSession) return;
    if (!roomId) return;
    if (isApplyingRemoteRef.current) return;
    socket.emit("delta", { target, action, data });
  };

  const addArea = (data, addToHistory = true) => {
    let areaArg = data;
    if (data) {
      setAreas((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      const width = 200;
      const height = 200;
      const nextId = areas.length;
      const newArea = {
        id: nextId,
        name: `area_${nextId}`,
        x: transform.pan.x - width / 2,
        y: transform.pan.y - height / 2,
        width,
        height,
        color: defaultBlue,
        locked: false,
      };
      areaArg = newArea;
      setAreas((prev) => [...prev, newArea]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.AREA,
          message: t("add_area"),
        },
      ]);
      setRedoStack([]);
    }
    if (addToHistory) {
      emitDelta("area", "create", [areaArg]);
    }
  };

  const deleteArea = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("area_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.AREA,
          data: areas[id],
          message: t("delete_area", { areaName: areas[id].name }),
        },
      ]);
      setRedoStack([]);
    }
    setAreas((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
    emitDelta("area", "delete", [id]);
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
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
    emitDelta("area", "update", [id, values]);
  };

  return (
    <AreasContext.Provider
      value={{
        areas,
        setAreas,
        updateArea,
        addArea,
        deleteArea,
        areasCount: areas?.length,
      }}
    >
      {children}
    </AreasContext.Provider>
  );
}
