import { tableFieldHeight, tableHeaderHeight } from "../data/constants";

/**
 * Generates an SVG path string to visually represent a relationship between two fields.
 *
 * @param {{
 *   startTable: { x: number, y: number },
 *   endTable: { x: number, y: number },
 *   startFieldIndex: number,
 *   endFieldIndex: number
 * }} r - Relationship data.
 * @param {number} tableWidth - Width of each table (used to calculate horizontal offsets).
 * @param {number} zoom - Zoom level (used to scale vertical spacing).
 * @returns {string} SVG path "d" attribute string.
 */
export function calcPath(r, tableWidth = 200, zoom = 1) {
  if (!r) {
    return "";
  }

  const width = tableWidth * zoom;
  const tableWidthSafetyMargin = 70 * zoom;
  const tableWidthPadding = 30 * zoom;

  let x1 = r.startTable.x;
  const fieldHeight = tableFieldHeight * zoom;
  const headerHeight = tableHeaderHeight * zoom;
  let y1 =
    r.startTable.y +
    r.startFieldIndex * fieldHeight +
    headerHeight +
    fieldHeight / 2;
  let x2 = r.endTable.x;
  let y2 =
    r.endTable.y +
    r.endFieldIndex * fieldHeight +
    headerHeight +
    fieldHeight / 2;

  let radius = 10 * zoom;
  const curveRadius = 18 * zoom;
  const midX = (x2 + x1 + width) / 2;
  const endX = x2 + width < x1 ? x2 + width : x2;

  if (Math.abs(y1 - y2) <= 36 * zoom) {
    radius = Math.max(Math.abs(y2 - y1) / 3, curveRadius);
    if (radius <= curveRadius) {
      if (x1 + width <= x2) return `M ${x1 + width} ${y1} L ${x2} ${y2}`;
      else if (x2 + width < x1)
        return `M ${x1} ${y1} L ${x2 + width} ${y2}`;
    }
  } else {
    radius = Math.max(radius, curveRadius);
  }

  if (y1 <= y2) {
    if (x1 + width + tableWidthSafetyMargin <= x2) {
      return `M ${x1 + width} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 0 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x2 <= x1 + width + tableWidthSafetyMargin && x1 <= x2) {
      return `M ${x1 + width} ${y1} L ${
        x2 + width + tableWidthPadding
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 + width + tableWidthPadding + radius} ${
        y1 + radius
      } L ${x2 + width + tableWidthPadding + radius} ${y2 - radius} A ${radius} ${radius} 0 0 1 ${
        x2 + width + tableWidthPadding
      } ${y2} L ${x2 + width} ${y2}`;
    } else if (x2 + width >= x1 - tableWidthSafetyMargin && x2 + width <= x1 + width) {
      return `M ${x1} ${y1} L ${
        x2 - tableWidthPadding
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 - tableWidthPadding - radius} ${
        y1 + radius
      } L ${x2 - tableWidthPadding - radius} ${y2 - radius} A ${radius} ${radius} 0 0 0 ${
        x2 - tableWidthPadding
      } ${y2} L ${x2} ${y2}`;
    } else {
      return `M ${x1} ${y1} L ${
        midX + radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 + radius} L ${midX} ${
        y2 - radius
      } A ${radius} ${radius} 0 0 1 ${midX - radius} ${y2} L ${endX} ${y2}`;
    }
  } else {
    if (x1 + width + tableWidthSafetyMargin <= x2) {
      return `M ${x1 + width} ${y1} L ${
        midX - radius
      } ${y1} A ${radius} ${radius} 0 0 0 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${midX + radius} ${y2} L ${endX} ${y2}`;
    } else if (x1 + width >= x2 - tableWidthSafetyMargin && x1 + width <= x2 + width) {
      return `M ${x1 + width} ${y1} L ${
        x2 + width + tableWidthPadding
      } ${y1} A ${radius} ${radius} 0 0 0 ${x2 + width + tableWidthPadding + radius} ${
        y1 - radius
      } L ${x2 + width + tableWidthPadding + radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 0 ${x2 + width + tableWidthPadding} ${y2} L ${
        x2 + width
      } ${y2}`;
    } else if (x2 + width >= x1 - tableWidthSafetyMargin && x2 + width <= x1 + width) {
      return `M ${x1} ${y1} L ${
        x2 - tableWidthPadding
      } ${y1} A ${radius} ${radius} 0 0 1 ${x2 - tableWidthPadding - radius} ${
        y1 - radius
      } L ${x2 - tableWidthPadding - radius} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 1 ${
        x2 - tableWidthPadding
      } ${y2} L ${x2} ${y2}`;
    } else {
      return `M ${x1} ${y1} L ${
        midX + radius
      } ${y1} A ${radius} ${radius} 0 0 1 ${midX} ${y1 - radius} L ${midX} ${
        y2 + radius
      } A ${radius} ${radius} 0 0 0 ${midX - radius} ${y2} L ${endX} ${y2}`;
    }
  }
}
