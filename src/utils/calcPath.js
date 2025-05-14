import { tableFieldHeight, tableHeaderHeight } from "../data/constants";

export function calcPath(r, startTableWidth = 200, endTableWidth = 200, zoom = 1) {
  const startWidth = startTableWidth * zoom;
  const endWidth = endTableWidth * zoom;
  let x1 = r.startTable.x;
  let y1 =
    r.startTable.y +
    r.startFieldId * tableFieldHeight +
    tableHeaderHeight +
    tableFieldHeight / 2;
  let x2 = r.endTable.x;
  let y2 =
    r.endTable.y +
    r.endFieldId * tableFieldHeight +
    tableHeaderHeight +
    tableFieldHeight / 2;

  let radius = 10 * zoom;
  const midX = (x2 + x1 + startWidth) / 2;
  const endX = x2 + startWidth < x1 ? x2 + startWidth : x2;

  if (Math.abs(y1 - y2) <= 36 * zoom) {
    radius = Math.abs(y2 - y1) / 3;
    if (radius <= 2) {
      if (x1 + startWidth <= x2) return `M ${x1 + startWidth} ${y1} L ${x2} ${y2 + 0.1}`;
      else if (x2 + endWidth < x1)
        return `M ${x1} ${y1} L ${x2 + endWidth} ${y2 + 0.1}`;
    }
  }

  if (y1 <= y2) {
    if (x1 + startWidth <= x2) {
      return `M ${x1 + startWidth} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x1 >= x2 && x1+startWidth <= x2+endWidth) {
      if (x1+(startWidth/2) <= x2+(endWidth/2)) {
        return `M ${x1} ${y1} L ${
          x1 - radius - (x1-x2)
        } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius - (x1-x2)} ${
          y1 + radius
        } L ${x1 - radius - radius - (x1-x2)} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
          x1 - radius - (x1-x2)
        } ${y2} L ${x2} ${y2}`;
      } else {
        return `M ${x1+startWidth} ${y1} L ${
          x2 + endWidth + radius
        } ${y1} A ${radius} ${radius} 0 0 1 ${x2 + endWidth + radius + radius} ${
          y1 + radius
        } L ${x2 + endWidth + radius + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
          x2 + endWidth + radius
        } ${y2} L ${x2 + endWidth} ${y2}`;
      }
    } else if (x2 + endWidth + 2*radius >= x1 && x2 + endWidth <= x1 + startWidth) {
      return `M ${x1 + startWidth} ${y1} L ${
        x2 + endWidth + ((x1+startWidth)-(x2+endWidth)) + radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 + endWidth + radius + ((x1+startWidth)-(x2+endWidth)) + radius} ${
        y1 + radius
      } L ${x2 + endWidth + radius + ((x1+startWidth)-(x2+endWidth)) + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
        x2 + endWidth + ((x1+startWidth)-(x2+endWidth)) + radius
      } ${y2} L ${x2 + endWidth} ${y2}`;
    } else if (x2 <= x1 + startWidth && x1 <= x2) {
      return `M ${x1} ${y1} L ${
        x2 - radius - (x2-x1)
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 - radius - radius - (x2-x1)} ${
        y1 + radius
      } L ${x2 - radius - radius - (x2-x1)} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
        x2 - radius - (x2-x1)
      } ${y2} L ${x2} ${y2}`;
    } else if (x2 + startWidth <= x1) {
      return `M ${x1} ${y1} L ${
        x1 - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y2} L ${x2+endWidth} ${y2}`;
    }
    return `M ${x1} ${y1} L ${
      x1 - radius
    } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
      y2 - radius
    } A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y2} L ${x2+endWidth} ${y2}`;

  } else {



    if (x1 + startWidth <= x2) {
      return `M ${x1 + startWidth} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x1 >= x2 && x1+startWidth <= x2+endWidth) {
      if (x1+(startWidth/2) <= x2+(endWidth/2)) {
        return `M ${x1} ${y1} L ${
          x1 - radius - (x1-x2)
        } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - (x1-x2)} ${
          y1 - radius
        } L ${x1 - radius - radius - (x1-x2)} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
          x1 - radius - (x1-x2)
        } ${y2} L ${x2} ${y2}`;
      } else {
        return `M ${x1+startWidth} ${y1} L ${
          x2 + endWidth + radius
        } ${y1} A ${radius} ${radius} 0 0 0 ${x2 + endWidth + radius + radius} ${
          y1 - radius
        } L ${x2 + endWidth + radius + radius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
          x2 + endWidth + radius
        } ${y2} L ${x2 + endWidth} ${y2}`;
      }
    } else if (x2 + endWidth + 2*radius >= x1 && x2 + endWidth <= x1 + startWidth) {
      return `M ${x1 + startWidth} ${y1} L ${
        x2 + endWidth + ((x1+startWidth)-(x2+endWidth)) + radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 + endWidth + radius + ((x1+startWidth)-(x2+endWidth)) + radius} ${
        y1 - radius
      } L ${x2 + endWidth + radius + ((x1+startWidth)-(x2+endWidth)) + radius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${
        x2 + endWidth + ((x1+startWidth)-(x2+endWidth)) + radius
      } ${y2} L ${x2 + endWidth} ${y2}`;
    } else if (x2 <= x1 + startWidth && x1 <= x2) {
      return `M ${x1} ${y1} L ${
        x2 - radius - (x2-x1)
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 - radius - radius - (x2-x1)} ${
        y1 - radius
      } L ${x2 - radius - radius - (x2-x1)} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${
        x2 - radius - (x2-x1)
      } ${y2} L ${x2} ${y2}`;
    } else if (x2 + startWidth <= x1) {
      return `M ${x1} ${y1} L ${
        x1 - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 0 ${x1 - radius - radius - radius} ${y2} L ${x2+endWidth} ${y2}`;
    }
    return `M ${x1} ${y1} L ${
      x1 - radius
    } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
      y2 + radius
    } A ${radius} ${radius} 0 0 0 ${x1 - radius - radius - radius} ${y2} L ${x2+endWidth} ${y2}`;
  }
}
