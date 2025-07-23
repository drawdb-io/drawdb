export function CrowParentLines(
  cardinalityStartX,
  cardinalityStartY,
  direction,
) {
  return (
    <>
      <line
        x1={cardinalityStartX - (15 * direction)}
        y1={cardinalityStartY + 10}
        x2={cardinalityStartX - (15 * direction)}
        y2={cardinalityStartY - 10}
        stroke="gray"
        strokeWidth="2"
        className="group-hover:fill-sky-700"
      />
      <line
        x1={cardinalityStartX - (10 * direction)}
        y1={cardinalityStartY + 10}
        x2={cardinalityStartX - (10 * direction)}
        y2={cardinalityStartY - 10}
        stroke="gray"
        strokeWidth="2"
        className="group-hover:fill-sky-700"
      />
    </>
  );
}

export function CrowParentDiamond(
  cardinalityStartX,
  cardinalityStartY,
  direction,
) {
  return (
    <polygon
      points={`
        ${cardinalityStartX - (10 * direction)},${cardinalityStartY}
        ${cardinalityStartX - (15 * direction)},${cardinalityStartY - 5}
        ${cardinalityStartX - (20 * direction)},${cardinalityStartY}
        ${cardinalityStartX - (15 * direction)},${cardinalityStartY + 5}
      `}
      stroke="gray"
      strokeWidth="2"
      fill="white"
      className="group-hover:fill-sky-700"
    />
  );
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
  showCardinality
) {
  const isMandatory = cardinalityEnd.startsWith("(1"); // (1,1) o (1,*)
  const isOptional = cardinalityEnd.startsWith("(0");  // (0,1) o (0,*)
  const isMany = cardinalityEnd.endsWith("*)");         // (1,*) o (0,*)
  const isOne = cardinalityEnd.endsWith("1)");          // (1,1) o (0,1)
  return (
    pathRef && (
      <>
        {isMany && (
          <>
            <line
              x1={cardinalityEndX - (15 * direction)} y1={cardinalityEndY}
              x2={cardinalityEndX} y2={cardinalityEndY - 10}
              stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700"
            />
            <line
              x1={cardinalityEndX - (15 * direction)} y1={cardinalityEndY}
              x2={cardinalityEndX} y2={cardinalityEndY + 10}
              stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700"
            />
            <line
              x1={cardinalityEndX - (15 * direction)} y1={cardinalityEndY}
              x2={cardinalityEndX} y2={cardinalityEndY}
              stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700"
            />
          </>
        )}
        {isOne && (
          <line
            x1={cardinalityEndX - (12 * direction)} y1={cardinalityEndY + 10}
            x2={cardinalityEndX - (12 * direction)} y2={cardinalityEndY - 10}
            stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700"
          />
        )}
        {isOptional && (
          <circle
            cx={cardinalityEndX - (16 * direction)} cy={cardinalityEndY}
            r="4" stroke="gray" strokeWidth="2" fill="white"
            className="group-hover:stroke-sky-700"
          />
        )}
        {isMandatory && (
          <line
            x1={cardinalityEndX - (17 * direction)} y1={cardinalityEndY + 10}
            x2={cardinalityEndX - (17 * direction)} y2={cardinalityEndY - 10}
            stroke="gray" strokeWidth="2" className="group-hover:stroke-sky-700"
          />
        )}
        {showCardinality && (
          <>
            <text
              x={cardinalityStartX - 8}
              y={cardinalityStartY - 20}
              fill="gray" strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <text
              x={cardinalityEndX - 8}
              y={cardinalityEndY - 20}
              fill="gray"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </>
        )}
      </>
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
  cardinalityEnd
) {
  return(
      pathRef && (
        <>
            <circle
              cx={cardinalityStartX}
              cy={cardinalityStartY}
              r="12"
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
              r="12"
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
          </>
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
  showCardinality
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

  return (
    pathRef && (
      <>
        <circle
          cx={cardinalityEndX - (5 * direction)}
          cy={cardinalityEndY}
          r="4"
          stroke="gray"
          strokeWidth="1"
          fill="gray"
          className="group-hover:fill-sky-700 group-hover:stroke-sky-700"
        />
        {letter && (
          <text
            x={cardinalityEndX - (14 * direction)}
            y={cardinalityEndY + 14}
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
              x={cardinalityStartX - 8}
              y={cardinalityStartY - 20}
              fill="gray"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityStart}
            </text>
            <text
              x={cardinalityEndX - 8}
              y={cardinalityEndY - 20}
              fill="gray"
              strokeWidth="0.5"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {cardinalityEnd}
            </text>
          </>
        )}
      </>
    )
  );
}