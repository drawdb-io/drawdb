import { useContext, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Action, ObjectType } from "../data/constants";
import { DiagramActionsContext } from "../context/DiagramContext";
import { UndoRedoActionsContext } from "../context/UndoRedoContext";
import {
  getRelatedFieldKeysByTable,
  getTableHeight,
  getTableWidth,
} from "../utils/utils";
import { findContainingArea } from "../utils/rect";
import useAreas from "./useAreas";
import useSettings from "./useSettings";

export default function useAreaMembership() {
  const { t } = useTranslation();
  const { getTables, getRelationships, updateTables } = useContext(
    DiagramActionsContext,
  );
  const { areas, updateArea } = useAreas();
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useContext(UndoRedoActionsContext);
  const relatedFieldKeysRef = useRef({ relationships: null, keys: null });

  const getRelatedFieldKeys = (tableId) => {
    const relationships = getRelationships();
    if (relatedFieldKeysRef.current.relationships !== relationships) {
      relatedFieldKeysRef.current = {
        relationships,
        keys: getRelatedFieldKeysByTable(relationships),
      };
    }
    return relatedFieldKeysRef.current.keys.get(tableId);
  };

  const getTableRect = (table, { x, y } = table) => ({
    x,
    y,
    width: getTableWidth(table),
    height: getTableHeight(
      table,
      settings.showComments,
      getRelatedFieldKeys(table.id),
    ),
  });

  const resolveAreaId = (table, areaList = areas, coords = table) =>
    table.areaId !== undefined
      ? table.areaId
      : findContainingArea(getTableRect(table, coords), areaList)?.id ?? null;

  const persistInferredAreaIds = (areaList = areas) => {
    const inferred = new Map();
    getTables().forEach((table) => {
      if (table.areaId === undefined) {
        inferred.set(table.id, { areaId: resolveAreaId(table, areaList) });
      }
    });
    if (inferred.size > 0) updateTables(inferred);
  };

  const toggleAreaHidden = (area) => {
    if (!area.hidden) persistInferredAreaIds();
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.AREA,
        aid: area.id,
        undo: { hidden: area.hidden },
        redo: { hidden: !area.hidden },
        message: t("edit_area", { areaName: area.name, extra: "[hidden]" }),
      },
    ]);
    setRedoStack([]);
    updateArea(area.id, { hidden: !area.hidden });
  };

  return {
    getTableRect,
    resolveAreaId,
    persistInferredAreaIds,
    toggleAreaHidden,
  };
}
