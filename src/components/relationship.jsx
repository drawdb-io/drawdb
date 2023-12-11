import { React, useState } from "react";
import { calcPath } from "../utils";

export default function Relationship(props) {
  const [hovered, setHovered] = useState(false);

  return (
    <g>
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
        d={calcPath(
          props.data.startX,
          props.data.endX,
          props.data.startY,
          props.data.endY
        )}
        stroke={hovered ? "blue" : "gray"}
        fill="none"
        strokeWidth={2}
        filter="url(#shadow)"
        cursor="pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    </g>
  );
}
