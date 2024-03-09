import { useContext } from "react";
import { SettingsContext } from "../context/SettingsContext";

export default function useSettings() {
  return useContext(SettingsContext);
}
