import { useContext } from "react";
import { EnumsContext } from "../context/EnumsContext";

export default function useEnums() {
  return useContext(EnumsContext);
}
