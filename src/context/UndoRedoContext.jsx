import { createContext, useMemo, useState } from "react";

export const UndoRedoContext = createContext({
  undoStack: [],
  setUndoStack: () => {},
  redoStack: [],
  setRedoStack: () => {},
});

export const UndoRedoActionsContext = createContext({
  setUndoStack: () => {},
  setRedoStack: () => {},
});

export default function UndoRedoContextProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const actions = useMemo(() => ({ setUndoStack, setRedoStack }), []);

  const value = useMemo(
    () => ({ ...actions, undoStack, redoStack }),
    [actions, undoStack, redoStack],
  );

  return (
    <UndoRedoActionsContext.Provider value={actions}>
      <UndoRedoContext.Provider value={value}>
        {children}
      </UndoRedoContext.Provider>
    </UndoRedoActionsContext.Provider>
  );
}
