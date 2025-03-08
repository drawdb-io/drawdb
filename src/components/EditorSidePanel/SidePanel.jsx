import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { Tab } from "../../data/constants";
import {
  useLayout,
  useSelect,
  useDiagram,
  useAreas,
  useNotes,
  useEnums,
  useTypes,
} from "../../hooks";
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
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";

export default function SidePanel({ width, resize, setResize }) {
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { database, tablesCount, relationshipsCount } = useDiagram();
  const { areasCount } = useAreas();
  const { notesCount } = useNotes();
  const { typesCount } = useTypes();
  const { enumsCount } = useEnums();
  const { t } = useTranslation();

  const tabList = useMemo(() => {
    const tabs = [
      {
        tab: `${t("tables")} (${tablesCount})`,
        itemKey: Tab.TABLES,
        component: <TablesTab />,
      },
      {
        tab: `${t("relationships")} (${relationshipsCount})`,
        itemKey: Tab.RELATIONSHIPS,
        component: <RelationshipsTab />,
      },
      {
        tab: `${t("subject_areas")} (${areasCount})`,
        itemKey: Tab.AREAS,
        component: <AreasTab />,
      },
      {
        tab: `${t("notes")} (${notesCount})`,
        itemKey: Tab.NOTES,
        component: <NotesTab />,
      },
    ];

    if (databases[database].hasTypes) {
      tabs.push({
        tab: `${t("types")} (${typesCount})`,
        itemKey: Tab.TYPES,
        component: <TypesTab />,
      });
    }

    if (databases[database].hasEnums) {
      tabs.push({
        tab: `${t("enums")} (${enumsCount})`,
        itemKey: Tab.ENUMS,
        component: <EnumsTab />,
      });
    }

    return isRtl(i18n.language) ? tabs.reverse() : tabs;
  }, [
    t,
    database,
    tablesCount,
    relationshipsCount,
    areasCount,
    typesCount,
    enumsCount,
    notesCount,
  ]);

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
            keepDOM={false}
            onChange={(key) =>
              setSelectedElement((prev) => ({ ...prev, currentTab: key }))
            }
            collapsible
            tabBarStyle={{ direction: "ltr" }}
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
