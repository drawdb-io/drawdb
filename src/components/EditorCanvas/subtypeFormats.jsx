// Helper function to calculate angle for subtype notation based on parent-child relationship
function calculateSubtypeAngle(parentTable, childTable, subtypePoint, tableWidth = 200) {
  if (!parentTable || !childTable || !subtypePoint) {
    return 0;
  }

  // Calculate parent center using the actual table width
  const parentCenter = {
    x: parentTable.x + tableWidth / 2,
    y: parentTable.y + 30 // Approximate table height center
  };

  // Calculate the vector from subtype point to parent center
  const dx = parentCenter.x - subtypePoint.x;
  const dy = parentCenter.y - subtypePoint.y;

  // Calculate angle in degrees (Math.atan2 returns radians)
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  // The notation is designed so that:
  // - The lines/bars extend to the right (positive X direction)
  // - The connection point for new subtypes is below (positive Y direction)
  // We want the circle to face toward the parent, so we rotate to point the
  // right-side elements (lines/bars) toward the parent
  return angle;
}

export function subDT(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId, parentTable = null, childTable = null, tableWidth = 200) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(parentTable, childTable, point, tableWidth);
  }

  return (
    point && subtypevar === "disjoint_total" && (
      <g transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}>
        <circle cx={point.x} cy={point.y} r="8" stroke="gray" strokeWidth="2" fill="white" className="group-hover:fill-sky-700" />
        <text x={point.x} y={point.y + 2} fill="gray" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">D</text>
        <line x1={point.x - 10} y1={point.y - 20} x2={point.x - 10} y2={point.y + 20} stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700" />
        <line x1={point.x - 20} y1={point.y - 20} x2={point.x - 20} y2={point.y + 20} stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700" />
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) => onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)}
        />
      </g>
    )
  );
}

export function subDP(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId, parentTable = null, childTable = null, tableWidth = 200) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(parentTable, childTable, point, tableWidth);
  }

  return (
    point && subtypevar === "disjoint_partial" && (
      <g transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}>
        <circle cx={point.x} cy={point.y} r="8" stroke="gray" strokeWidth='2' fill="white" className="group-hover:fill-sky-700" />
        <text x={point.x} y={point.y + 2} fill="grey" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">D</text>
        <line x1={point.x - 10} y1={point.y + 20} x2={point.x - 10} y2={point.y - 20} stroke="gray" strokeWidth='2' className="group-hover:fill-sky-700" />
        <text x={point.x + 10} y={point.y - 10} fill="black" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">{cardinalityEnd}</text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) => onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)}
        />
      </g>
    )
  );
}

export function subOT(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId, parentTable = null, childTable = null, tableWidth = 200) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(parentTable, childTable, point, tableWidth);
  }

  return (
    point && subtypevar === "overlapping_total" && (
      <g transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}>
        <circle cx={point.x} cy={point.y} r="8" stroke="gray" strokeWidth='2' fill="white" className="group-hover:fill-sky-700" />
        <text x={point.x} y={point.y + 2} fill="grey" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">O</text>
        <line x1={point.x - 10} y1={point.y + 20} x2={point.x - 10} y2={point.y - 20} stroke="gray" strokeWidth='2' className="group-hover:fill-sky-700" />
        <line x1={point.x - 20} y1={point.y + 20} x2={point.x - 20} y2={point.y - 20} stroke="gray" strokeWidth='2' className="group-hover:fill-sky-700" />
        <text x={point.x + 10} y={point.y - 10} fill="black" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">{cardinalityEnd}</text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) => onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)}
        />
      </g>
    )
  );
}

export function subOP(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId, parentTable = null, childTable = null, tableWidth = 200) {
  // Calculate proper angle if parent and child table information is provided
  let rotationAngle = angle;
  if (parentTable && childTable && point) {
    rotationAngle = calculateSubtypeAngle(parentTable, childTable, point, tableWidth);
  }

  return (
    point && subtypevar === "overlapping_partial" && (
      <g transform={`rotate(${rotationAngle}, ${point.x}, ${point.y})`}>
        <circle cx={point.x} cy={point.y} r="8" stroke="gray" strokeWidth='2' fill="white" className="group-hover:fill-sky-700" />
        <text x={point.x} y={point.y + 2} fill="grey" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">O</text>
        <line x1={point.x - 10} y1={point.y + 20} x2={point.x - 10} y2={point.y - 20} stroke="gray" strokeWidth='2' className="group-hover:fill-sky-700" />
        <text x={point.x + 10} y={point.y - 10} fill="black" strokeWidth="0.5" textAnchor="middle" alignmentBaseline="middle">{cardinalityEnd}</text>
        <circle
          cx={point.x}
          cy={point.y + 20}
          r={6}
          fill="skyblue"
          stroke="gray"
          strokeWidth="1"
          cursor="crosshair"
          onPointerDown={(e) => onConnectSubtypePoint?.(e, point.x, point.y + 20, relationshipId)}
        />
      </g>
    )
  );
}