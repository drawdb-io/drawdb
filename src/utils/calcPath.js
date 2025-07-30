export function calcPath(r, startTableWidth = 200, endTableWidth = 200, zoom = 1) {
  const startWidth = startTableWidth * zoom;
  const endWidth = endTableWidth * zoom;

  let x1 = r.startTable.x;
  let y1 = r.startTable.y;
  let x2 = r.endTable.x;
  let y2 = r.endTable.y;

  let radius = 10 * zoom;
  const midX = (x2 + x1 + startWidth) / 2;
  const endX = x2 + startWidth < x1 ? x2 + startWidth : x2;

  // Handle very close vertical positions
  if (Math.abs(y1 - y2) <= 36 * zoom) {
    radius = Math.abs(y2 - y1) / 3;
    if (radius <= 2) {
      if (x1 + startWidth <= x2) {
        return `M ${x1 + startWidth} ${y1} L ${x2} ${y2 + 0.1}`;
      } else if (x2 + endWidth < x1) {
        return `M ${x1} ${y1} L ${x2 + endWidth} ${y2 + 0.1}`;
      }
    }
    if (radius > 2) radius = 10 * zoom;
  }

  // When start table Y is above or equal to end table Y
  if (y1 <= y2) {
    if (x1 + startWidth <= x2) {
      // Start table is completely to the left of end table
      return `M ${x1 + startWidth} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x1 >= x2 && x1 + startWidth <= x2 + endWidth) {
      // Start table is inside end table horizontally
      if (x1 + (startWidth / 2) <= x2 + (endWidth / 2)) {
        return `M ${x1} ${y1} L ${
          x1 - radius - (x1 - x2)
        } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius - (x1 - x2)} ${
          y1 + radius
        } L ${x1 - radius - radius - (x1 - x2)} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
          x1 - radius - (x1 - x2)
        } ${y2} L ${x2} ${y2}`;
      } else {
        return `M ${x1 + startWidth} ${y1} L ${
          x2 + endWidth + radius
        } ${y1} A ${radius} ${radius} 0 0 1 ${x2 + endWidth + radius + radius} ${
          y1 + radius
        } L ${x2 + endWidth + radius + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
          x2 + endWidth + radius
        } ${y2} L ${x2 + endWidth} ${y2}`;
      }
    } else if (x2 + endWidth + 2 * radius >= x1 && x2 + endWidth <= x1 + startWidth) {
      // Tables overlap partially
      return `M ${x1 + startWidth} ${y1} L ${
        x2 + endWidth + ((x1 + startWidth) - (x2 + endWidth)) + radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 + endWidth + radius + ((x1 + startWidth) - (x2 + endWidth)) + radius} ${
        y1 + radius
      } L ${x2 + endWidth + radius + ((x1 + startWidth) - (x2 + endWidth)) + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
        x2 + endWidth + ((x1 + startWidth) - (x2 + endWidth)) + radius
      } ${y2} L ${x2 + endWidth} ${y2}`;
    } else if (x2 <= x1 + startWidth && x1 <= x2) {
      // Tables overlap
      return `M ${x1} ${y1} L ${
        x2 - radius - (x2 - x1)
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 - radius - radius - (x2 - x1)} ${
        y1 + radius
      } L ${x2 - radius - radius - (x2 - x1)} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
        x2 - radius - (x2 - x1)
      } ${y2} L ${x2} ${y2}`;
    } else if (x2 + endWidth <= x1) {
      // End table is completely to the left of start table
      return `M ${x1} ${y1} L ${
        x1 - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y2} L ${x2 + endWidth} ${y2}`;
    }
    // Default case for y1 <= y2
    return `M ${x1} ${y1} L ${
      x1 - radius
    } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${y1 + radius} L ${x1 - radius - radius} ${
      y2 - radius
    } A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y2} L ${x2 + endWidth} ${y2}`;
  } else {
    // When start table Y is below end table Y (y1 > y2)
    if (x1 + startWidth <= x2) {
      // Start table is completely to the left of end table
      return `M ${x1 + startWidth} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x1 >= x2 && x1 + startWidth <= x2 + endWidth) {
      // Start table is inside end table horizontally
      if (x1 + (startWidth / 2) <= x2 + (endWidth / 2)) {
        return `M ${x1} ${y1} L ${
          x1 - radius - (x1 - x2)
        } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - (x1 - x2)} ${
          y1 - radius
        } L ${x1 - radius - radius - (x1 - x2)} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${
          x1 - radius - (x1 - x2)
        } ${y2} L ${x2} ${y2}`;
      } else {
        return `M ${x1 + startWidth} ${y1} L ${
          x2 + endWidth + radius
        } ${y1} A ${radius} ${radius} 0 0 0 ${x2 + endWidth + radius + radius} ${
          y1 - radius
        } L ${x2 + endWidth + radius + radius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${
          x2 + endWidth + radius
        } ${y2} L ${x2 + endWidth} ${y2}`;
      }
    } else if (x2 + endWidth + 2 * radius >= x1 && x2 + endWidth <= x1 + startWidth) {
      // Tables overlap partially
      return `M ${x1 + startWidth} ${y1} L ${
        x2 + endWidth + ((x1 + startWidth) - (x2 + endWidth)) + radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 + endWidth + radius + ((x1 + startWidth) - (x2 + endWidth)) + radius} ${
        y1 - radius
      } L ${x2 + endWidth + radius + ((x1 + startWidth) - (x2 + endWidth)) + radius} ${y2 + radius} A ${radius} ${radius} 0 0 0 ${
        x2 + endWidth + ((x1 + startWidth) - (x2 + endWidth)) + radius
      } ${y2} L ${x2 + endWidth} ${y2}`;
    } else if (x2 <= x1 + startWidth && x1 <= x2) {
      // Tables overlap
      return `M ${x1} ${y1} L ${
        x2 - radius - (x2 - x1)
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 - radius - radius - (x2 - x1)} ${
        y1 - radius
      } L ${x2 - radius - radius - (x2 - x1)} ${y2 + radius} A ${radius} ${radius} 0 0 1 ${
        x2 - radius - (x2 - x1)
      } ${y2} L ${x2} ${y2}`;
    } else if (x2 + endWidth <= x1) {
      // End table is completely to the left of start table
      return `M ${x1} ${y1} L ${
        x1 - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius} ${y1 - radius} L ${x1 - radius - radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${y2} L ${x2 + endWidth} ${y2}`;
    }
    // Default case for y1 > y2
    return `M ${x1} ${y1} L ${
      x1 - radius
    } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius} ${y1 - radius} L ${x1 - radius - radius} ${
      y2 + radius
    } A ${radius} ${radius} 0 0 0 ${x1 - radius - radius - radius} ${y2} L ${x2 + endWidth} ${y2}`;
  }
}
