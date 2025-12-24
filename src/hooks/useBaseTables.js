import { useContext } from "react";
import { BaseTablesContext } from "../context/BaseTablesContext";

export default function useBaseTables() {
  return useContext(BaseTablesContext);
}

