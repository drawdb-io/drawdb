import { Tabs } from "@douyinfe/semi-ui";
import { Tab } from "../../data/constants";
import { useLayout, useSelect } from "../../hooks";
import RelationshipsTab from "./RelationshipsTab/RelationshipsTab";
import TypesTab from "./TypesTab/TypesTab";
import Issues from "./Issues";
import AreasTab from "./AreasTab/AreasTab";
import NotesTab from "./NotesTab/NotesTab";
import TablesTab from "./TablesTab/TablesTab";
import {useTranslation} from "react-i18next";

export default function SidePanel({ width, resize, setResize }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();

  const tabList = [
    { tab: t("Page.editor.SidePanel.Tables.val"), itemKey: Tab.TABLES },
    { tab: t("Page.editor.SidePanel.Relationships.val"), itemKey: Tab.RELATIONSHIPS },
    { tab: t("Page.editor.SidePanel.Subject Areas.val"), itemKey: Tab.AREAS },
    { tab: t("Page.editor.SidePanel.Notes.val"), itemKey: Tab.NOTES },
    { tab: t("Page.editor.SidePanel.Types.val"), itemKey: Tab.TYPES },
  ];

  const contentList = [
    <TablesTab key="tables" />,
    <RelationshipsTab key="relationships" />,
    <AreasTab key="areas" />,
    <NotesTab key="notes" />,
    <TypesTab key="types" />,
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
            tabList={tabList}
            onChange={(key) =>
              setSelectedElement((prev) => ({ ...prev, currentTab: key }))
            }
            collapsible
          >
            <div className="p-2">
              {contentList[parseInt(selectedElement.currentTab) - 1]}
            </div>
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
