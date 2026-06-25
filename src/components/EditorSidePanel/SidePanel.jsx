import { useMemo } from "react";
import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { IconCode, IconList } from "@douyinfe/semi-icons";
import { IconTable, IconRelationship } from "../../icons";
import { Tab } from "../../data/constants";
import {
  useLayout,
  useSelect,
  useDiagram,
  useAreas,
  useNotes,
  useEnums,
  useTypes,
  useSettings,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import RelationshipsTab from "./RelationshipsTab/RelationshipsTab";
import TypesTab from "./TypesTab/TypesTab";
import Issues from "./Issues";
import AreasTab from "./AreasTab/AreasTab";
import NotesTab from "./NotesTab/NotesTab";
import TablesTab from "./TablesTab/TablesTab";
import { databases } from "../../data/databases";
import EnumsTab from "./EnumsTab/EnumsTab";
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";
import DBMLEditor from "./DBMLEditor";

export default function SidePanel({ width, resize, setResize }) {
  const { layout, setLayout } = useLayout();
  const { settings } = useSettings();
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

  const setDbmlEditor = (value) => {
    setLayout((prev) => ({ ...prev, dbmlEditor: value }));
  };

  return (
    <div className="flex h-full">
      <div
        className={`flex flex-col h-full relative ${layout.dbmlEditor ? "" : "pt-2"}`}
        style={{ width: `${width}px` }}
      >
        <div className="h-full flex-1 overflow-y-auto">
          {layout.dbmlEditor ? (
            <DBMLEditor />
          ) : (
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
                  <TabPane
                    tab={tab.tab}
                    itemKey={tab.itemKey}
                    key={tab.itemKey}
                  >
                    <div className="p-2">{tab.component}</div>
                  </TabPane>
                ))}
            </Tabs>
          )}
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-t border-color">
          <div className="flex items-center gap-3 text-xs text-color ms-2 opacity-60">
            <div className="flex items-center gap-1.5" title={t("tables")}>
              <IconTable />
              <span>{tablesCount}</span>
            </div>
            <div
              className="flex items-center gap-1.5"
              title={t("relationships")}
            >
              <IconRelationship />
              <span>{relationshipsCount}</span>
            </div>
          </div>
          <div className="segmented-bg inline-flex items-center p-0.5 rounded-sm text-xs">
            <button
              className={`segmented-item flex items-center gap-1.5 px-2 py-0.5 rounded-sm transition-all ${
                !layout.dbmlEditor
                  ? "segmented-item-active font-medium shadow-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
              onClick={() => setDbmlEditor(false)}
            >
              <IconList size="small" />
              {t("structure")}
            </button>
            <button
              className={`segmented-item flex items-center gap-1 px-2 py-0.5 rounded-sm transition-all ${
                layout.dbmlEditor
                  ? "segmented-item-active font-medium shadow-sm"
                  : "opacity-60 hover:opacity-100"
              }`}
              onClick={() => setDbmlEditor(true)}
            >
              <IconCode size="small" />
              {t("code")}
            </button>
          </div>
        </div>
        {layout.issues && (
          <div className="mt-auto border-t-2 border-color shadow-inner">
            <Issues />
          </div>
        )}
      </div>
      <div
        className={`group relative h-full w-0.5 cursor-col-resize flex justify-center ${settings.mode === "dark" ? "bg-zinc-800" : "bg-zinc-100"}`}
        onPointerDown={(e) => e.isPrimary && setResize(true)}
      >
        <div
          className={`h-full transition-all w-full ${
            resize ? "bg-blue-500" : "group-hover:bg-blue-500"
          }`}
        />
      </div>
    </div>
  );
}
