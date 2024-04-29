import { createContext, useState } from "react";

export const LineContext = createContext(null);

export default function LineContextProvider({ children }) {
  const [linking, setLinking] = useState(false);
  const [linkingLine, setLinkingLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  return (
    <LineContext.Provider
      value={{
        linking,
        setLinking,
        linkingLine,
        setLinkingLine
       }}
    >
      {children}
    </LineContext.Provider>
  );
}
