import { createContext, useCallback, useEffect, useRef, useState } from "react";
import { applyTransformActions } from "../utils/transform";

export const TransformContext = createContext(null);

export default function TransformContextProvider({ children }) {
  const [transform, setTransformInternal] = useState({
    zoom: 1,
    pan: { x: 0, y: 0 },
  });
  const pendingActionsRef = useRef([]);
  const frameRef = useRef(null);

  /**
   * @type {typeof DrawDB.TransformContext["setTransform"]}
   */
  const setTransform = useCallback(
    (actionOrValue) => {
      pendingActionsRef.current.push(actionOrValue);
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);

      frameRef.current = requestAnimationFrame(() => {
        const actions = pendingActionsRef.current;
        pendingActionsRef.current = [];
        frameRef.current = null;
        setTransformInternal((prev) => applyTransformActions(prev, actions));
      });
    },
    [setTransformInternal],
  );

  useEffect(
    () => () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
      pendingActionsRef.current = [];
    },
    [],
  );

  return (
    <TransformContext.Provider value={{ transform, setTransform }}>
      {children}
    </TransformContext.Provider>
  );
}
