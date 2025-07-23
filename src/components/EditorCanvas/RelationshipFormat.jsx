// Helper function to get optimal rotation for notations
function getNotationRotation(isVertical) {
  return {
    rotation: isVertical ? 90 : 0,
    // No need to calculate center here, we'll handle positioning per element
  };
}

export function CrowParentLines(
  cardinalityStartX,
  cardinalityStartY,
  direction,
  isVertical = false,
  vectorInfo = null,
  cardinalityText = ""
) {
  // Calcular desplazamiento perpendicular a la línea - más cerca de la tabla
  const offsetDistance = 6;  // Aumentado para notaciones más grandes
  const lineOffset = 10;      // Aumentado para líneas más largas

  if (isVertical) {
    // Para líneas verticales, las líneas se dibujan horizontalmente
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
          y1={cardinalityStartY - (2 * direction)}  // Aumentado para separación mayor
          x2={cardinalityStartX + lineOffset}
          y2={cardinalityStartY - (2 * direction)}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        {/* Cardinalidad al lado izquierdo para relaciones verticales */}
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
    // Para líneas horizontales, las líneas se dibujan verticalmente
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
          x1={cardinalityStartX - (2 * direction)}  // Aumentado para separación mayor
          y1={cardinalityStartY + lineOffset}
          x2={cardinalityStartX - (2 * direction)}
          y2={cardinalityStartY - lineOffset}
          stroke="gray"
          strokeWidth="2"
          className="group-hover:stroke-sky-700"
        />
        {/* Cardinalidad arriba para relaciones horizontales */}
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
  const offsetDistance = 12;   // Aumentado para notaciones más grandes
  const diamondSize = 6;       // Aumentado para diamante más grande
  const offset = 8;          // Aumentado para mayor separación del diamante

  if (isVertical) {
    // Para líneas verticales, el diamante se orienta horizontalmente
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
        {/* Cardinalidad al lado izquierdo para relaciones verticales */}
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
    // Para líneas horizontales, el diamante se orienta verticalmente
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
        {/* Cardinalidad arriba para relaciones horizontales */}
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
        x: isStart ? x - 8 : x + 15, // Child side (end) further away from table for clarity
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
        {/* Para (0,*): Círculo justo antes de la pata de gallo */}
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
        
        {/* Para (1,*): Barra al inicio de la pata de gallo */}
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

        {/* Para (0,1): Círculo antes de la barra - CÍRCULO MÁS CERCA DE LA LÍNEA */}
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
            {/* Barra cerca de la tabla */}
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

        {/* Para (1,1): Dos barras perpendiculares a la línea - COMO CrowParentLines */}
        {isMandatory && isOne && (
          <>
            {/* Primera barra más alejada */}
            <line
              x1={cardinalityEndX - (dx * 10) - (perpX * lineLength)} 
              y1={cardinalityEndY - (dy * 10) - (perpY * lineLength)}
              x2={cardinalityEndX - (dx * 10) + (perpX * lineLength)} 
              y2={cardinalityEndY - (dy * 10) + (perpY * lineLength)}
              stroke="gray" 
              strokeWidth="2" 
              className="group-hover:stroke-sky-700"
            />
            {/* Segunda barra cerca de la tabla */}
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

        {/* Crow's foot que apunta hacia la tabla siguiendo la línea */}
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

  // Calculate the actual direction vector if we have vector information
  let dx = 1, dy = 0; // Default to right-pointing
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

export function subDT(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId) {
  return (
    point && subtypevar === "disjoint_total" && (
      <g transform={`rotate(${angle + 180}, ${point.x}, ${point.y})`}>
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

export function subDP(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId) {
  return (
    point && subtypevar === "disjoint_partial" && (
      <g transform={`rotate(${angle + 180}, ${point.x}, ${point.y})`}>
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

export function subOT(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId) {
  return (
    point && subtypevar === "overlapping_total" && (
      <g transform={`rotate(${angle + 180}, ${point.x}, ${point.y})`}>
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

export function subOP(point, angle, notation, subtypevar, direction, cardinalityStart, cardinalityEnd, onConnectSubtypePoint, relationshipId) {
  return (
    point && subtypevar === "overlapping_partial" && (
      <g transform={`rotate(${angle + 180}, ${point.x}, ${point.y})`}>
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