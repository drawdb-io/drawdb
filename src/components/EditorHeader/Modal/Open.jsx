import { useEffect, useState } from "react";
import { Banner, Spin, Tag } from "@douyinfe/semi-ui";
import { useLiveQuery } from "dexie-react-hooks";
import { useTranslation } from "react-i18next";
import { db } from "../../../data/db";
import { databases } from "../../../data/databases";
import { useExtensions } from "../../../context/ExtensionsContext";

function formatSize(bytes) {
  if (bytes == null) return "";
  if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + "MB";
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + "KB";
  return bytes + "B";
}

/**
 * Loads both lists in parallel. Local always comes from Dexie; cloud is
 * fetched only when a host app supplies `cloudList` via ExtensionsContext.
 * The Open dialog renders them as separate sections so signed-in users
 * can distinguish browser-only drafts from cloud-saved diagrams.
 */
function useDiagramList() {
  const extensions = useExtensions();
  const cloudList = extensions?.cloudList;
  const cloudEnabled = typeof cloudList === "function";
  const cloudCurrentUserId = extensions?.cloudCurrentUserId ?? null;

  const localDiagrams = useLiveQuery(() => db.diagrams.toArray(), []);

  const [cloudState, setCloudState] = useState(() => ({
    loading: cloudEnabled,
    error: null,
    items: null,
  }));

  useEffect(() => {
    if (!cloudEnabled) {
      setCloudState({ loading: false, error: null, items: [] });
      return undefined;
    }
    let cancelled = false;
    setCloudState({ loading: true, error: null, items: null });
    cloudList()
      .then((items) => {
        if (cancelled) return;
        setCloudState({ loading: false, error: null, items });
      })
      .catch((err) => {
        if (cancelled) return;
        setCloudState({
          loading: false,
          error: err?.response?.data?.error || err?.message || "Failed to load",
          items: null,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [cloudEnabled, cloudList]);

  return {
    loading: cloudState.loading || localDiagrams === undefined,
    error: cloudState.error,
    cloud: cloudState.items ?? [],
    local: localDiagrams ?? [],
    cloudEnabled,
    currentUserId: cloudCurrentUserId,
  };
}

function ownerLabel(d, currentUserId) {
  if (!d?.owner) return null;
  if (currentUserId && String(d.owner.id) === String(currentUserId)) {
    return "You";
  }
  return d.owner.username || d.owner.email || `User ${d.owner.id}`;
}

function DiagramTable({
  items,
  isCloud,
  currentUserId,
  selectedDiagramId,
  setSelectedDiagramId,
  cloudRowActions,
}) {
  const { t } = useTranslation();
  const showOwner =
    isCloud &&
    items.some((d) => d.owner && String(d.owner.id) !== String(currentUserId));
  const showRowActions = isCloud && typeof cloudRowActions === "function";

  return (
    <table className="w-full text-left border-separate border-spacing-x-0">
      <thead>
        <tr>
          <th>{t("name")}</th>
          {showOwner && <th>Owner</th>}
          <th>{t("last_modified")}</th>
          <th>{t("size")}</th>
          <th>{t("type")}</th>
          {showRowActions && <th />}
        </tr>
      </thead>
      <tbody>
        {items.map((d) => {
          const lastModified =
            d.lastModified instanceof Date
              ? d.lastModified
              : d.lastModified
                ? new Date(d.lastModified)
                : null;
          const size = isCloud
            ? formatSize(d.sizeBytes)
            : formatSize(JSON.stringify(d).length);
          const dbInfo = databases[d.database];
          const owner = ownerLabel(d, currentUserId);
          return (
            <tr
              key={d.diagramId}
              className={`cursor-pointer ${
                selectedDiagramId === d.diagramId
                  ? "bg-blue-300/30"
                  : "hover-1"
              }`}
              onClick={() => setSelectedDiagramId(d.diagramId)}
            >
              <td className="py-1">
                <i className="bi bi-file-earmark-text text-[16px] me-1 opacity-60" />
                {d.name}
              </td>
              {showOwner && (
                <td className="py-1">
                  {owner === "You" ? (
                    <Tag size="small" color="blue">
                      You
                    </Tag>
                  ) : (
                    <span className="text-sm">{owner}</span>
                  )}
                </td>
              )}
              <td className="py-1">
                {lastModified
                  ? lastModified.toLocaleDateString() +
                    " " +
                    lastModified.toLocaleTimeString()
                  : ""}
              </td>
              <td className="py-1">{size}</td>
              <td className="py-1">{dbInfo?.name ?? "Generic"}</td>
              {showRowActions && (
                <td
                  className="py-1 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {cloudRowActions(d)}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function SectionHeader({ children }) {
  return (
    <h4 className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1 mt-2 first:mt-0">
      {children}
    </h4>
  );
}

export default function Open({ selectedDiagramId, setSelectedDiagramId }) {
  const { t } = useTranslation();
  const { loading, error, cloud, local, cloudEnabled, currentUserId } =
    useDiagramList();
  const extensions = useExtensions();
  const cloudRowActions = extensions?.cloudRowActions;

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    );
  }

  if (error) {
    return (
      <Banner
        fullMode={false}
        type="danger"
        bordered
        icon={null}
        closeIcon={null}
        description={<div>{error}</div>}
      />
    );
  }

  const hasCloud = cloud.length > 0;
  const hasLocal = local.length > 0;

  if (!hasCloud && !hasLocal) {
    return (
      <Banner
        fullMode={false}
        type="info"
        bordered
        icon={null}
        closeIcon={null}
        description={<div>{t("no_saved_diagrams")}</div>}
      />
    );
  }

  // OSS-only users see just their local list with no section header.
  // Cloud users always see the cloud section (with an empty hint when
  // they have no cloud diagrams yet) so the distinction is clear, plus
  // the local section only when they actually have local drafts.
  return (
    <div className="max-h-[360px] overflow-auto space-y-3">
      {cloudEnabled && (
        <section>
          <SectionHeader>Cloud diagrams</SectionHeader>
          {hasCloud ? (
            <DiagramTable
              items={cloud}
              isCloud
              currentUserId={currentUserId}
              selectedDiagramId={selectedDiagramId}
              setSelectedDiagramId={setSelectedDiagramId}
              cloudRowActions={cloudRowActions}
            />
          ) : (
            <div className="text-sm text-zinc-500 dark:text-zinc-400 px-1 py-2">
              No cloud diagrams yet.
            </div>
          )}
        </section>
      )}
      {hasLocal && (
        <section>
          {cloudEnabled && <SectionHeader>Local (this browser)</SectionHeader>}
          <DiagramTable
            items={local}
            isCloud={false}
            currentUserId={currentUserId}
            selectedDiagramId={selectedDiagramId}
            setSelectedDiagramId={setSelectedDiagramId}
            cloudRowActions={cloudRowActions}
          />
        </section>
      )}
    </div>
  );
}
