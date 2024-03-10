import { useContext } from "react";
import { TablesContext } from "../context/TablesContext";

export default function useTables() {
  return useContext(TablesContext);
}
