import { useContext } from "react";
import { ViewsContext } from "../context/ViewsContext";

export default function useViews() {
  return useContext(ViewsContext);
}
