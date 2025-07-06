import { getTableHeight } from "./utils";
import { noteWidth } from "../data/constants";

export function getRectFromEndpoints({ x1, x2, y1, y2 }) {
  const width = Math.abs(x1 - x2);
  const height = Math.abs(y1 - y2);

  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);

  return { x, y, width, height };
}

export function pointIsInsideRect(point, rect) {
  return (
    point.x > rect.x && point.x < rect.x + rect.width &&
    point.y > rect.y && point.y < rect.y + rect.height
  );
}

export function isInsideRect(rect1, rect2) {
  return (
    rect1.x > rect2.x &&
    rect1.x + rect1.width < rect2.x + rect2.width &&
    rect1.y > rect2.y &&
    rect1.y + rect1.height < rect2.y + rect2.height
  );
}

export function areaRect(area) {
  return {
    x: area.x,
    y: area.y,
    width: area.width,
    height: area.height,
  };
}

export function noteRect(note) {
  return {
    x: note.x,
    y: note.y,
    width: noteWidth,
    height: note.height,
  };
}

export function tableRect(table, settings) {
  return {
    x: table.x,
    y: table.y,
    width: settings.tableWidth,
    height: getTableHeight(table),
  };
}
