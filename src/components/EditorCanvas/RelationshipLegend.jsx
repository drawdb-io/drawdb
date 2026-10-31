import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";

const legendEdgeMargin = 8;
const legendMinimumWidth = 220;
const legendMinimumHeight = 120;

// RelationshipLegend lists each short label beside the relationship it stands
// for, sorted by label. We render it inside the #canvas element, so the image
// and PDF exports include it. The person can drag it by its title bar, resize
// it from its lower right corner and collapse it to the title bar. We save its
// place and size in the settings, so it comes back where they left it.
export default function RelationshipLegend({
  relationships,
  tablesById,
  shortLabels,
}) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();
  const legendRef = useRef(null);
  const dragRef = useRef(null);
  const [draggedPlacement, setDraggedPlacement] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  const savedPlacement = settings.relationshipLegendPlacement;
  const placement = draggedPlacement ?? savedPlacement;

  const legendRows = useMemo(
    () =>
      relationships
        .map((relationship) => {
          const childTable = tablesById.get(relationship.startTableId);
          const parentTable = tablesById.get(relationship.endTableId);
          const foreignKeyFieldId =
            relationship.fields?.[0]?.startFieldId ?? relationship.startFieldId;
          const foreignKeyField = childTable?.fields?.find(
            (f) => f.id === foreignKeyFieldId,
          );
          return {
            relationshipId: relationship.id,
            shortLabel: shortLabels.get(relationship.id) ?? "",
            fullName: relationship.name,
            columnPath: `${childTable?.name}.${foreignKeyField?.name ?? "?"} → ${parentTable?.name}`,
          };
        })
        .sort((a, b) => a.shortLabel.localeCompare(b.shortLabel)),
    [relationships, tablesById, shortLabels],
  );

  if (legendRows.length === 0) return null;

  const readCurrentPlacement = () => {
    const legend = legendRef.current;
    return {
      left: legend.offsetLeft,
      top: legend.offsetTop,
      width: legend.offsetWidth,
      height: collapsed ? placement?.height : legend.offsetHeight,
    };
  };

  const savePlacement = (nextPlacement) =>
    setSettings((prev) => ({
      ...prev,
      relationshipLegendPlacement: nextPlacement,
    }));

  // The browser's own resize grip changes the size. Before the first resize we
  // pin the legend by its top left corner, so the grip grows it down and to the
  // right. We save the new size when the person lets go of the pointer anywhere
  // on the page.
  const onLegendPointerDown = (e) => {
    e.stopPropagation();
    if (e.target.closest("[data-legend-title]")) return;
    if (!savedPlacement && !collapsed) savePlacement(readCurrentPlacement());
    window.addEventListener(
      "pointerup",
      () => {
        if (!dragRef.current && legendRef.current && !collapsed) {
          savePlacement(readCurrentPlacement());
        }
      },
      { once: true },
    );
  };

  const onTitlePointerDown = (e) => {
    if (e.target.closest("button")) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const startPlacement = readCurrentPlacement();
    dragRef.current = {
      startPlacement,
      startPointerX: e.clientX,
      startPointerY: e.clientY,
    };
    setDraggedPlacement(startPlacement);
  };
  const onTitlePointerMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const container = legendRef.current.offsetParent;
    const maximumLeft =
      container.clientWidth - drag.startPlacement.width - legendEdgeMargin;
    const maximumTop = container.clientHeight - 40 - legendEdgeMargin;
    setDraggedPlacement({
      ...drag.startPlacement,
      left: Math.max(
        legendEdgeMargin,
        Math.min(
          maximumLeft,
          drag.startPlacement.left + e.clientX - drag.startPointerX,
        ),
      ),
      top: Math.max(
        legendEdgeMargin,
        Math.min(
          maximumTop,
          drag.startPlacement.top + e.clientY - drag.startPointerY,
        ),
      ),
    });
  };
  const onTitlePointerUp = (e) => {
    if (!dragRef.current) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    dragRef.current = null;
    if (draggedPlacement) savePlacement(draggedPlacement);
    setDraggedPlacement(null);
  };

  const placementStyle = placement
    ? {
        left: placement.left,
        top: placement.top,
        width: placement.width,
        height: collapsed ? undefined : placement.height,
      }
    : { left: 16, bottom: 16, width: 384, height: collapsed ? undefined : 320 };

  return (
    <div
      ref={legendRef}
      className={`absolute z-10 flex flex-col overflow-hidden rounded-lg border border-color bg-[rgba(var(--semi-grey-0),1)] shadow-md text-xs ${
        collapsed ? "" : "resize"
      }`}
      style={{
        ...placementStyle,
        minWidth: legendMinimumWidth,
        minHeight: collapsed ? undefined : legendMinimumHeight,
        maxWidth: `calc(100% - ${2 * legendEdgeMargin}px)`,
        maxHeight: `calc(100% - ${2 * legendEdgeMargin}px)`,
      }}
      onPointerDown={onLegendPointerDown}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        data-legend-title
        className="flex items-center justify-between gap-2 px-3 py-2 border-b border-color font-semibold cursor-move select-none touch-none"
        onPointerDown={onTitlePointerDown}
        onPointerMove={onTitlePointerMove}
        onPointerUp={onTitlePointerUp}
        onPointerCancel={onTitlePointerUp}
      >
        <span>{t("relationship_legend")}</span>
        <span className="flex items-center gap-1">
          <button
            className="px-1 opacity-60 hover:opacity-100"
            title={t(collapsed ? "expand_legend" : "collapse_legend")}
            onClick={() => setCollapsed((wasCollapsed) => !wasCollapsed)}
          >
            <i
              className={`fa-solid ${collapsed ? "fa-chevron-up" : "fa-chevron-down"}`}
            />
          </button>
          <button
            className="px-1 opacity-60 hover:opacity-100"
            title={t("close")}
            onClick={() =>
              setSettings((prev) => ({
                ...prev,
                showRelationshipLegend: false,
              }))
            }
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </span>
      </div>
      {!collapsed && (
        <div className="overflow-auto px-3 py-2 grow">
          <table className="border-separate border-spacing-x-3 border-spacing-y-1 -mx-3">
            <tbody>
              {legendRows.map((row) => (
                <tr key={row.relationshipId} className="align-top">
                  <td className="font-mono font-semibold whitespace-nowrap">
                    {row.shortLabel}
                  </td>
                  <td>
                    <div className="break-all">{row.fullName}</div>
                    <div className="opacity-60 break-all">{row.columnPath}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
