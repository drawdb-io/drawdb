import { useEffect, useState, useRef } from "react";
import { Cardinality, ObjectType, Tab } from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { cn } from "../../utils/cn";

export default function Relationship({ data }) {
  const [editing, setEditing] = useState(false);
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const pathRef = useRef();

  useEffect(() => {
    setEditing(data.id === selectedElement.id);
  }, [data.id, selectedElement.id]);

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (data.cardinality) {
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = "n";
      cardinalityEnd = "1";
      break;
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = "n";
      break;
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;

  const cardinalityOffset = 28;

  if (pathRef.current) {
    const pathLength = pathRef.current.getTotalLength();
    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;
    const point2 = pathRef.current.getPointAtLength(
      pathLength - cardinalityOffset,
    );
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;
  }

  const edit = () => {
    setEditing(true);
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  const editingPathClass = cn("group-hover:stroke-sky-700", {
    "stroke-sky-700": editing,
  });
  const editingCircleClass = cn("group-hover:fill-sky-700", {
    "fill-sky-700": editing,
  });

  return (
    <g className="select-none group cursor-pointer" onDoubleClick={edit}>
      <path
        ref={pathRef}
        d={calcPath(
          {
            ...data,
            startTable: {
              x: tables[data.startTableId].x,
              y: tables[data.startTableId].y,
            },
            endTable: {
              x: tables[data.endTableId].x,
              y: tables[data.endTableId].y,
            },
          },
          settings.tableWidth,
        )}
        stroke="gray"
        className={editingPathClass}
        fill="none"
        strokeWidth={2}
      />
      {pathRef.current && settings.showCardinality && (
        <>
          <circle
            cx={cardinalityStartX}
            cy={cardinalityStartY}
            r="12"
            fill="grey"
            className={editingCircleClass}
          />
          <text
            x={cardinalityStartX}
            y={cardinalityStartY}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityStart}
          </text>
          <circle
            cx={cardinalityEndX}
            cy={cardinalityEndY}
            r="12"
            fill="grey"
            className={editingCircleClass}
          />
          <text
            x={cardinalityEndX}
            y={cardinalityEndY}
            fill="white"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityEnd}
          </text>
        </>
      )}
    </g>
  );
}
