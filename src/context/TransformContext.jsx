import { createContext, useState } from "react";

export const TransformContext = createContext(null);

export default function TransformContextProvider({ children }) {
  const [transform, setTransform] = useState({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });

  return (
    <TransformContext.Provider value={{ transform, setTransform }}>
      {children}
    </TransformContext.Provider>
  );
}
