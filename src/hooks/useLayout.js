import { useContext } from "react";
import { LayoutContext } from "../context/LayoutContext";

/**
 * Access layout state
 * 
 * Layout includes: header, sidebar, toolbar, issues, fullscreen
 * 
 * @returns `{ layout, setLayout }`
 */
export default function useLayout() {
  return useContext(LayoutContext);
}
