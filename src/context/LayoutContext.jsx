import { createContext, useState } from "react";

export const LayoutContext = createContext(null);

export default function LayoutContextProvider({ children }) {
  const [layout, setLayout] = useState({
    header: true,
    sidebar: true,
    issues: true,
    toolbar: true,
    dbmlEditor: false,
  });

  return (
    <LayoutContext.Provider value={{ layout, setLayout }}>
      {children}
    </LayoutContext.Provider>
  );
}
