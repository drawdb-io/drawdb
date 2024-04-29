import { useContext } from "react";
import { LineContext } from "../context/LineContext";

export default function useLine() {
  return useContext(LineContext);
}
