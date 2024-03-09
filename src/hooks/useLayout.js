import { useContext } from "react";
import { LayoutContext } from "../context/LayoutContext";

export default function useLayout() {
  return useContext(LayoutContext);
}
