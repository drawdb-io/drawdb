export function calcPath(r, tableWidth = 200, zoom = 1) {
  const width = tableWidth * zoom;
  let x1 = r.startTable.x;
  let y1 = r.startTable.y;
  let x2 = r.endTable.x;
  let y2 = r.endTable.y;

  let radius = 10 * zoom;


  const isRecursiveLike = Math.abs(x1 - x2) < 1;

  if (isRecursiveLike) {
    const loopOutwardDistance = Math.max(40 * zoom, width / 4);
    const verticalMidpoint = (y1 + y2) / 2;
    const path = `M ${x1 + width} ${y1} ` +
                 `Q ${x1 + width + loopOutwardDistance} ${y1}, ${x1 + width + loopOutwardDistance} ${verticalMidpoint} ` +
                 `T ${x1 + width} ${y2}`;
    return path;
  }

  if (Math.abs(y1 - y2) <= 36 * zoom) {
    radius = Math.abs(y2 - y1) / 3;
    if (radius <= 2) {
      if (x1 + width <= x2) {
        const path = `M ${x1 + width} ${y1} L ${x2} ${y2 + 0.1}`;
        return path;
      } else if (x2 + width < x1) {
        const path = `M ${x1} ${y1} L ${x2 + width} ${y2 + 0.1}`;
        return path;
      }
    }
    if (radius > 2) radius = 10 * zoom;
  }

  const midX = (x1 + x2 + width) / 2;

  if (y1 <= y2) {
    if (x1 + width <= x2) {
      const path = `M ${x1 + width} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${x2} ${y2}`;
      return path;
    } else if (x2 <= x1 + width && x1 <= x2) {
      const path = `M ${x1 + width} ${y1} L ${
        x1 + width + radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${x1 + width + radius + radius} ${
        y1 + radius
      } L ${x1 + width + radius + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
        x1 + width + radius
      } ${y2} L ${x2} ${y2}`;
      return path;
    } else if (x2 + width >= x1 && x2 + width <= x1 + width) {
      const path = `M ${x1} ${y1} L ${
        x1 - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x1 - radius - radius} ${
        y1 + radius
      } L ${x1 - radius - radius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
        x1 - radius
      } ${y2} L ${x2 + width} ${y2}`;
      return path;
    } else {
      const path = `M ${x1} ${y1} L ${
        midX + radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 1 ${midX - radius} ${y2} L ${x2 + width} ${y2}`;
      return path;
    }
  } else {
    if (x1 + width <= x2) {
      const path = `M ${x1 + width} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${x2} ${y2}`;
      return path;
    } else if (x1 + width >= x2 && x1 + width <= x2 + width) {
       const path = `M ${x1} ${y1} L ${
        x1 - radius - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${x1 - radius - radius - radius} ${
        y1 - radius
      } L ${x1 - radius - radius - radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${
        x1 - radius - radius
      } ${y2} L ${x2 + width} ${y2}`;
      return path;
    } else if (x1 >= x2 && x1 <= x2 + width) {
      const path = `M ${x1 + width} ${y1} L ${
        x1 + width + radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${x1 + width + radius + radius} ${
        y1 - radius
      } L ${x1 + width + radius + radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 0 ${x1 + width + radius} ${y2} L ${
        x2
      } ${y2}`;
      return path;
    } else {
      const path = `M ${x1} ${y1} L ${
        midX + radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 0 ${midX - radius} ${y2} L ${x2 + width} ${y2}`;
      return path;
    }
  }
}
