import { useState, useCallback, useRef } from "react";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { importFromFile, isFileSupported } from "../utils/importFrom/file";
import { databases } from "../data/databases";
import { mergeCustomTypes } from "../utils/customTypes";
import useDiagram from "./useDiagram";
import useNotes from "./useNotes";
import useAreas from "./useAreas";
import useTypes from "./useTypes";
import useEnums from "./useEnums";
import useTransform from "./useTransform";
import useUndoRedo from "./useUndoRedo";

/**
 * Hook that provides drag-and-drop file import functionality for the canvas.
 * Handles dragover/dragleave/drop events and processes supported file types.
 * When the canvas is not empty, prompts the user to overwrite or append.
 */
export default function useFileDrop() {
  const { t } = useTranslation();
  const [isDragOver, setIsDragOver] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const pendingData = useRef(null);

  const { tables, relationships, setTables, setRelationships, database } =
    useDiagram();
  const { notes, setNotes } = useNotes();
  const { areas, setAreas } = useAreas();
  const { types, setTypes } = useTypes();
  const { enums, setEnums } = useEnums();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const isDiagramEmpty = useCallback(() => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0 &&
      types.length === 0 &&
      enums.length === 0
    );
  }, [tables, relationships, notes, areas, types, enums]);

  const overwriteDiagram = useCallback(
    (data) => {
      if (data.tables) setTables(data.tables);
      if (data.relationships) setRelationships(data.relationships);
      setAreas(data.subjectAreas ?? data.areas ?? []);
      setNotes(data.notes ?? []);
      if (databases[database].hasEnums && data.enums) {
        setEnums(data.enums);
      }
      if (databases[database].hasTypes && data.types) {
        setTypes(data.types);
      }
      if (data.customTypes) {
        mergeCustomTypes(data.customTypes);
      }
      setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
      setUndoStack([]);
      setRedoStack([]);
    },
    [
      database,
      setTables,
      setRelationships,
      setAreas,
      setNotes,
      setEnums,
      setTypes,
      setTransform,
      setUndoStack,
      setRedoStack,
    ],
  );

  const appendToDiagram = useCallback(
    (data) => {
      if (data.tables) {
        setTables((prev) => [...prev, ...data.tables]);
      }
      if (data.relationships) {
        setRelationships((prev) =>
          [...prev, ...data.relationships].map((r, i) => ({ ...r, id: i })),
        );
      }
      if (databases[database].hasEnums && data.enums?.length) {
        setEnums((prev) => [...prev, ...data.enums]);
      }
      if (databases[database].hasTypes && data.types?.length) {
        setTypes((prev) => [...prev, ...data.types]);
      }
      if (data.customTypes) {
        mergeCustomTypes(data.customTypes);
      }
      setUndoStack([]);
      setRedoStack([]);
    },
    [
      database,
      setTables,
      setRelationships,
      setEnums,
      setTypes,
      setUndoStack,
      setRedoStack,
    ],
  );

  const handleImportOverwrite = useCallback(() => {
    if (pendingData.current) {
      overwriteDiagram(pendingData.current);
      Toast.success(
        t("file_imported_successfully") || "File imported successfully",
      );
    }
    pendingData.current = null;
    setShowImportModal(false);
  }, [overwriteDiagram, t]);

  const handleImportAppend = useCallback(() => {
    if (pendingData.current) {
      appendToDiagram(pendingData.current);
      Toast.success(
        t("file_imported_successfully") || "File imported successfully",
      );
    }
    pendingData.current = null;
    setShowImportModal(false);
  }, [appendToDiagram, t]);

  const handleImportCancel = useCallback(() => {
    pendingData.current = null;
    setShowImportModal(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    async (e) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];

      if (!isFileSupported(file)) {
        Toast.error(
          t("file_type_not_supported") ||
            "This file type is not supported. Supported types: JSON, DDB, DBML, SQL",
        );
        return;
      }

      const { data, error } = await importFromFile(file, database);

      if (error) {
        Toast.error(error);
        return;
      }

      if (!data) return;

      if (isDiagramEmpty()) {
        overwriteDiagram(data);
        Toast.success(
          t("file_imported_successfully") || "File imported successfully",
        );
      } else {
        pendingData.current = data;
        setShowImportModal(true);
      }
    },
    [database, isDiagramEmpty, overwriteDiagram, t],
  );

  return {
    isDragOver,
    showImportModal,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleImportOverwrite,
    handleImportAppend,
    handleImportCancel,
  };
}
