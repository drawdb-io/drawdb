import { useContext } from "react";
import { NotesContext } from "../context/NotesContext";

export default function useNotes() {
  return useContext(NotesContext);
}
