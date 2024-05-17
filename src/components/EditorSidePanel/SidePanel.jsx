import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { Tab } from "../../data/constants";
import { useLayout, useSelect } from "../../hooks";
import RelationshipsTab from "./RelationshipsTab/RelationshipsTab";
import TypesTab from "./TypesTab/TypesTab";
import Issues from "./Issues";
import AreasTab from "./AreasTab/AreasTab";
import NotesTab from "./NotesTab/NotesTab";
import TablesTab from "./TablesTab/TablesTab";
import { useTranslation } from "react-i18next";

export default function SidePanel({ width, resize, setResize }) {
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const tabList = [
    { tab: t("tables"), itemKey: Tab.TABLES, component: <TablesTab /> },
    {
      tab: t("relationships"),
      itemKey: Tab.RELATIONSHIPS,
      component: <RelationshipsTab />,
    },
    { tab: t("subject_areas"), itemKey: Tab.AREAS, component: <AreasTab /> },
    { tab: t("notes"), itemKey: Tab.NOTES, component: <NotesTab /> },
    { tab: t("types"), itemKey: Tab.TYPES, component: <TypesTab /> },
  ];

  return (
    <div className="flex h-full">
      <div
        className="flex flex-col h-full relative border-r border-color"
        style={{ width: `${width}px` }}
      >
        <div className="h-full flex-1 overflow-y-auto">
          <Tabs
            type="card"
            activeKey={selectedElement.currentTab}
            lazyRender
            onChange={(key) =>
              setSelectedElement((prev) => ({ ...prev, currentTab: key }))
            }
            collapsible
          >
            {tabList.length &&
              tabList.map((tab) => (
                <TabPane tab={tab.tab} itemKey={tab.itemKey} key={tab.itemKey}>
                  <div className="p-2">{tab.component}</div>
                </TabPane>
              ))}
          </Tabs>
        </div>
        {layout.issues && (
          <div className="mt-auto border-t-2 border-color shadow-inner">
            <Issues />
          </div>
        )}
      </div>
      <div
        className={`flex justify-center items-center p-1 h-auto hover-2 cursor-col-resize ${
          resize && "bg-semi-grey-2"
        }`}
        onMouseDown={() => setResize(true)}
      >
        <div className="w-1 border-x border-color h-1/6" />
      </div>
    </div>
  );
}
