export function calcPath(x1, x2, y1, y2, zoom = 1) {
  const tableWidth = 200 * zoom;
  if (y1 <= y2) {
    if (x1 + tableWidth <= x2) {
      x2 -= 14;
    } else if (x2 <= x1 + tableWidth && x1 <= x2) {
      // x2-=14;
      // x1-=14;
    } else if (x2 + tableWidth >= x1 && x2 + tableWidth <= x1 + tableWidth) {
      x1 -= 14;
      x2 -= 14;
    } else {
      x2 -= 14;
      x1 -= 14;
    }
  } else {
    if (x1 + tableWidth <= x2) {
      x2 -= 14;
    } else if (x1 + tableWidth >= x2 && x1 + tableWidth <= x2 + tableWidth) {
      //
      x1 -= 14;
      x2 -= 14;
    } else if (x1 >= x2 && x1 <= x2 + tableWidth) {
      // x1-=19;
      // x2-=14;
    } else {
      x1 -= 14;
      x2 -= 14;
    }
  }
  x1 *= zoom;
  x2 *= zoom;
  y1 *= zoom;
  y2 *= zoom;

  let r = 10 * zoom;
  const offsetX = 8 * zoom;
  const midX = (x2 + x1 + tableWidth) / 2;
  const endX = x2 + tableWidth < x1 ? x2 + tableWidth : x2;

  if (Math.abs(y1 - y2) <= 36 * zoom) {
    r = Math.abs(y2 - y1) / 3;
    if (r <= 2) {
      if (x1 + tableWidth <= x2)
        return `M ${x1 + tableWidth - 2 * offsetX} ${y1} L ${x2} ${y2 + 0.1}`;
      else if (x2 + tableWidth < x1)
        return `M ${x1} ${y1} L ${x2 + tableWidth} ${y2 + 0.1}`;
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
      return `M ${x1} ${y1} L ${x2 - r} ${y1} A ${r} ${r} 0 0 0 ${x2 - r - r} ${
        y1 + r
      } L ${x2 - r - r} ${y2 - r} A ${r} ${r} 0 0 0 ${
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
      return `M ${x1} ${y1} L ${x1 - r - r} ${y1} A ${r} ${r} 0 0 1 ${
        x1 - r - r - r
      } ${y1 - r} L ${x1 - r - r - r} ${y2 + r} A ${r} ${r} 0 0 1 ${
        x1 - r - r
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
}
