import { Collapse, Button } from "@douyinfe/semi-ui";
import { IconPlus, IconEyeOpened, IconEyeClosed } from "@douyinfe/semi-icons";
import { useLayout, useSelect, useUndoRedo, useViews } from "../../../hooks";
import { Action, ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import SearchBar from "./SearchBar";
import Empty from "../Empty";
import ViewInfo from "./ViewInfo";

export default function ViewsTab() {
  const { views, addView } = useViews();
  const { selectedElement, setSelectedElement } = useSelect();
  const { layout } = useLayout();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-2">
        <SearchBar />
        <div>
          <Button
            block
            icon={<IconPlus />}
            onClick={() => addView()}
            disabled={layout.readOnly}
          >
            {t("add_view")}
          </Button>
        </div>
      </div>
      {views.length === 0 ? (
        <Empty title={t("no_views")} text={t("no_views_text")} />
      ) : (
        <Collapse
          activeKey={
            selectedElement.open && selectedElement.element === ObjectType.VIEW
              ? `${selectedElement.id}`
              : ""
          }
          keepDOM={false}
          lazyRender
          onChange={(k) =>
            setSelectedElement((prev) => ({
              ...prev,
              open: true,
              id: k[0],
              element: ObjectType.VIEW,
            }))
          }
          accordion
        >
          {views.map((view) => (
            <ViewListItem key={view.id} view={view} />
          ))}
        </Collapse>
      )}
    </>
  );
}

function ViewListItem({ view }) {
  const { updateView } = useViews();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { t } = useTranslation();

  const toggleViewVisibility = (e) => {
    e.stopPropagation();
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.VIEW,
        component: "self",
        vid: view.id,
        undo: { hidden: view.hidden },
        redo: { hidden: !view.hidden },
        message: t("edit_view", { viewName: view.name, extra: "[hidden]" }),
      },
    ]);
    setRedoStack([]);
    updateView(view.id, { hidden: !view.hidden });
  };

  return (
    <div id={`scroll_view_${view.id}`}>
      <Collapse.Panel
        className="relative"
        header={
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                {view.name}
              </div>
            </div>
            <Button
              size="small"
              theme="borderless"
              type="tertiary"
              onClick={toggleViewVisibility}
              icon={view.hidden ? <IconEyeClosed /> : <IconEyeOpened />}
              className="me-2"
            />
            <div
              className="w-1 h-full absolute top-0 left-0 bottom-0"
              style={{ backgroundColor: view.color }}
            />
          </div>
        }
        itemKey={`${view.id}`}
      >
        <ViewInfo data={view} />
      </Collapse.Panel>
    </div>
  );
}
