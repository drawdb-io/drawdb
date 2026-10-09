import { useMemo, useRef, useState } from "react";
import {
  useAreas,
  useCanvas,
  useDiagram,
  useNotes,
  useSettings,
  useTransform,
  useViews,
} from "../../hooks";
import { getTableHeight, getTableWidth } from "../../utils/utils";
import {
  getViewHeight,
  getViewWidth,
  resolveViewColumns,
} from "../../utils/views";
import { noteWidth } from "../../data/constants";

export default function Scrollbars() {
  const { tables, relationships } = useDiagram();
  const { views } = useViews();
  const { areas } = useAreas();
  const { notes } = useNotes();
  const { settings } = useSettings();
  const { transform, setTransform } = useTransform();
  const {
    canvas: { viewBox },
  } = useCanvas();

  const hTrackRef = useRef(null);
  const vTrackRef = useRef(null);

  const [isDraggingH, setIsDraggingH] = useState(false);
  const [isDraggingV, setIsDraggingV] = useState(false);
  const dragStartRef = useRef({ pointer: 0, pan: 0 });

  const bounds = useMemo(() => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    tables.forEach((table) => {
      minX = Math.min(minX, table.x);
      minY = Math.min(minY, table.y);
      maxX = Math.max(maxX, table.x + getTableWidth(table));
      maxY = Math.max(
        maxY,
        table.y + getTableHeight(table, settings.showComments, relationships),
      );
    });

    views.forEach((view) => {
      minX = Math.min(minX, view.x);
      minY = Math.min(minY, view.y);
      maxX = Math.max(maxX, view.x + getViewWidth(view));
      maxY = Math.max(
        maxY,
        view.y +
          getViewHeight(
            view,
            resolveViewColumns(view, tables),
            settings.showComments,
          ),
      );
    });

    areas.forEach((area) => {
      minX = Math.min(minX, area.x);
      minY = Math.min(minY, area.y);
      maxX = Math.max(maxX, area.x + area.width);
      maxY = Math.max(maxY, area.y + area.height);
    });

    notes.forEach((note) => {
      minX = Math.min(minX, note.x);
      minY = Math.min(minY, note.y);
      maxX = Math.max(maxX, note.x + (note.width ?? noteWidth));
      maxY = Math.max(maxY, note.y + note.height);
    });

    if (!Number.isFinite(minX)) {
      minX = -500;
      maxX = 500;
      minY = -500;
      maxY = 500;
    }

    return { minX, minY, maxX, maxY };
  }, [tables, views, areas, notes, relationships, settings.showComments]);

  const padding = 400;
  const viewBoxRight = viewBox.left + viewBox.width;
  const viewBoxBottom = viewBox.top + viewBox.height;

  const scrollMinX = Math.min(bounds.minX, viewBox.left) - padding;
  const scrollMaxX = Math.max(bounds.maxX, viewBoxRight) + padding;
  const scrollMinY = Math.min(bounds.minY, viewBox.top) - padding;
  const scrollMaxY = Math.max(bounds.maxY, viewBoxBottom) + padding;

  const totalSpanX = scrollMaxX - scrollMinX;
  const totalSpanY = scrollMaxY - scrollMinY;
  const maxScrollX = Math.max(0, totalSpanX - viewBox.width);
  const maxScrollY = Math.max(0, totalSpanY - viewBox.height);

  const hTrackWidth = hTrackRef.current?.clientWidth || 200;
  const vTrackHeight = vTrackRef.current?.clientHeight || 200;

  const rawThumbWidth =
    totalSpanX > 0 ? (viewBox.width / totalSpanX) * hTrackWidth : hTrackWidth;
  const thumbWidth = Math.max(32, Math.min(hTrackWidth, rawThumbWidth));
  const availableTrackX = Math.max(0, hTrackWidth - thumbWidth);
  const currentScrollX = viewBox.left - scrollMinX;
  const thumbLeft =
    availableTrackX > 0 && maxScrollX > 0
      ? Math.max(
          0,
          Math.min(
            availableTrackX,
            (currentScrollX / maxScrollX) * availableTrackX,
          ),
        )
      : 0;

  const rawThumbHeight =
    totalSpanY > 0
      ? (viewBox.height / totalSpanY) * vTrackHeight
      : vTrackHeight;
  const thumbHeight = Math.max(32, Math.min(vTrackHeight, rawThumbHeight));
  const availableTrackY = Math.max(0, vTrackHeight - thumbHeight);
  const currentScrollY = viewBox.top - scrollMinY;
  const thumbTop =
    availableTrackY > 0 && maxScrollY > 0
      ? Math.max(
          0,
          Math.min(
            availableTrackY,
            (currentScrollY / maxScrollY) * availableTrackY,
          ),
        )
      : 0;

  const handleHThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointer: e.clientX,
      pan: transform.pan.x,
    };
    setIsDraggingH(true);
  };

  const handleHThumbPointerMove = (e) => {
    if (!isDraggingH || availableTrackX <= 0) return;
    const deltaPointer = e.clientX - dragStartRef.current.pointer;
    const deltaDiagram = (deltaPointer / availableTrackX) * maxScrollX;
    setTransform((prev) => ({
      ...prev,
      pan: {
        ...prev.pan,
        x: dragStartRef.current.pan + deltaDiagram,
      },
    }));
  };

  const handleHThumbPointerUp = (e) => {
    if (isDraggingH) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDraggingH(false);
    }
  };

  const handleHTrackClick = (e) => {
    if (e.target !== hTrackRef.current || availableTrackX <= 0) return;
    const rect = hTrackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const targetThumbLeft = clickX - thumbWidth / 2;
    const ratio = Math.max(0, Math.min(1, targetThumbLeft / availableTrackX));
    const targetViewBoxLeft = scrollMinX + ratio * maxScrollX;
    setTransform((prev) => ({
      ...prev,
      pan: {
        ...prev.pan,
        x: targetViewBoxLeft + viewBox.width / 2,
      },
    }));
  };

  const handleVThumbPointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      pointer: e.clientY,
      pan: transform.pan.y,
    };
    setIsDraggingV(true);
  };

  const handleVThumbPointerMove = (e) => {
    if (!isDraggingV || availableTrackY <= 0) return;
    const deltaPointer = e.clientY - dragStartRef.current.pointer;
    const deltaDiagram = (deltaPointer / availableTrackY) * maxScrollY;
    setTransform((prev) => ({
      ...prev,
      pan: {
        ...prev.pan,
        y: dragStartRef.current.pan + deltaDiagram,
      },
    }));
  };

  const handleVThumbPointerUp = (e) => {
    if (isDraggingV) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setIsDraggingV(false);
    }
  };

  const handleVTrackClick = (e) => {
    if (e.target !== vTrackRef.current || availableTrackY <= 0) return;
    const rect = vTrackRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const targetThumbTop = clickY - thumbHeight / 2;
    const ratio = Math.max(0, Math.min(1, targetThumbTop / availableTrackY));
    const targetViewBoxTop = scrollMinY + ratio * maxScrollY;
    setTransform((prev) => ({
      ...prev,
      pan: {
        ...prev.pan,
        y: targetViewBoxTop + viewBox.height / 2,
      },
    }));
  };

  const isDark = settings.mode === "dark";
  const trackThemeClass = isDark
    ? "bg-white/10 hover:bg-white/15"
    : "bg-black/10 hover:bg-black/15";
  const thumbThemeClass = isDark
    ? "bg-white/30 hover:bg-white/50 active:bg-white/60"
    : "bg-black/30 hover:bg-black/50 active:bg-black/60";

  return (
    <>
      {/* Horizontal scrollbar */}
      <div
        ref={hTrackRef}
        onClick={handleHTrackClick}
        className={`absolute bottom-2 left-4 right-14 h-2.5 rounded-full cursor-pointer z-10 transition-colors ${trackThemeClass}`}
      >
        <div
          onPointerDown={handleHThumbPointerDown}
          onPointerMove={handleHThumbPointerMove}
          onPointerUp={handleHThumbPointerUp}
          onPointerCancel={handleHThumbPointerUp}
          style={{
            width: `${thumbWidth}px`,
            transform: `translateX(${thumbLeft}px)`,
          }}
          className={`h-full rounded-full cursor-grab active:cursor-grabbing transition-transform will-change-transform ${thumbThemeClass} ${
            isDraggingH ? "cursor-grabbing" : ""
          }`}
        />
      </div>

      {/* Vertical scrollbar */}
      <div
        ref={vTrackRef}
        onClick={handleVTrackClick}
        className={`absolute top-4 right-2 bottom-14 w-2.5 rounded-full cursor-pointer z-10 transition-colors ${trackThemeClass}`}
      >
        <div
          onPointerDown={handleVThumbPointerDown}
          onPointerMove={handleVThumbPointerMove}
          onPointerUp={handleVThumbPointerUp}
          onPointerCancel={handleVThumbPointerUp}
          style={{
            height: `${thumbHeight}px`,
            transform: `translateY(${thumbTop}px)`,
          }}
          className={`w-full rounded-full cursor-grab active:cursor-grabbing transition-transform will-change-transform ${thumbThemeClass} ${
            isDraggingV ? "cursor-grabbing" : ""
          }`}
        />
      </div>
    </>
  );
}
