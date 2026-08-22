import {
  closestCenter,
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableItem } from "./SortableItem";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VIRTUALIZE_THRESHOLD = 150;
const ESTIMATED_ROW_HEIGHT = 48;
const VIRTUAL_OVERSCAN_ROWS = 8;

export function SortableList({
  items,
  onChange,
  afterChange,
  renderItem,
  keyPrefix,
  selectedId,
}) {
  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onChange(newItems);
      afterChange();
    }
  };

  const content =
    items.length >= VIRTUALIZE_THRESHOLD ? (
      <VirtualSortableItems
        items={items}
        keyPrefix={keyPrefix}
        renderItem={renderItem}
        selectedId={selectedId}
      />
    ) : (
      items.map((item, i) => (
        <SortableItem
          id={item.id}
          key={`${keyPrefix}-sortable-item-${item.id}`}
        >
          {renderItem(item, i)}
        </SortableItem>
      ))
    );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {content}
      </SortableContext>
    </DndContext>
  );
}

function VirtualSortableItems({ items, keyPrefix, renderItem, selectedId }) {
  const containerRef = useRef(null);
  const frameRef = useRef(null);
  const heightsRef = useRef(new Map());
  const [scrollState, setScrollState] = useState({ top: 0, height: 600 });
  const [measurementVersion, setMeasurementVersion] = useState(0);

  const measureContainer = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setScrollState({
      top: container.scrollTop,
      height: container.clientHeight,
    });
  }, []);

  useEffect(() => {
    measureContainer();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measureContainer);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [measureContainer]);

  useEffect(() => {
    const ids = new Set(items.map((item) => item.id));
    for (const id of heightsRef.current.keys()) {
      if (!ids.has(id)) heightsRef.current.delete(id);
    }
  }, [items]);

  const onScroll = () => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      measureContainer();
    });
  };

  const onMeasure = useCallback((id, height) => {
    const previous = heightsRef.current.get(id);
    if (previous === height) return;
    heightsRef.current.set(id, height);
    setMeasurementVersion((version) => version + 1);
  }, []);

  const layout = useMemo(() => {
    const offsets = new Array(items.length);
    let totalHeight = 0;
    items.forEach((item, index) => {
      offsets[index] = totalHeight;
      totalHeight += heightsRef.current.get(item.id) ?? ESTIMATED_ROW_HEIGHT;
    });
    return { offsets, totalHeight };
    // Measurements are held in a ref; the version invalidates this calculation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, measurementVersion]);

  const visibleIndices = useMemo(() => {
    const lowerBound = Math.max(
      0,
      scrollState.top - VIRTUAL_OVERSCAN_ROWS * ESTIMATED_ROW_HEIGHT,
    );
    const upperBound =
      scrollState.top +
      scrollState.height +
      VIRTUAL_OVERSCAN_ROWS * ESTIMATED_ROW_HEIGHT;
    const indices = [];

    for (let index = 0; index < items.length; index++) {
      const top = layout.offsets[index];
      const height =
        heightsRef.current.get(items[index].id) ?? ESTIMATED_ROW_HEIGHT;
      if (top + height >= lowerBound && top <= upperBound) indices.push(index);
      if (top > upperBound) break;
    }

    const selectedIndex = items.findIndex((item) => item.id === selectedId);
    if (selectedIndex >= 0 && !indices.includes(selectedIndex)) {
      indices.push(selectedIndex);
      indices.sort((left, right) => left - right);
    }
    return indices;
  }, [items, layout.offsets, scrollState, selectedId]);

  useEffect(() => {
    const selectedIndex = items.findIndex((item) => item.id === selectedId);
    const container = containerRef.current;
    if (selectedIndex < 0 || !container) return;

    const top = layout.offsets[selectedIndex];
    const height =
      heightsRef.current.get(items[selectedIndex].id) ?? ESTIMATED_ROW_HEIGHT;
    if (
      top < container.scrollTop ||
      top + height > container.scrollTop + container.clientHeight
    ) {
      container.scrollTo({ top, behavior: "smooth" });
    }
  }, [items, layout.offsets, selectedId]);

  return (
    <div
      ref={containerRef}
      onScroll={onScroll}
      className="relative h-[calc(100vh-190px)] min-h-64 overflow-y-auto"
    >
      <div className="relative" style={{ height: layout.totalHeight }}>
        {visibleIndices.map((index) => {
          const item = items[index];
          return (
            <MeasuredRow
              id={item.id}
              key={`${keyPrefix}-virtual-item-${item.id}`}
              onMeasure={onMeasure}
              top={layout.offsets[index]}
            >
              <SortableItem id={item.id}>
                {renderItem(item, index)}
              </SortableItem>
            </MeasuredRow>
          );
        })}
      </div>
    </div>
  );
}

function MeasuredRow({ id, onMeasure, top, children }) {
  const rowRef = useRef(null);

  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () =>
      onMeasure(id, Math.ceil(row.getBoundingClientRect().height));
    measure();
    if (typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [id, onMeasure]);

  return (
    <div ref={rowRef} className="absolute inset-x-0" style={{ top }}>
      {children}
    </div>
  );
}
