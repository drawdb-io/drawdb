import { createContext, useState, useCallback } from "react";
import {
  Action,
  ObjectType,
  defaultNoteTheme,
  noteWidth,
} from "../data/constants";
import { useUndoRedo, useTransform, useSelect } from "../hooks";
import { Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useCollab } from "./CollabContext";

export const NotesContext = createContext(null);

export default function NotesContextProvider({ children }) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();
  const { emitDelta, isApplyingRemoteRef } = useCollab();
  const shouldEmit = () => !isApplyingRemoteRef?.current;

  const addNote = (data, addToHistory = true) => {
    // Pre-compute the new note so the UI-triggered "add note" (no args)
    // can still be broadcast — the previous `shouldEmit() && data` check
    // skipped the emit whenever the user clicked "Add note" from the UI.
    let created = data;
    if (data) {
      setNotes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      const height = 88;
      created = {
        id: notes.length,
        x: transform.pan.x,
        y: transform.pan.y - height / 2,
        title: `note_${notes.length}`,
        content: "",
        locked: false,
        color: defaultNoteTheme,
        height,
        width: noteWidth,
      };
      setNotes((prev) => [...prev, { ...created, id: prev.length }]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.NOTE,
          message: t("add_note"),
        },
      ]);
      setRedoStack([]);
    }
    if (shouldEmit() && created) {
      emitDelta({
        target: "note",
        action: "create",
        entityId: created.id,
        data: [created],
      });
    }
  };

  const deleteNote = (id, addToHistory = true) => {
    if (addToHistory) {
      Toast.success(t("note_deleted"));
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.NOTE,
          data: notes[id],
          message: t("delete_note", { noteTitle: notes[id].title }),
        },
      ]);
      setRedoStack([]);
    }
    setNotes((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i })),
    );
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
    if (shouldEmit()) {
      emitDelta({
        target: "note",
        action: "delete",
        entityId: id,
        data: [id],
      });
    }
  };

  const updateNote = useCallback(
    (id, values) => {
      setNotes((prev) =>
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
          target: "note",
          action: "update",
          entityId: id,
          data: [id, values],
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [emitDelta],
  );

  return (
    <NotesContext.Provider
      value={{
        notes,
        setNotes,
        updateNote,
        addNote,
        deleteNote,
        notesCount: notes.length,
      }}
    >
      {children}
    </NotesContext.Provider>
  );
}
