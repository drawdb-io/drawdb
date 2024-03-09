import { useRef, useState } from "react";
import { calcPath } from "../utils";
import { Cardinality } from "../data/data";
import useSettings from "../hooks/useSettings";

export default function Relationship(props) {
  const [hovered, setHovered] = useState(false);
  const { settings } = useSettings();
  const pathRef = useRef();

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (props.data.cardinality) {
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

  const length = 32;

  if (pathRef.current) {
    const pathLength = pathRef.current.getTotalLength();
    const point1 = pathRef.current.getPointAtLength(length);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;
    const point2 = pathRef.current.getPointAtLength(pathLength - length);
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;
  }

  return (
    <g className="select-none">
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="4"
            floodColor="gray"
            floodOpacity="0.3"
          />
        </filter>
      </defs>
      <path
        ref={pathRef}
        d={calcPath(
          props.data.startX,
          props.data.endX,
          props.data.startY,
          props.data.endY,
          props.data.startFieldId,
          props.data.endFieldId
        )}
        stroke={hovered ? "blue" : "gray"}
        fill="none"
        strokeWidth={2}
        filter="url(#shadow)"
        cursor="pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
      {pathRef.current && settings.showCardinality && (
        <>
          <circle
            cx={cardinalityStartX}
            cy={cardinalityStartY}
            r="12"
            fill="grey"
          ></circle>
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
          ></circle>
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
