import { React, useContext, useState } from "react";
import { Button } from "@douyinfe/semi-ui";
import { IconEdit } from "@douyinfe/semi-icons";
import { Tab } from "../data/data";
import { LayoutContext, TabContext } from "../pages/editor";

export default function Area(props) {
  const [hovered, setHovered] = useState(false);
  const { layout } = useContext(LayoutContext);
  const { tab, setTab } = useContext(TabContext);

  const handleMouseDown = (e, dir) => {
    props.setResize({ id: props.areaData.id, dir: dir });
    props.setInitCoords({
      x: props.areaData.x,
      y: props.areaData.y,
      width: props.areaData.width,
      height: props.areaData.height,
      mouseX: e.clientX,
      mouseY: e.clientY,
    });
  };

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <foreignObject
        key={props.areaData.id}
        x={props.areaData.x}
        y={props.areaData.y}
        width={props.areaData.width > 0 ? props.areaData.width : 0}
        height={props.areaData.height > 0 ? props.areaData.height : 0}
        onMouseDown={props.onMouseDown}
      >
        <div
          className={`${
            hovered
              ? "border-4 border-dashed border-[#5891db]"
              : "border-2 border-slate-400"
          } w-full h-full cursor-move rounded relative`}
        >
          <div
            className="opacity-40 w-fill p-2 h-full"
            style={{ backgroundColor: props.areaData.color }}
          />
        </div>
        <div className="text-gray-900 absolute top-2 left-3 select-none">
          {props.areaData.name}
        </div>
        {hovered && (
          <div className="absolute top-2 right-3">
            <Button
              icon={<IconEdit />}
              size="small"
              theme="solid"
              style={{
                backgroundColor: "#2f68ad",
                opacity: "0.7",
              }}
              onClick={() => {
                if (layout.sidebar) {
                  setTab(Tab.subject_areas);
                  if (tab !== Tab.subject_areas) return;
                  document
                    .getElementById(`scroll_area_${props.areaData.id}`)
                    .scrollIntoView({ behavior: "smooth" });
                }
              }}
            ></Button>
          </div>
        )}
      </foreignObject>
      {hovered && (
        <>
          <circle
            cx={props.areaData.x}
            cy={props.areaData.y}
            r={6}
            fill="white"
            stroke="#5891db"
            strokeWidth={3}
            cursor="nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "tl")}
          />
          <circle
            cx={props.areaData.x + props.areaData.width}
            cy={props.areaData.y}
            r={6}
            fill="white"
            stroke="#5891db"
            strokeWidth={3}
            cursor="nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "tr")}
          />
          <circle
            cx={props.areaData.x}
            cy={props.areaData.y + props.areaData.height}
            r={6}
            fill="white"
            stroke="#5891db"
            strokeWidth={3}
            cursor="nesw-resize"
            onMouseDown={(e) => handleMouseDown(e, "bl")}
          />
          <circle
            cx={props.areaData.x + props.areaData.width}
            cy={props.areaData.y + props.areaData.height}
            r={6}
            fill="white"
            stroke="#5891db"
            strokeWidth={3}
            cursor="nwse-resize"
            onMouseDown={(e) => handleMouseDown(e, "br")}
          />
        </>
      )}
    </g>
  );
}
