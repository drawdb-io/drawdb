import { useContext } from "react";
import { SelectContext } from "../context/SelectContext";

export default function useSelect() {
  return useContext(SelectContext);
}
