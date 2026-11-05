import { noteWidth } from "../data/constants";
import {
  getRelatedFieldKeysByTable,
  getTableHeight,
  getTableWidth,
} from "./utils";

const defaultNoteHeight = 100;

// spreadDiagram moves every unlocked table, area and note away from a center
// point by a factor (or toward it, for a factor below 1). It moves each table
// by its center and keeps its size, so the gaps between tables grow while the
// tables stay as they are. It scales each area's size by the same factor, so a
// table inside an area stays inside it.
export function spreadDiagram({
  tables,
  relationships,
  areas,
  notes,
  settings,
  center,
  factor,
}) {
  const relatedFieldKeysByTable = getRelatedFieldKeysByTable(relationships);
  const moveCenter = (centerX, centerY) => ({
    x: center.x + (centerX - center.x) * factor,
    y: center.y + (centerY - center.y) * factor,
  });
  const moveBox = ({ x, y, width, height }) => {
    const movedCenter = moveCenter(x + width / 2, y + height / 2);
    return {
      x: Math.round(movedCenter.x - width / 2),
      y: Math.round(movedCenter.y - height / 2),
    };
  };

  const spreadTables = tables
    .filter((table) => !table.locked)
    .map((table) => ({
      id: table.id,
      ...moveBox({
        x: table.x,
        y: table.y,
        width: getTableWidth(table),
        height: getTableHeight(
          table,
          settings.showComments,
          relatedFieldKeysByTable.get(table.id),
        ),
      }),
    }));

  const spreadAreas = areas
    .filter((area) => !area.locked)
    .map((area) => {
      const width = Math.round(area.width * factor);
      const height = Math.round(area.height * factor);
      const movedCenter = moveCenter(
        area.x + area.width / 2,
        area.y + area.height / 2,
      );
      return {
        id: area.id,
        x: Math.round(movedCenter.x - width / 2),
        y: Math.round(movedCenter.y - height / 2),
        width,
        height,
      };
    });

  const spreadNotes = notes
    .filter((note) => !note.locked)
    .map((note) => ({
      id: note.id,
      ...moveBox({
        x: note.x,
        y: note.y,
        width: noteWidth,
        height: note.height ?? defaultNoteHeight,
      }),
    }));

  return { tables: spreadTables, areas: spreadAreas, notes: spreadNotes };
}
