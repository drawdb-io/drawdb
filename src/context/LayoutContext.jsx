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

  const hideHeaderParam = searchParams.get("hideHeader");
  const hideSidebarParam = searchParams.get("hideSidebar");
  const hideToolbarParam = searchParams.get("hideToolbar");
  const isForceReadOnly = searchParams.get("forceReadOnly") === "true";

  const [layout, setLayout] = useState({
    ...defaultLayout,
    header:
      hideHeaderParam === "true" || hideHeaderParam === "force"
        ? false
        : defaultLayout.header,
    sidebar:
      hideSidebarParam === "true" || hideSidebarParam === "force"
        ? false
        : defaultLayout.sidebar,
    toolbar:
      hideToolbarParam === "true" || hideToolbarParam === "force"
        ? false
        : defaultLayout.toolbar,
    readOnly: isForceReadOnly || defaultLayout.readOnly,
  });

  const effectiveLayout = {
    ...layout,
    header: hideHeaderParam === "force" ? false : layout.header,
    sidebar: hideSidebarParam === "force" ? false : layout.sidebar,
    toolbar: hideToolbarParam === "force" ? false : layout.toolbar,
    readOnly: isForceReadOnly ? true : layout.readOnly,
  };

  return (
    <LayoutContext.Provider
      value={{
        layout: effectiveLayout,
        setLayout,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
}
