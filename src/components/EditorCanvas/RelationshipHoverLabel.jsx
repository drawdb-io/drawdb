import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { darkBgTheme } from "../../data/constants";
import { useSettings } from "../../hooks";

// The canvas draws relationship lines beneath the tables, so a name drawn with
// its line would hide behind them. When the pointer enters a line, the
// Relationship component writes the full name to this store.
// RelationshipHoverLabel reads the store and draws the name in a layer that
// the canvas draws after everything else.
let hoveredRelationshipLabel = null;
const hoverListeners = new Set();

export const relationshipHoverLabel = {
  show(label) {
    hoveredRelationshipLabel = label;
    hoverListeners.forEach((listener) => listener());
  },
  hide(relationshipId) {
    if (hoveredRelationshipLabel?.id !== relationshipId) return;
    hoveredRelationshipLabel = null;
    hoverListeners.forEach((listener) => listener());
  },
};

const subscribe = (listener) => {
  hoverListeners.add(listener);
  return () => hoverListeners.delete(listener);
};
const getSnapshot = () => hoveredRelationshipLabel;

const labelPadding = { x: 8, y: 5 };

export default function RelationshipHoverLabel() {
  const label = useSyncExternalStore(subscribe, getSnapshot);
  const { settings } = useSettings();
  const textRef = useRef();
  const [textBounds, setTextBounds] = useState(null);

  useLayoutEffect(() => {
    setTextBounds(label && textRef.current ? textRef.current.getBBox() : null);
  }, [label]);

  if (!label) return null;
  const isDarkMode = settings.mode === "dark";

  return (
    <g className="pointer-events-none">
      {textBounds && (
        <rect
          x={textBounds.x - labelPadding.x}
          y={textBounds.y - labelPadding.y}
          width={textBounds.width + 2 * labelPadding.x}
          height={textBounds.height + 2 * labelPadding.y}
          rx={6}
          fill={isDarkMode ? darkBgTheme : "white"}
          stroke={isDarkMode ? "#4b5563" : "#cbd5e1"}
        />
      )}
      <text
        ref={textRef}
        x={label.x}
        y={label.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={15}
        fontWeight={500}
        fill={isDarkMode ? "lightgrey" : "#333"}
      >
        {label.text}
      </text>
    </g>
  );
}
