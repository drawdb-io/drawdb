import { useContext } from "react";
import { UndoRedoContext } from "../context/UndoRedoContext";

export default function useUndoRedo() {
  return useContext(UndoRedoContext);
}
