import { useMemo } from "react";
import { Tab, ObjectType } from "../../data/constants";
import {
  IconMore,
  IconDeleteStroked,
  IconEditStroked,
  IconCopyStroked,
  IconLock,
  IconUnlock,
} from "@douyinfe/semi-icons";
import { nanoid } from "nanoid";
import {
  Popover,
  Button,
  ButtonGroup,
  SideSheet,
  Divider,
} from "@douyinfe/semi-ui";
import {
  useLayout,
  useSettings,
  useDiagram,
  useSelect,
  useViews,
} from "../../hooks";
import ViewInfo from "../EditorSidePanel/ViewsTab/ViewInfo";
import { useTranslation } from "react-i18next";
import { resolveType } from "../../utils/customTypes";
import { getViewHeight, resolveViewColumns } from "../../utils/views";

export default function View({ viewData, onPointerDown }) {
  const { layout } = useLayout();
  const { database, tables } = useDiagram();
  const { views, addView, deleteView, updateView } = useViews();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const {
    selectedElement,
    setSelectedElement,
    bulkSelectedElements,
    setBulkSelectedElements,
  } = useSelect();

  const borderColor = useMemo(
    () => (settings.mode === "light" ? "border-zinc-300" : "border-zinc-600"),
    [settings.mode],
  );

  const columns = useMemo(
    () => resolveViewColumns(viewData, tables),
    [viewData, tables],
  );

  const height = getViewHeight(
    viewData,
    columns,
    settings.tableWidth,
    settings.showComments,
  );

  const isSelected = useMemo(() => {
    return (
      (selectedElement.id === viewData.id &&
        selectedElement.element === ObjectType.VIEW) ||
      bulkSelectedElements.some(
        (e) => e.type === ObjectType.VIEW && e.id === viewData.id,
      )
    );
  }, [selectedElement, viewData, bulkSelectedElements]);

  const lockUnlockView = (e) => {
    const locking = !viewData.locked;
    updateView(viewData.id, { locked: locking });

    if (locking) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.NONE,
        id: -1,
        open: false,
      }));
      setBulkSelectedElements((prev) =>
        prev.filter(
          (el) => el.id !== viewData.id || el.type !== ObjectType.VIEW,
        ),
      );
      return;
    }

    const elementInBulk = {
      id: viewData.id,
      type: ObjectType.VIEW,
      initialCoords: { x: viewData.x, y: viewData.y },
      currentCoords: { x: viewData.x, y: viewData.y },
    };
    if (e.ctrlKey || e.metaKey) {
      setBulkSelectedElements((prev) => [...prev, elementInBulk]);
    } else {
      setBulkSelectedElements([elementInBulk]);
    }
    setSelectedElement((prev) => ({
      ...prev,
      element: ObjectType.VIEW,
      id: viewData.id,
      open: false,
    }));
  };

  const duplicateView = () => {
    if (layout.readOnly) return;
    addView({
      view: {
        ...viewData,
        id: nanoid(),
        name: `${viewData.name}_copy`,
        x: viewData.x + 24,
        y: viewData.y + 24,
        columns: viewData.columns.map((c) => ({ ...c, id: nanoid() })),
        joins: viewData.joins.map((j) => ({ ...j, id: nanoid() })),
        conditions: viewData.conditions.map((c) => ({ ...c, id: nanoid() })),
      },
      index: views.length,
    });
  };

  const openEditor = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.VIEW,
        id: viewData.id,
        open: true,
      }));
      return;
    }
    setSelectedElement((prev) => ({
      ...prev,
      currentTab: Tab.VIEWS,
      element: ObjectType.VIEW,
      id: viewData.id,
      open: true,
    }));
    if (selectedElement.currentTab !== Tab.VIEWS) return;
    document
      .getElementById(`scroll_view_${viewData.id}`)
      ?.scrollIntoView({ behavior: "smooth" });
  };

  if (viewData.hidden) return null;

  return (
    <>
      <foreignObject
        key={viewData.id}
        x={viewData.x}
        y={viewData.y}
        width={settings.tableWidth}
        height={height}
        className="group drop-shadow-lg rounded-md cursor-move"
        onPointerDown={onPointerDown}
      >
        <div
          onDoubleClick={openEditor}
          className={`border-2 border-dashed hover:border-blue-500 select-none rounded-lg w-full ${
            settings.mode === "light"
              ? "bg-zinc-100 text-zinc-800"
              : "bg-zinc-800 text-zinc-200"
          } ${isSelected ? "border-solid border-blue-500" : borderColor}`}
          style={{ direction: "ltr" }}
        >
          <div
            className="h-[10px] w-full rounded-t-md"
            style={{ backgroundColor: viewData.color }}
          />
          <div
            className={`${
              columns.length === 0 ? "rounded-b-md" : "border-b border-gray-400"
            } ${
              settings.mode === "light" ? "bg-zinc-100" : "bg-zinc-900"
            } ${viewData.comment && settings.showComments ? "pb-3" : ""}`}
          >
            <div className="overflow-hidden font-bold h-[40px] flex justify-between items-center gap-2">
              <div className="px-3 overflow-hidden text-ellipsis whitespace-nowrap min-w-0 flex-1">
                {viewData.name}
              </div>
              <div className="hidden group-hover:flex items-center shrink-0 pe-2">
                <ButtonGroup
                  type="tertiary"
                  size="small"
                  aria-label="View actions"
                >
                  <Button
                    size="small"
                    type="tertiary"
                    title={viewData.locked ? t("unlock") : t("lock")}
                    icon={
                      viewData.locked ? (
                        <IconLock size="small" />
                      ) : (
                        <IconUnlock size="small" />
                      )
                    }
                    disabled={layout.readOnly}
                    onClick={lockUnlockView}
                  />
                  <Popover
                    key={viewData.id}
                    content={
                      <div className="popover-theme flex flex-col py-1 min-w-[160px]">
                        <Button
                          icon={<IconEditStroked />}
                          type="tertiary"
                          theme="borderless"
                          block
                          style={{ justifyContent: "flex-start" }}
                          onClick={openEditor}
                        >
                          {t("edit")}
                        </Button>
                        <Button
                          icon={<IconCopyStroked />}
                          type="tertiary"
                          theme="borderless"
                          block
                          style={{ justifyContent: "flex-start" }}
                          onClick={duplicateView}
                          disabled={layout.readOnly}
                        >
                          {t("duplicate")}
                        </Button>
                        <Divider className="!my-1" />
                        <Button
                          icon={<IconDeleteStroked />}
                          type="danger"
                          theme="borderless"
                          block
                          style={{ justifyContent: "flex-start" }}
                          onClick={() => deleteView(viewData.id)}
                          disabled={layout.readOnly}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    }
                    position="rightTop"
                    style={{ padding: 8 }}
                    showArrow
                    trigger="click"
                  >
                    <Button
                      size="small"
                      type="tertiary"
                      icon={<IconMore size="small" />}
                      title="See more"
                    />
                  </Popover>
                </ButtonGroup>
              </div>
            </div>
            {viewData.comment && settings.showComments && (
              <div className="text-xs px-3 line-clamp-5">
                {viewData.comment}
              </div>
            )}
          </div>

          {columns.map((column, index) => {
            const resolved = column.type
              ? resolveType(database, column.type)
              : null;
            return (
              <div
                key={column.id ?? index}
                className={`${
                  index === columns.length - 1 ? "" : "border-b border-gray-400"
                } h-[36px] px-3 flex justify-between items-center gap-2 overflow-hidden`}
                title={column.source}
              >
                <span className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {column.name}
                </span>
                {settings.showDataTypes && resolved && (
                  <span
                    className={
                      "shrink-0 font-mono " +
                      (resolved.isCustom ? "" : resolved.color)
                    }
                    style={resolved.isCustom ? { color: resolved.color } : {}}
                  >
                    {column.type +
                      ((resolved.isSized || resolved.hasPrecision) &&
                      column.size
                        ? `(${column.size})`
                        : "")}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </foreignObject>
      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.VIEW &&
          selectedElement.id === viewData.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() =>
          setSelectedElement((prev) => ({ ...prev, open: !prev.open }))
        }
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <ViewInfo data={viewData} />
        </div>
      </SideSheet>
    </>
  );
}
