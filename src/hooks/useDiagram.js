import { useContext } from "react";
import { DiagramContext } from "../context/DiagramContext";

export default function useDiagram() {
  return useContext(DiagramContext);
}
