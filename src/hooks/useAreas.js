import { useContext } from "react";
import { AreasContext } from "../context/AreasContext";

export default function useAreas() {
  return useContext(AreasContext);
}
