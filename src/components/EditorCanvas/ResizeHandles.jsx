import { useEffect, useRef, useState } from "react";
import { clampTableWidth } from "../../utils/utils";
import { useSettings } from "../../hooks";

const handleRadius = 6;
const handleHitWidth = handleRadius * 2 + 2;
const handleInset = 6;

export default function ResizeHandles({
  x,
  y,
  width,
  height,
  zoom,
  visible,
  onResize,
  onResizeEnd,
  onEngagedChange,
}) {
  const { settings } = useSettings();
  const [active, setActive] = useState(null);
  const [hovered, setHovered] = useState(null);
  const latestRef = useRef(null);
  const detachRef = useRef(null);
  latestRef.current = { x, width, onResize, onResizeEnd, onEngagedChange };

  const engaged = hovered !== null || active !== null;

  useEffect(() => {
    latestRef.current.onEngagedChange?.(engaged);
  }, [engaged]);

  useEffect(() => () => detachRef.current?.(), []);

  const beginResize = (side) => (e) => {
    if (!e.isPrimary) return;
    e.stopPropagation();

    const from = {
      x,
      width,
      clientX: e.clientX,
      pointerId: e.pointerId,
      zoom: zoom || 1,
    };
    setActive(side);

    const move = (event) => {
      if (event.pointerId !== from.pointerId) return;

      const latest = latestRef.current;
      const delta = (event.clientX - from.clientX) / from.zoom;
      const next = clampTableWidth(
        side === "left" ? from.width - delta : from.width + delta,
      );
      if (next === latest.width) return;

      latest.onResize(
        side === "left"
          ? { width: next, x: from.x + from.width - next }
          : { width: next },
      );
    };

    const stop = (event) => {
      if (event && event.pointerId !== from.pointerId) return;

      detachRef.current?.();
      detachRef.current = null;
      setActive(null);

      const latest = latestRef.current;
      if (from.width === latest.width && from.x === latest.x) return;
      latest.onResizeEnd(
        { x: from.x, width: from.width },
        { x: latest.x, width: latest.width },
      );
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
    window.addEventListener("pointercancel", stop);
    detachRef.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      window.removeEventListener("pointercancel", stop);
    };
  };

  const handle = (side) => {
    const edgeX = side === "left" ? x : x + width;
    const barHeight = Math.max(0, height - handleInset * 2);
    return (
      <g key={side}>
        {(visible || engaged) && (
          <circle
            cx={edgeX}
            cy={y + height / 2}
            r={handleRadius}
            fill={settings.mode === "light" ? "white" : "rgb(28, 31, 35)"}
            stroke="#5891db"
            strokeWidth={2}
            className="pointer-events-none"
          />
        )}
        <rect
          x={edgeX - handleHitWidth / 2}
          y={y + handleInset}
          width={handleHitWidth}
          height={barHeight}
          fill="transparent"
          style={{ cursor: "ew-resize", touchAction: "none" }}
          onPointerEnter={(e) => e.isPrimary && setHovered(side)}
          onPointerLeave={(e) => e.isPrimary && setHovered(null)}
          onPointerDown={beginResize(side)}
        />
      </g>
    );
  };

  return (
    <>
      {handle("left")}
      {handle("right")}
    </>
  );
}
