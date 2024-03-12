import { useContext } from "react";
import { TypesContext } from "../context/TypesContext";

export default function useTypes() {
  return useContext(TypesContext);
}
