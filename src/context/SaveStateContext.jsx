import { createContext, useState } from "react";
import { State } from "../data/constants";

export const SaveStateContext = createContext(State.NONE);

export default function SaveStateContextProvider({ children }) {
  const [saveState, setSaveState] = useState(State.NONE);

  return (
    <SaveStateContext.Provider value={{ saveState, setSaveState }}>
      {children}
    </SaveStateContext.Provider>
  );
}
