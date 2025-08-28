// Utility: determine optimal connection points between two tables
// Uses per-table heights so anchors touch the correct top/bottom when tables
// have different rendered heights (different number of fields).
function getOptimalConnectionPoints(table1, table2, table1Width, table2Width, table1Height = 60, table2Height = 60) {
  const t1Center = { x: table1.x + table1Width / 2, y: table1.y + table1Height / 2 };
  const t2Center = { x: table2.x + table2Width / 2, y: table2.y + table2Height / 2 };
  const dx = t2Center.x - t1Center.x;
  const dy = t2Center.y - t1Center.y;

  const horizontalDistance = Math.abs(dx);
  const verticalDistance = Math.abs(dy);

  let start, end, isVertical;
  if (verticalDistance > horizontalDistance) {
    isVertical = true;
    if (dy > 0) {
      // table2 below table1: start at bottom edge of table1, end at top edge of table2
      start = { x: t1Center.x, y: table1.y + table1Height };
      end = { x: t2Center.x, y: table2.y };
    } else {
      // table2 above table1: start at top edge of table1, end at bottom edge of table2
      start = { x: t1Center.x, y: table1.y };
      end = { x: t2Center.x, y: table2.y + table2Height };
    }
  } else {
    isVertical = false;
    if (dx > 0) {
      // table2 right of table1
      start = { x: table1.x + table1Width, y: t1Center.y };
      end = { x: table2.x, y: t2Center.y };
    } else {
      // table2 left of table1
      start = { x: table1.x, y: t1Center.y };
      end = { x: table2.x + table2Width, y: t2Center.y };
    }
  }
  return { start, end, isVertical };
}

// Main: compute SVG path for relationship 'r'
// r: { startTable: {x,y,...}, endTable: {x,y,...} }
export function calcPath(r, startWidth = 200, endWidth = 200, zoom = 1) {
  if (!r || !r.startTable || !r.endTable) return "";

  const startTableWidth = startWidth * zoom;
  const endTableWidth = endWidth * zoom;
  // allow tableHeight to adapt if table defines fields count
  const computeHeight = (table) => {
    if (table && Array.isArray(table.fields)) {
      return Math.max(60 * zoom, (40 + table.fields.length * 18) * zoom);
    }
    return 60 * zoom;
  };
  const startHeight = computeHeight(r.startTable);
  const endHeight = computeHeight(r.endTable);

  // detect self/recur-like relationships (same table or extremely close X)
  const sameTable = r.startTable === r.endTable || (r.startTable.id !== undefined && r.startTable.id === r.endTable.id);
  const veryCloseX = Math.abs(r.startTable.x - r.endTable.x) < 1;
  if (sameTable || veryCloseX) {
  const loopOut = Math.max(40 * zoom, startTableWidth / 3);
    const yMid = (r.startTable.y + r.endTable.y) / 2;
  const startX = r.startTable.x + startTableWidth;
    const startY = r.startTable.y + startHeight / 2;
    // simple loop using quadratic curve
    return `M ${startX} ${startY} Q ${startX + loopOut} ${startY} ${startX + loopOut} ${yMid} T ${startX} ${r.endTable.y + endHeight/2}`;
  }

  const connection = getOptimalConnectionPoints(r.startTable, r.endTable, startTableWidth, endTableWidth, startHeight, endHeight);
  const { start, end, isVertical } = connection;

  if (!isVertical) {
    if (r.startAnchor && typeof r.startAnchor.y === 'number') {
      start.y = r.startAnchor.y;
    }
    if (r.endAnchor && typeof r.endAnchor.y === 'number') {
      end.y = r.endAnchor.y;
    }
  } else {
    // For vertical relationships, anchors typically specify the desired
    // Y coordinate (row center or table edge). Use anchor.y to attach to
    // the specific row or table top/bottom.
    if (r.startAnchor && typeof r.startAnchor.y === 'number') {
      start.y = r.startAnchor.y;
    }
    if (r.endAnchor && typeof r.endAnchor.y === 'number') {
      end.y = r.endAnchor.y;
    }
    // Allow X overrides if explicitly provided (optional)
    if (r.startAnchor && typeof r.startAnchor.x === 'number') {
      start.x = r.startAnchor.x;
    }
    if (r.endAnchor && typeof r.endAnchor.x === 'number') {
      end.x = r.endAnchor.x;
    }
  }

  // distance between anchors
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // If extremely close, draw straight line
  if (dist < 30 * zoom) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // control offset proportional to distance but capped
  const offset = Math.min(Math.max(dist / 3, 20 * zoom), 80 * zoom);

  if (isVertical) {
    // vertical: curve with horizontal control handles
    const c1x = start.x;
    const c1y = start.y + (dy > 0 ? offset : -offset);
    const c2x = end.x;
    const c2y = end.y - (dy > 0 ? offset : -offset);
    return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
  }

  // horizontal: curve with vertical control handles
  const c1x = start.x + (dx > 0 ? offset : -offset);
  const c1y = start.y;
  const c2x = end.x - (dx > 0 ? offset : -offset);
  const c2y = end.y;
  return `M ${start.x} ${start.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${end.x} ${end.y}`;
}
