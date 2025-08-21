import { createContext, useState, useCallback } from "react";
import { Action } from "../data/constants";

export const UndoRedoContext = createContext({
  undoStack: [],
  redoStack: [],
  pushUndo: () => {},
  pushRedo: () => {},
  clearUndoRedo: () => {},
});

export default function UndoRedoContextProvider({ children }) {
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Helper to push an action into the undo stack with basic filtering
  const pushUndo = useCallback((action) => {
    if (!action) return;

      // Only accept real mutation actions to avoid recording trivial UI interactions
      const allowedActionNames = new Set(["MOVE", "ADD", "DELETE", "EDIT", "PAN"]);
      const allowedActionNums = new Set([Action.MOVE, Action.ADD, Action.DELETE, Action.EDIT, Action.PAN]);

      // action.action may be numeric constant (Action enum) or string
      if (typeof action.action === 'number') {
        if (!allowedActionNums.has(action.action)) return;
      } else if (typeof action.action === 'string') {
        if (!allowedActionNames.has(action.action)) return;
      } else {
        // If no explicit action type, ignore
        return;
      }

    // Avoid pushing duplicate consecutive actions (shallow compare by JSON)
    const last = undoStack[undoStack.length - 1];
    try {
      const sLast = JSON.stringify(last);
      const sAction = JSON.stringify(action);
      if (sLast === sAction) return;
    } catch (e) {
      // If stringify fails, skip duplicate check
    }

  // No-op: intentionally do not log in production; tracing was used for debugging
  // during development and has been removed to keep console clean.

    setUndoStack((prev) => [...prev, action]);
    // pushing a new undo clears redo
    setRedoStack([]);
  }, [undoStack]);

  const pushRedo = useCallback((action) => {
    if (!action) return;
    const last = redoStack[redoStack.length - 1];
    try {
      const sLast = JSON.stringify(last);
      const sAction = JSON.stringify(action);
      if (sLast === sAction) return;
    } catch (e) {}
    setRedoStack((prev) => [...prev, action]);
  }, [redoStack]);

  const clearUndoRedo = useCallback(() => {
    setUndoStack([]);
    setRedoStack([]);
  }, []);

  return (
    <UndoRedoContext.Provider
      value={{ undoStack, redoStack, setUndoStack, setRedoStack, pushUndo, pushRedo, clearUndoRedo }}
    >
      {children}
    </UndoRedoContext.Provider>
  );
}
