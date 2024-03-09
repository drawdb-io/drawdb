import { useContext } from "react";
import { Tabs } from "@douyinfe/semi-ui";
import TableOverview from "./TableOverview";
import ReferenceOverview from "./ReferenceOverview";
import AreaOverview from "./AreaOverview";
import { Tab } from "../data/data";
import { TabContext } from "../pages/Editor";
import NotesOverview from "./NotesOverview";
import Issues from "./Issues";
import TypesOverview from "./TypesOverview";
import useLayout from "../hooks/useLayout";

const SidePanel = (props) => {
  const { tab, setTab } = useContext(TabContext);
  const { layout } = useLayout();

  const tabList = [
    { tab: "Tables", itemKey: Tab.tables },
    { tab: "Relationships", itemKey: Tab.relationships },
    { tab: "Subject Areas", itemKey: Tab.subject_areas },
    { tab: "Notes", itemKey: Tab.notes },
    { tab: "Types", itemKey: Tab.types },
  ];
  const contentList = [
    <TableOverview key={1}/>,
    <ReferenceOverview key={2}/>,
    <AreaOverview key={3}/>,
    <NotesOverview key={4}/>,
    <TypesOverview key={5}/>,
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

export default SidePanel;
