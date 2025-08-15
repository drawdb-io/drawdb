// Function to determine optimal connection points based on table positions
function getOptimalConnectionPoints(table1, table2, tableWidth, tableHeight = 60) {
  const t1Center = { x: table1.x + tableWidth / 2, y: table1.y + tableHeight / 2 };
  const t2Center = { x: table2.x + tableWidth / 2, y: table2.y + tableHeight / 2 };
  const dx = t2Center.x - t1Center.x;
  const dy = t2Center.y - t1Center.y;
  // Calculate distances to each side
  const horizontalDistance = Math.abs(dx);
  const verticalDistance = Math.abs(dy);
  // Determine the best connection based on which sides are closest
  let start, end, isVertical;
  // If one table is clearly above/below the other (significant vertical separation)
  if (verticalDistance > horizontalDistance) {
    isVertical = true;
    if (dy > 0) {
      // Table 2 is below table 1 - connect bottom to top
      start = { x: t1Center.x, y: table1.y + tableHeight };     // Bottom center of table 1
      end = { x: t2Center.x, y: table2.y };                     // Top center of table 2
    } else {
      // Table 2 is above table 1 - connect top to bottom
      start = { x: t1Center.x, y: table1.y };                   // Top center of table 1
      end = { x: t2Center.x, y: table2.y + tableHeight };       // Bottom center of table 2
    }
  } else {
    // Horizontal connection is optimal
    isVertical = false;
    if (dx > 0) {
      // Table 2 is to the right of table 1 - connect right to left
      start = { x: table1.x + tableWidth, y: t1Center.y };      // Right center of table 1
      end = { x: table2.x, y: t2Center.y };                     // Left center of table 2
    } else {
      // Table 2 is to the left of table 1 - connect left to right
      start = { x: table1.x, y: t1Center.y };                   // Left center of table 1
      end = { x: table2.x + tableWidth, y: t2Center.y };        // Right center of table 2
    }
  }
  return { start, end, isVertical };
}

export function calcPath(r, tableWidth = 200, zoom = 1) {
  const width = tableWidth * zoom;
  // Use a more accurate table height calculation
  // Base height includes header + some padding for fields
  const height = Math.max(60 * zoom, 90 * zoom); // Minimum height with header
  // Check if this is a recursive-like relationship
  const isRecursiveLike = Math.abs(r.startTable.x - r.endTable.x) < 1;

  if (isRecursiveLike) {
    const loopOutwardDistance = Math.max(40 * zoom, width / 4);
    const verticalMidpoint = (r.startTable.y + r.endTable.y) / 2;
    const path = `M ${r.startTable.x + width} ${r.startTable.y + height/2} ` +
                 `Q ${r.startTable.x + width + loopOutwardDistance} ${r.startTable.y + height/2}, ${r.startTable.x + width + loopOutwardDistance} ${verticalMidpoint} ` +
                 `T ${r.startTable.x + width} ${r.endTable.y + height/2}`;
    return path;
  }

  // Get optimal connection points
  const connection = getOptimalConnectionPoints(
    r.startTable,
    r.endTable,
    width,
    height
  );
  const { start, end, isVertical } = connection;
  let radius = 10 * zoom;

  // If tables are very close, use straight line
  const distance = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
  if (distance < 50 * zoom) {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  }

  // Create path with smooth curves
  if (isVertical) {
    // Vertical connection - use horizontal control points
    const midY = (start.y + end.y) / 2;
    const controlOffset = Math.min(Math.abs(end.y - start.y) / 3, 30 * zoom);
    return `M ${start.x} ${start.y} ` +
           `C ${start.x} ${start.y + controlOffset}, ${end.x} ${end.y - controlOffset}, ${end.x} ${end.y}`;
  } else {
    // Horizontal connection - use vertical control points
    const midX = (start.x + end.x) / 2;
    const controlOffset = Math.min(Math.abs(end.x - start.x) / 3, 30 * zoom);
    return `M ${start.x} ${start.y} ` +
           `C ${start.x + controlOffset} ${start.y}, ${end.x - controlOffset} ${end.y}, ${end.x} ${end.y}`;
  }
}
