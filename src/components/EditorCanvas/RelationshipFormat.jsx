// Helper function to get optimal rotation for notations
function getNotationRotation(isVertical) {
  return {
    rotation: isVertical ? 90 : 0,
    // No need to calculate center here, we'll handle positioning per element
  };
}

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

export function CrowParentLines(
  cardinalityStartX,
  cardinalityStartY,
  direction,
  isVertical = false,
  vectorInfo = null,
  cardinalityText = ""
) {
  const offsetDistance = 6;
  const lineOffset = 10;

  if (isVertical) {
    return (
      <>
        <line
          x1={cardinalityStartX - lineOffset}
          y1={cardinalityStartY - (offsetDistance * direction)}
          x2={cardinalityStartX + lineOffset}
          y2={cardinalityStartY - (offsetDistance * direction)}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        <line
          x1={cardinalityStartX - lineOffset}
          y1={cardinalityStartY - (2 * direction)}
          x2={cardinalityStartX + lineOffset}
          y2={cardinalityStartY - (2 * direction)}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        {cardinalityText && (
          <text
            x={cardinalityStartX - 25}
            y={cardinalityStartY}
            fill="gray"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityText}
          </text>
        )}
      </>
    );
  } else {
    return (
      <>
        <line
          x1={cardinalityStartX - (offsetDistance * direction)}
          y1={cardinalityStartY + lineOffset}
          x2={cardinalityStartX - (offsetDistance * direction)}
          y2={cardinalityStartY - lineOffset}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        <line
          x1={cardinalityStartX - (2 * direction)}
          y1={cardinalityStartY + lineOffset}
          x2={cardinalityStartX - (2 * direction)}
          y2={cardinalityStartY - lineOffset}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        {cardinalityText && (
          <text
            x={cardinalityStartX - 8}
            y={cardinalityStartY - 20}
            fill="gray"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityText}
          </text>
        )}
      </>
    );
  }
}

export function CrowParentDiamond(
  cardinalityStartX,
  cardinalityStartY,
  direction,
  isVertical = false,
  vectorInfo = null,
  cardinalityText = ""
) {
  const offsetDistance = 12;
  const diamondSize = 6;
  const offset = 8;

  if (isVertical) {
    return (
      <>
        <polygon
          points={`
            ${cardinalityStartX},${cardinalityStartY - (8 * direction)}
            ${cardinalityStartX - diamondSize},${cardinalityStartY - (offsetDistance * direction)}
            ${cardinalityStartX},${cardinalityStartY - (16 * direction)}
            ${cardinalityStartX + diamondSize},${cardinalityStartY - (offsetDistance * direction)}
          `}
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:stroke-sky-700"
        />
        {cardinalityText && (
          <text
            x={cardinalityStartX - 25}
            y={cardinalityStartY}
            fill="gray"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityText}
          </text>
        )}
      </>
    );
  } else {
    return (
      <>
        <polygon
          points={`
            ${cardinalityStartX + offset - (8 * direction)},${cardinalityStartY}
            ${cardinalityStartX + offset - (offsetDistance * direction)},${cardinalityStartY - diamondSize}
            ${cardinalityStartX + offset - (16 * direction)},${cardinalityStartY}
            ${cardinalityStartX + offset - (offsetDistance * direction)},${cardinalityStartY + diamondSize}
          `}
          stroke="gray"
          strokeWidth="2"
          fill="white"
          className="group-hover:stroke-sky-700"
        />
        {cardinalityText && (
          <text
            x={cardinalityStartX - 8}
            y={cardinalityStartY - 20}
            fill="gray"
            strokeWidth="0.5"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {cardinalityText}
          </text>
        )}
      </>
    );
  }
}

export function CrowsFootChild(
  pathRef,
  cardinalityEndX,
  cardinalityEndY,
  cardinalityStartX,
  cardinalityStartY,
  direction,
  cardinalityStart,
  cardinalityEnd,
  showCardinality = true,
  isVertical = false,
  vectorInfo = null
) {
  const isMandatory = cardinalityEnd.startsWith("(1"); // (1,1) o (1,*)
  const isOptional = cardinalityEnd.startsWith("(0");  // (0,1) o (0,*)
  const isMany = cardinalityEnd.endsWith("*)");         // (1,*) o (0,*)
  const isOne = cardinalityEnd.endsWith("1)");          // (1,1) o (0,1)

  // Calculate the actual direction vector if we have vector information
  let dx = 1, dy = 0; // Default to right-pointing
  if (vectorInfo) {
    const magnitude = Math.sqrt(vectorInfo.dx * vectorInfo.dx + vectorInfo.dy * vectorInfo.dy);
    if (magnitude > 0) {
      dx = vectorInfo.dx / magnitude;
      dy = vectorInfo.dy / magnitude;
    }
  }

  // Calculate perpendicular vector for bar orientations
  const perpX = -dy;
  const perpY = dx;

  // Calculate text positions that work for both horizontal and vertical relationships
  const getCardinalityPosition = (x, y, isStart) => {
    if (isVertical) {
      // For vertical relationships, position cardinalities to the side
      return {
        x: isStart ? x - 25 : x + 35, // Child side (end) further away from table for clarity
        y: y // Same vertical level as the notation
      };
    } else {
      return {
        x: isStart ? x - 8 : x + 15,
        y: y - 20 // Above the line for horizontal relationships
      };
    }
  };

  // Base distances from table edge - CORRECTED ORDER
  // Note: cardinalityEndX/Y are already offset by 35px from table edge in Relationship.jsx
  const crowsFootOffset = 6;               // Crow's foot closer to table (reduced due to existing 35px offset)
  const elementOffset = 12;                // Bars/circles further from table (reduced due to existing 35px offset)
  const lineLength = 8;                    // Half length of bars

  // Calculate positions along the line direction
  const crowsFootX = cardinalityEndX - (dx * crowsFootOffset);
  const crowsFootY = cardinalityEndY - (dy * crowsFootOffset);
  const elementX = cardinalityEndX - (dx * elementOffset);
  const elementY = cardinalityEndY - (dy * elementOffset);

  return (
    pathRef && (
      <g>
        {/* To (0,*)*/}
        {isOptional && isMany && (
          <>
            <circle
              cx={elementX}
              cy={elementY}
              r="4"
              stroke="gray"
              strokeWidth="2"
              fill="white"
              className="group-hover:stroke-sky-700"
            />
          </>
        )}
        {/* To (1,*)*/}
        {isMandatory && isMany && (
          <>
            <line
              x1={crowsFootX - (perpX * lineLength)}
              y1={crowsFootY - (perpY * lineLength)}
              x2={crowsFootX + (perpX * lineLength)}
              y2={crowsFootY + (perpY * lineLength)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
          </>
        )}

        {/* To (0,1)*/}
        {isOptional && isOne && (
          <>
            <circle
              cx={cardinalityEndX - (dx * 8)}
              cy={cardinalityEndY - (dy * 8)}
              r="4"
              stroke="gray"
              strokeWidth="2"
              fill="white"
              className="group-hover:stroke-sky-700"
            />
            <line
              x1={cardinalityEndX - (dx * 3) - (perpX * lineLength)}
              y1={cardinalityEndY - (dy * 3) - (perpY * lineLength)}
              x2={cardinalityEndX - (dx * 3) + (perpX * lineLength)}
              y2={cardinalityEndY - (dy * 3) + (perpY * lineLength)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
          </>
        )}

        {/* To (1,1)*/}
        {isMandatory && isOne && (
          <>
            <line
              x1={cardinalityEndX - (dx * 10) - (perpX * lineLength)}
              y1={cardinalityEndY - (dy * 10) - (perpY * lineLength)}
              x2={cardinalityEndX - (dx * 10) + (perpX * lineLength)}
              y2={cardinalityEndY - (dy * 10) + (perpY * lineLength)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
            <line
              x1={cardinalityEndX - (dx * 6) - (perpX * lineLength)}
              y1={cardinalityEndY - (dy * 6) - (perpY * lineLength)}
              x2={cardinalityEndX - (dx * 6) + (perpX * lineLength)}
              y2={cardinalityEndY - (dy * 6) + (perpY * lineLength)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
          </>
        )}
        {isMany && (
          <>
            <line
              x1={crowsFootX}
              y1={crowsFootY}
              x2={crowsFootX + (dx * 12) - (perpX * 10)}
              y2={crowsFootY + (dy * 12) - (perpY * 10)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
            <line
              x1={crowsFootX}
              y1={crowsFootY}
              x2={crowsFootX + (dx * 12) + (perpX * 10)}
              y2={crowsFootY + (dy * 12) + (perpY * 10)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
            <line
              x1={crowsFootX}
              y1={crowsFootY}
              x2={crowsFootX + (dx * 14)}
              y2={crowsFootY + (dy * 14)}
              stroke="gray"
              strokeWidth="2"
              className="group-hover:stroke-sky-700"
            />
          </>
        )}
        {/* Cardinality text with better positioning for vertical relationships */}
        {showCardinality && (
          <>
            {(() => {
              const startPos = getCardinalityPosition(cardinalityStartX, cardinalityStartY, true);
              const endPos = getCardinalityPosition(cardinalityEndX, cardinalityEndY, false);
              return (
                <>
                  <text
                    x={startPos.x}
                    y={startPos.y}
                    fill="gray"
                    strokeWidth="0.5"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {cardinalityStart}
                  </text>
                  <text
                    x={endPos.x}
                    y={endPos.y}
                    fill="gray"
                    strokeWidth="0.5"
                    textAnchor="middle"
                    alignmentBaseline="middle"
                  >
                    {cardinalityEnd}
                  </text>
                </>
              );
            })()}
          </>
        )}
      </g>
    )
  );
}

export function DefaultNotation(
  pathRef,
  cardinalityEndX,
  cardinalityEndY,
  cardinalityStartX,
  cardinalityStartY,
  direction,
  cardinalityStart,
  cardinalityEnd,
  showCardinality = true,
  isVertical = false,
  vectorInfo = null
) {
  // Get optimal rotation for better visibility
  const notationRotation = getNotationRotation(isVertical);

  return(
      pathRef && (
        <g>
            <circle
              cx={cardinalityStartX}
              cy={cardinalityStartY}
              r="16"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityStartX}
              y={cardinalityStartY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <circle
              cx={cardinalityEndX}
              cy={cardinalityEndY}
              r="16"
              fill="grey"
              className="group-hover:fill-sky-700"
            />
            <text
              x={cardinalityEndX}
              y={cardinalityEndY}
              fill="white"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </g>
      )
  )
}

export function IDEFZM(
  pathRef,
  cardinalityEndX,
  cardinalityEndY,
  cardinalityStartX,
  cardinalityStartY,
  direction,
  cardinalityStart,
  cardinalityEnd,
  showCardinality = true,
  isVertical = false,
  vectorInfo = null
) {
  let letter = null;
  switch (cardinalityEnd) {
    case "(1,*)":
      letter = "P";
      break;
    case "(1,1)":
      letter = "L";
      break;
    case "(0,1)":
      letter = "Z";
      break;
  }

  let dx = 1, dy = 0;
  if (vectorInfo) {
    const magnitude = Math.sqrt(vectorInfo.dx * vectorInfo.dx + vectorInfo.dy * vectorInfo.dy);
    if (magnitude > 0) {
      dx = vectorInfo.dx / magnitude;
      dy = vectorInfo.dy / magnitude;
    }
  }

  // Position circle along the line direction, away from table
  const circleOffset = 8;
  const circleX = cardinalityEndX - (dx * circleOffset);
  const circleY = cardinalityEndY - (dy * circleOffset);

  // Position letter further away from table
  const letterOffset = 15;
  const letterX = cardinalityEndX - (dx * letterOffset);
  const letterY = cardinalityEndY - (dy * letterOffset) + 4; // Small adjustment for text baseline

  return (
    pathRef && (
      <g>
        <circle
          cx={circleX}
          cy={circleY}
          r="5"
          stroke="gray"
          strokeWidth="2"
          fill="gray"
          className="group-hover:fill-sky-700 group-hover:stroke-sky-700"
        />
        {letter && (
          <text
            x={letterX}
            y={letterY}
            fill="gray"
            fontSize="14"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            className="group-hover:fill-sky-700"
          >
            {letter}
          </text>
        )}
        {showCardinality && (
          <>
            <text
              x={isVertical ? cardinalityStartX - 25 : cardinalityStartX - 8}
              y={isVertical ? cardinalityStartY : cardinalityStartY - 20}
              fill="gray"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <text
              x={isVertical ? cardinalityEndX + 35 : cardinalityEndX + 15}
              y={isVertical ? cardinalityEndY : cardinalityEndY - 20}
              fill="gray"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </>
        )}
      </g>
    )
  );
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