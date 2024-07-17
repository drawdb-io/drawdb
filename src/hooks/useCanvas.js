import { useContext } from "react";
import { CanvasContext } from "../context/CanvasContext";

export default function useCanvas() {
  return useContext(CanvasContext);
}
