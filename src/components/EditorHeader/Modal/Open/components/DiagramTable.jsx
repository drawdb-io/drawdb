import { Tag } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import SortableHeader from "./SortableHeader";
import { SOURCE, databaseName, formatSize, ownerLabel } from "../diagram";

function TypeCell({ entry }) {
  const isCloud = entry.source === SOURCE.cloud;
  return (
    <Tag size="small" color={isCloud ? "cyan" : "grey"}>
      {isCloud ? "Cloud" : "Local"}
    </Tag>
  );
}

function OwnerCell({ entry, currentUserId }) {
  const label = ownerLabel(entry, currentUserId);
  if (label === "You") {
    return (
      <Tag size="small" color="blue">
        You
      </Tag>
    );
  }
  return <span className="text-sm">{label}</span>;
}

function formatTimestamp(date) {
  return date ? `${date.toLocaleDateString()} ${date.toLocaleTimeString()}` : "";
}

function useColumns({ showType, showOwner, currentUserId }) {
  const { t } = useTranslation();
  return [
    {
      key: "name",
      label: t("name"),
      sortable: true,
      render: ({ entry }) => entry.name,
    },
    showType && { key: "type", label: "Type", render: TypeCell },
    showOwner && {
      key: "owner",
      label: "Owner",
      render: (props) => <OwnerCell {...props} currentUserId={currentUserId} />,
    },
    { key: "database", label: "Database", render: ({ entry }) => databaseName(entry.database) },
    {
      key: "lastModified",
      label: t("last_modified"),
      sortable: true,
      render: ({ entry }) => formatTimestamp(entry.lastModified),
    },
    {
      key: "size",
      label: t("size"),
      sortable: true,
      render: ({ entry }) => formatSize(entry.size),
    },
  ].filter(Boolean);
}

export default function DiagramTable({
  entries,
  sort,
  onSort,
  selectedDiagramId,
  onSelect,
  showType,
  showOwner,
  currentUserId,
}) {
  const columns = useColumns({ showType, showOwner, currentUserId });

  return (
    <table className="w-full text-left border-separate border-spacing-x-0">
      <thead>
        <tr>
          {columns.map((column) =>
            column.sortable ? (
              <SortableHeader
                key={column.key}
                label={column.label}
                sortKey={column.key}
                sort={sort}
                onSort={onSort}
                className="sticky top-0 z-10 py-2 px-3 border-b border-zinc-200 dark:border-zinc-700 sidesheet-theme"
              />
            ) : (
              <th
                key={column.key}
                className="sticky top-0 z-10 py-2 px-3 border-b border-zinc-200 dark:border-zinc-700 sidesheet-theme"
              >
                {column.label}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const selected = selectedDiagramId === entry.diagramId;
          return (
            <tr
              key={`${entry.source}-${entry.diagramId}`}
              className={`cursor-pointer ${selected ? "bg-blue-300/30" : "hover-1"}`}
              onClick={() => onSelect(entry.diagramId)}
            >
              {columns.map((column) => (
                <td key={column.key} className="py-2 px-3">
                  {column.render({ entry })}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
