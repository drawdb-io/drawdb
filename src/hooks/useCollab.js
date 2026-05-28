import { useContext } from "react";
import { CollabContext } from "../context/CollabContext";

export default function useCollab() {
  return useContext(CollabContext);
}
