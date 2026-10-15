import { createContext, useMemo, useState } from "react";
import { ObjectType, Tab } from "../data/constants";

export const SelectContext = createContext(null);
export const SelectActionsContext = createContext(null);

export default function SelectContextProvider({ children }) {
  const [selectedElement, setSelectedElement] = useState({
    element: ObjectType.NONE,
    id: -1,
    openDialogue: false,
    openCollapse: false,
    currentTab: Tab.TABLES,
    open: false, // open popover or sidesheet when sidebar is disabled
    openFromToolbar: false, // this is to handle triggering onClickOutside when sidebar is disabled
  });
  const [bulkSelectedElements, setBulkSelectedElements] = useState([]);

  const actions = useMemo(
    () => ({ setSelectedElement, setBulkSelectedElements }),
    [],
  );

  const value = useMemo(
    () => ({ ...actions, selectedElement, bulkSelectedElements }),
    [actions, selectedElement, bulkSelectedElements],
  );

  return (
    <SelectActionsContext.Provider value={actions}>
      <SelectContext.Provider value={value}>{children}</SelectContext.Provider>
    </SelectActionsContext.Provider>
  );
}
