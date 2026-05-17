import { createContext, useContext, useMemo, useRef } from "react";

const NOOP = () => {};

/**
 * Transport-agnostic collaboration plumbing. The OSS app ships with a
 * no-op default — every mutation in DiagramContext/AreasContext/etc.
 * calls `emitDelta`, but with no provider attached it goes nowhere.
 *
 * Consumers (e.g. drawdb-pro) wrap the editor in their own provider
 * that supplies a real `emitDelta` (e.g. a Socket.IO `op` emit) and
 * an `isApplyingRemoteRef` so remote changes don't re-emit.
 *
 * Contract:
 *   emitDelta({ target, action, entityId, data })
 *     target: 'table' | 'relationship' | 'area' | 'note' | 'database' | 'types' | 'enums'
 *     action: 'create' | 'update' | 'delete'
 *     entityId: stable per-entity id (for singletons, equal to target name)
 *     data: action-specific payload (matches applyDiagramDelta inputs)
 *   isApplyingRemoteRef.current: true while a remote op is being applied
 *     locally; mutation contexts skip emitDelta in that case.
 */
export const CollabContext = createContext({
  emitDelta: NOOP,
  emitAwareness: NOOP,
  isApplyingRemoteRef: { current: false },
});

export function useCollab() {
  return useContext(CollabContext);
}

/**
 * OSS no-op provider. Keeps the context shape stable for components that
 * expect a provider somewhere in the tree, even though the default value
 * already covers them.
 */
export default function CollabContextProvider({ children }) {
  const isApplyingRemoteRef = useRef(false);
  const value = useMemo(
    () => ({ emitDelta: NOOP, emitAwareness: NOOP, isApplyingRemoteRef }),
    [],
  );
  return (
    <CollabContext.Provider value={value}>{children}</CollabContext.Provider>
  );
}
