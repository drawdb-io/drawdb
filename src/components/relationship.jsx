import { React, useState } from "react";

export default function Relationship(props) {
  const [hovered, setHovered] = useState(false);
  const calcPath = (x1, x2, y1, y2) => {
    let r = 16;
    const offsetX = 8;
    const tableWidth = 220;
    const midX = (x2 + x1 + tableWidth) / 2;
    const endX = x2 + tableWidth < x1 ? x2 + tableWidth - offsetX * 2 : x2;

    if (Math.abs(y1 - y2) <= 36) {
      r = Math.abs(y2 - y1) / 3;
      if (r <= 2) {
        if (x1 + tableWidth <= x2)
          return `M ${x1 + tableWidth - 2 * offsetX} ${y1} L ${x2} ${y2}`;
        else if (x2 + tableWidth < x1)
          return `M ${x2 + tableWidth - 2 * offsetX} ${y2} L ${x1} ${y1}`;
      }
    }

    if (y1 <= y2) {
      if (x1 + tableWidth <= x2) {
        return `M ${x1 + tableWidth - offsetX * 2} ${y1} L ${
          midX - r
        } ${y1} A ${r} ${r} 0 0 1 ${midX} ${y1 + r} L ${midX} ${
          y2 - r
        } A ${r} ${r} 0 0 0 ${midX + r} ${y2} L ${endX} ${y2}`;
      } else if (x2 <= x1 + tableWidth && x1 <= x2) {
        return `M ${x1 + tableWidth - 2 * offsetX} ${y1} L ${
          x2 + tableWidth
        } ${y1} A ${r} ${r} 0 0 1 ${x2 + tableWidth + r} ${y1 + r} L ${
          x2 + tableWidth + r
        } ${y2 - r} A ${r} ${r} 0 0 1 ${x2 + tableWidth} ${y2} L ${
          x2 + tableWidth - 2 * offsetX
        } ${y2}`;
      } else if (x2 + tableWidth >= x1 && x2 + tableWidth <= x1 + tableWidth) {
        return `M ${x1} ${y1} L ${x2 - r} ${y1} A ${r} ${r} 0 0 ${0} ${
          x2 - r - r
        } ${y1 + r} L ${x2 - r - r} ${y2 - r} A ${r} ${r} 0 0 0 ${
          x2 - r
        } ${y2} L ${x2} ${y2}`;
      } else {
        return `M ${x1} ${y1} L ${midX + r} ${y1} A ${r} ${r} 0 0 0 ${midX} ${
          y1 + r
        } L ${midX} ${y2 - r} A ${r} ${r} 0 0 1 ${
          midX - r
        } ${y2} L ${endX} ${y2}`;
      }
    } else {
      if (x1 + tableWidth <= x2) {
        return `M ${x1 + tableWidth - offsetX * 2} ${y1} L ${
          midX - r
        } ${y1} A ${r} ${r} 0 0 0 ${midX} ${y1 - r} L ${midX} ${
          y2 + r
        } A ${r} ${r} 0 0 1 ${midX + r} ${y2} L ${endX} ${y2}`;
      } else if (x1 + tableWidth >= x2 && x1 + tableWidth <= x2 + tableWidth) {
        return `M ${x1} ${y1} L ${x1 - r} ${y1} A ${r} ${r} 0 0 1 ${
          x1 - r - r
        } ${y1 - r} L ${x1 - r - r} ${y2 + r} A ${r} ${r} 0 0 1 ${
          x1 - r
        } ${y2} L ${endX} ${y2}`;
      } else if (x1 >= x2 && x1 <= x2 + tableWidth) {
        return `M ${x1 + tableWidth - 2 * offsetX} ${y1} L ${
          x1 + tableWidth - 2 * offsetX + r
        } ${y1} A ${r} ${r} 0 0 0 ${x1 + tableWidth - 2 * offsetX + r + r} ${
          y1 - r
        } L ${x1 + tableWidth - 2 * offsetX + r + r} ${
          y2 + r
        } A ${r} ${r} 0 0 0 ${x1 + tableWidth - 2 * offsetX + r} ${y2} L ${
          x2 + tableWidth - 2 * offsetX
        } ${y2}`;
      } else {
        return `M ${x1} ${y1} L ${midX + r} ${y1} A ${r} ${r} 0 0 1 ${midX} ${
          y1 - r
        } L ${midX} ${y2 + r} A ${r} ${r} 0 0 0 ${
          midX - r
        } ${y2} L ${endX} ${y2}`;
      }
    }
  };

  return (
    <g>
      <defs>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="6"
            floodColor="gray"
            floodOpacity="0.5"
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
