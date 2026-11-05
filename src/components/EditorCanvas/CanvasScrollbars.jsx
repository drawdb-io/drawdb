import { useRef } from "react";
import { useTransform } from "../../hooks";

const marginAroundDiagram = 200;
const minimumThumbPixels = 24;

// The canvas has no edges, so we measure the scrollbars against the diagram
// itself: the bounds of every table, area, note and view, plus a margin,
// joined with the part of the diagram on screen. We hide a bar when the screen
// already shows the whole diagram along that bar's axis.
export default function CanvasScrollbars({ viewBox, contentBounds }) {
  if (!contentBounds || !viewBox.width || !viewBox.height) return null;

  const scrollableExtent = {
    left: Math.min(contentBounds.left - marginAroundDiagram, viewBox.left),
    top: Math.min(contentBounds.top - marginAroundDiagram, viewBox.top),
    right: Math.max(contentBounds.right + marginAroundDiagram, viewBox.right),
    bottom: Math.max(
      contentBounds.bottom + marginAroundDiagram,
      viewBox.bottom,
    ),
  };

  return (
    <>
      <Scrollbar
        axis="x"
        start={scrollableExtent.left}
        length={scrollableExtent.right - scrollableExtent.left}
        viewStart={viewBox.left}
        viewLength={viewBox.width}
      />
      <Scrollbar
        axis="y"
        start={scrollableExtent.top}
        length={scrollableExtent.bottom - scrollableExtent.top}
        viewStart={viewBox.top}
        viewLength={viewBox.height}
      />
    </>
  );
}

function Scrollbar({ axis, start, length, viewStart, viewLength }) {
  const { setTransform } = useTransform();
  const trackRef = useRef(null);
  const dragRef = useRef(null);

  const visibleFraction = viewLength / length;
  if (visibleFraction >= 0.999) return null;

  const horizontal = axis === "x";
  const thumbStartFraction = (viewStart - start) / length;

  const getTrackLengthPixels = () => {
    const trackBounds = trackRef.current.getBoundingClientRect();
    return horizontal ? trackBounds.width : trackBounds.height;
  };
  const getPointerPosition = (e) => (horizontal ? e.clientX : e.clientY);

  const panBy = (diagramUnits) =>
    setTransform((prev) => ({
      ...prev,
      pan: { ...prev.pan, [axis]: prev.pan[axis] + diagramUnits },
    }));

  // onThumbDown fixes the ratio of diagram units to track pixels for the whole
  // drag, so the thumb stays under the pointer even while the extent grows.
  const onThumbDown = (e) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      lastPointerPosition: getPointerPosition(e),
      diagramUnitsPerPixel: length / getTrackLengthPixels(),
    };
  };
  const onThumbMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const pointerPosition = getPointerPosition(e);
    panBy(
      (pointerPosition - drag.lastPointerPosition) * drag.diagramUnitsPerPixel,
    );
    drag.lastPointerPosition = pointerPosition;
  };
  const onThumbUp = (e) => {
    dragRef.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // A click on the track beside the thumb pans the view nine tenths of a
  // screen toward the click.
  const onTrackDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const trackBounds = trackRef.current.getBoundingClientRect();
    const clickedFraction =
      (getPointerPosition(e) -
        (horizontal ? trackBounds.left : trackBounds.top)) /
      getTrackLengthPixels();
    panBy(
      clickedFraction < thumbStartFraction
        ? -viewLength * 0.9
        : viewLength * 0.9,
    );
  };

  const thumbStyle = horizontal
    ? {
        left: `${thumbStartFraction * 100}%`,
        width: `max(${visibleFraction * 100}%, ${minimumThumbPixels}px)`,
      }
    : {
        top: `${thumbStartFraction * 100}%`,
        height: `max(${visibleFraction * 100}%, ${minimumThumbPixels}px)`,
      };

  return (
    <div
      ref={trackRef}
      onPointerDown={onTrackDown}
      className={`absolute z-10 group/scroll ${
        horizontal
          ? "left-1 right-4 bottom-0.5 h-3"
          : "top-1 bottom-4 right-0.5 w-3"
      }`}
    >
      <div
        onPointerDown={onThumbDown}
        onPointerMove={onThumbMove}
        onPointerUp={onThumbUp}
        onPointerCancel={onThumbUp}
        style={thumbStyle}
        className={`absolute rounded-full bg-zinc-500/40 hover:bg-zinc-500/70 active:bg-zinc-500/80 group-hover/scroll:bg-zinc-500/60 ${
          horizontal ? "top-0.5 bottom-0.5" : "left-0.5 right-0.5"
        }`}
      />
    </div>
  );
}
