import { createContext, useState } from "react";
import useTransform from "../hooks/useTransform";
import { Action, ObjectType, defaultNoteTheme } from "../data/constants";
import useUndoRedo from "../hooks/useUndoRedo";
import useSelect from "../hooks/useSelect";

export const NotesContext = createContext(null);

export default function NotesContextProvider({ children }) {
  const [notes, setNotes] = useState([]);
  const { transform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { selectedElement, setSelectedElement } = useSelect();

  const addNote = (data, addToHistory = true) => {
    if (data) {
      setNotes((prev) => {
        const temp = prev.slice();
        temp.splice(data.id, 0, data);
        return temp.map((t, i) => ({ ...t, id: i }));
      });
    } else {
      setNotes((prev) => [
        ...prev,
        {
          id: prev.length,
          x: -transform.pan.x,
          y: -transform.pan.y,
          title: `note_${prev.length}`,
          content: "",
          color: defaultNoteTheme,
          height: 88,
        },
      ]);
    }
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.ADD,
          element: ObjectType.NOTE,
          message: `Add new note`,
        },
      ]);
      setRedoStack([]);
    }
  };

  const deleteNote = (id, addToHistory = true) => {
    if (addToHistory) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.DELETE,
          element: ObjectType.NOTE,
          data: notes[id],
          message: `Delete note`,
        },
      ]);
      setRedoStack([]);
    }
    setNotes((prev) =>
      prev.filter((e) => e.id !== id).map((e, i) => ({ ...e, id: i }))
    );
    if (id === selectedElement.id) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
    }
  };

  const updateNote = (id, values) => {
    setNotes((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            ...values,
          };
        }
        return t;
      })
    );
  };

  return (
    <NotesContext.Provider
      value={{ notes, setNotes, updateNote, addNote, deleteNote }}
    >
      {children}
    </NotesContext.Provider>
  );
}
