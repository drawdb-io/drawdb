import { Tabs } from "@douyinfe/semi-ui";
import { Tab } from "../data/constants";
import TableOverview from "./TableOverview";
import ReferenceOverview from "./ReferenceOverview";
import AreaOverview from "./AreaOverview";
import NotesOverview from "./NotesOverview";
import TypesOverview from "./TypesOverview";
import Issues from "./Issues";
import useLayout from "../hooks/useLayout";
import useSelect from "../hooks/useSelect";

export default function SidePanel({ width, resize, setResize }) {
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();

  const tabList = [
    { tab: "Tables", itemKey: Tab.TABLES },
    { tab: "Relationships", itemKey: Tab.RELATIONSHIPS },
    { tab: "Subject Areas", itemKey: Tab.AREAS },
    { tab: "Notes", itemKey: Tab.NOTES },
    { tab: "Types", itemKey: Tab.TYPES },
  ];
  const contentList = [
    <TableOverview key={1} />,
    <ReferenceOverview key={2} />,
    <AreaOverview key={3} />,
    <NotesOverview key={4} />,
    <TypesOverview key={5} />,
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
          resize ? "bg-semi-grey-2" : ""
        }`}
        onMouseDown={() => setResize(true)}
      >
        <div className="w-1 border-x border-color h-1/6" />
      </div>
    </div>
  );
}
