import { createContext, useContext } from "react";

const ExtensionsContext = createContext({});

export function useExtensions() {
  return useContext(ExtensionsContext);
}

export function Slot({ name }) {
  const extensions = useExtensions();
  return extensions[name] ?? null;
}

export default ExtensionsContext;
