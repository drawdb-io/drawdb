import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { Tab } from "../../data/constants";
import { useLayout, useSelect, useDiagram } from "../../hooks";
import RelationshipsTab from "./RelationshipsTab/RelationshipsTab";
import TypesTab from "./TypesTab/TypesTab";
import Issues from "./Issues";
import AreasTab from "./AreasTab/AreasTab";
import NotesTab from "./NotesTab/NotesTab";
import TablesTab from "./TablesTab/TablesTab";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { databases } from "../../data/databases";
import EnumsTab from "./EnumsTab/EnumsTab";

export default function SidePanel({ width, resize, setResize }) {
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { database } = useDiagram();
  const { t } = useTranslation();

  const tabList = useMemo(() => {
    const tabs = [
      { tab: t("tables"), itemKey: Tab.TABLES, component: <TablesTab /> },
      {
        tab: t("relationships"),
        itemKey: Tab.RELATIONSHIPS,
        component: <RelationshipsTab />,
      },
      { tab: t("subject_areas"), itemKey: Tab.AREAS, component: <AreasTab /> },
      { tab: t("notes"), itemKey: Tab.NOTES, component: <NotesTab /> },
    ];

    if (databases[database].hasTypes) {
      tabs.push({
        tab: t("types"),
        itemKey: Tab.TYPES,
        component: <TypesTab />,
      });
    }

    if (databases[database].hasEnums) {
      tabs.push({
        tab: t("enums"),
        itemKey: Tab.ENUMS,
        component: <EnumsTab />,
      });
    }

    return tabs;
  }, [t, database]);

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
        onPointerDown={(e) => e.isPrimary && setResize(true)}
      >
        <div className="w-1 border-x border-color h-1/6" />
      </div>
    </div>
  );
}
