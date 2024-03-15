import { useContext } from "react";
import { SaveStateContext } from "../context/SaveStateContext";

export default function useSaveState() {
  return useContext(SaveStateContext);
}
