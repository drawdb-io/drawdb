import { createContext, useState } from "react";
import { useSearchParams } from "react-router-dom";

export const LayoutContext = createContext(null);

const defaultLayout = {
  header: true,
  sidebar: true,
  issues: true,
  toolbar: true,
  dbmlEditor: false,
  readOnly: false,
};

export default function LayoutContextProvider({ children }) {
  const [searchParams] = useSearchParams();

  const [layout, setLayout] = useState({
    ...defaultLayout,
    header: searchParams.get("hideHeader") !== "true",
    sidebar: searchParams.get("hideSidebar") !== "true",
    toolbar: searchParams.get("hideToolbar") !== "true",
  });

  const forceReadOnly = searchParams.get("forceReadOnly") === "true";

  return (
    <LayoutContext.Provider
      value={{
        layout: forceReadOnly ? { ...layout, readOnly: true } : layout,
        setLayout,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
