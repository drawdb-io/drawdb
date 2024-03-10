import { createContext, useState } from "react";
import { ObjectType } from "../data/data";

export const SelectContext = createContext(null);

export default function SelectContextProvider({ children }) {
  const [selectedElement, setSelectedElement] = useState({
    element: ObjectType.NONE,
    id: -1,
    openDialogue: false,
    openCollapse: false,
  });

  return (
    <SelectContext.Provider value={{ selectedElement, setSelectedElement }}>
      {children}
    </SelectContext.Provider>
  );
}
