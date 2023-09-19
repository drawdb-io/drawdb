import { React, useContext } from "react";
import { Tabs } from "@douyinfe/semi-ui";
import TableOverview from "./table_overview";
import ReferenceOverview from "./reference_overview";
import AreaOverview from "./area_overview";
import { Tab } from "../data/data";
import { LayoutContext, TabContext } from "../pages/editor";
import NotesOverview from "./notes_overview";
import Issues from "./issues";
import TypesOverview from "./types_overview";

const EditorPanel = (props) => {
  const { tab, setTab } = useContext(TabContext);
  const { layout } = useContext(LayoutContext);

  const tabList = [
    { tab: "Tables", itemKey: Tab.tables },
    { tab: "Relationships", itemKey: Tab.relationships },
    { tab: "Subject Areas", itemKey: Tab.subject_areas },
    { tab: "Notes", itemKey: Tab.notes },
    { tab: "Types", itemKey: Tab.types },
  ];
  const contentList = [
    <TableOverview />,
    <ReferenceOverview />,
    <AreaOverview />,
    <NotesOverview />,
    <TypesOverview />,
  ];

  return (
    <div className="flex h-full">
      <div
        className="flex flex-col h-full relative border-r border-color"
        style={{ width: `${props.width}px` }}
      >
        <div className="h-full flex-1 overflow-y-auto">
          <Tabs
            type="card"
            activeKey={tab}
            tabList={tabList}
            onChange={(key) => {
              setTab(key);
            }}
            collapsible
          >
            <div className="p-2">{contentList[parseInt(tab) - 1]}</div>
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
          props.resize ? "bg-semi-grey-2" : ""
        }`}
        onMouseDown={() => props.setResize(true)}
      >
        <div className="w-1 border-x border-color h-1/6" />
      </div>
    </div>
  );
};

export default EditorPanel;
