import { useEffect, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../../../../data/db";
import { useExtensions } from "../../../../../context/ExtensionsContext";

const DISABLED = { loading: false, error: null, items: [] };

function readError(err) {
  return err?.response?.data?.error || err?.message || "Failed to load";
}

export function useDiagramList() {
  const extensions = useExtensions();
  const cloudList = extensions?.cloudList;
  const cloudEnabled = typeof cloudList === "function";
  const currentUserId = extensions?.cloudCurrentUserId ?? null;

  const local = useLiveQuery(() => db.diagrams.toArray(), []);
  const [cloud, setCloud] = useState(() =>
    cloudEnabled ? { loading: true, error: null, items: null } : DISABLED,
  );

  useEffect(() => {
    if (!cloudEnabled) {
      setCloud(DISABLED);
      return undefined;
    }
    let cancelled = false;
    setCloud({ loading: true, error: null, items: null });
    cloudList()
      .then((items) => {
        if (!cancelled) setCloud({ loading: false, error: null, items });
      })
      .catch((err) => {
        if (!cancelled)
          setCloud({ loading: false, error: readError(err), items: null });
      });
    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, cloudList]);

  return {
    loading: cloud.loading || local === undefined,
    error: cloud.error,
    cloud: cloud.items ?? [],
    local: local ?? [],
    cloudEnabled,
    currentUserId,
  };
}
