// @ts-check

import { useTransform } from "../hooks";
import { createContext, useCallback, useMemo, useState } from "react";
import { useEventListener, useResizeObserver } from "usehooks-ts";

export const CanvasContext = createContext(
  /** @type {DrawDB.CanvasContext} */
  ({
    canvas: {
      screenSize: {
        x: 0,
        y: 0,
      },
      viewBox: new DOMRect(),
    },
    coords: {
      toDiagramSpace(coords) {
        return coords;
      },
      toScreenSpace(coords) {
        return coords;
      },
    },
    pointer: {
      spaces: {
        screen: {
          x: 0,
          y: 0,
        },
        diagram: {
          x: 0,
          y: 0,
        },
      },
      style: "default",
      setStyle() {},
    },
  }),
);

/**
 * @param {React.RefObject} canvasRef
 * @returns {DrawDB.CanvasContext}
 */
export function useCanvasContextProviderValue(canvasRef) {
  const { transform } = useTransform();
  const canvasSize = useResizeObserver({
    ref: canvasRef,
    box: "content-box",
  });
  const screenSize = useMemo(
    () => ({
      x: canvasSize.width ?? 0,
      y: canvasSize.height ?? 0,
    }),
    [canvasSize.height, canvasSize.width],
  );
  const viewBoxSize = useMemo(
    () => ({
      x: screenSize.x / transform.zoom,
      y: screenSize.y / transform.zoom,
    }),
    [screenSize.x, screenSize.y, transform.zoom],
  );
  const viewBox = useMemo(
    () =>
      new DOMRect(
        transform.pan.x - viewBoxSize.x / 2,
        transform.pan.y - viewBoxSize.y / 2,
        viewBoxSize.x,
        viewBoxSize.y,
      ),
    [transform.pan.x, transform.pan.y, viewBoxSize.x, viewBoxSize.y],
  );

  const toDiagramSpace =
    /** @type {DrawDB.CanvasContext["coords"]["toDiagramSpace"]} */ (
      useCallback(
        /**
         * @param {Partial<DrawDB.Vector2d>} coord
         * @returns {Partial<DrawDB.Vector2d>}
         */
        (coord) => ({
          x:
            typeof coord.x === "number"
              ? (coord.x / screenSize.x) * viewBox.width + viewBox.left
              : undefined,
          y:
            typeof coord.y === "number"
              ? (coord.y / screenSize.y) * viewBox.height + viewBox.top
              : undefined,
        }),
        [
          screenSize.x,
          screenSize.y,
          viewBox.height,
          viewBox.left,
          viewBox.top,
          viewBox.width,
        ],
      )
    );

  const toScreenSpace =
    /** @type {DrawDB.CanvasContext["coords"]["toScreenSpace"]} */ (
      useCallback(
        /**
         * @param {Partial<DrawDB.Vector2d>} coord
         * @returns {Partial<DrawDB.Vector2d>}
         */
        (coord) => ({
          x:
            typeof coord.x === "number"
              ? ((coord.x - viewBox.left) / viewBox.width) * screenSize.x
              : undefined,
          y:
            typeof coord.y === "number"
              ? ((coord.y - viewBox.top) / viewBox.height) * screenSize.y
              : undefined,
        }),
        [
          screenSize.x,
          screenSize.y,
          viewBox.height,
          viewBox.left,
          viewBox.top,
          viewBox.width,
        ],
      )
    );

  const [pointerScreenCoords, setPointerScreenCoords] = useState({ x: 0, y: 0 });
  const pointerDiagramCoords = useMemo(
    () => toDiagramSpace(pointerScreenCoords),
    [pointerScreenCoords, toDiagramSpace],
  );
  const [pointerStyle, setPointerStyle] = useState(
    /** @type {DrawDB.CanvasContext["pointer"]["style"]} */ ("default"),
  );

  useEventListener(
    "pointermove",
    (e) => {
      const targetElm = /** @type {HTMLElement | null} */ (e.currentTarget);
      if (!e.isPrimary || !targetElm) return;

      const canvasBounds = targetElm.getBoundingClientRect();

      setPointerScreenCoords({
        x: e.clientX - canvasBounds.left,
        y: e.clientY - canvasBounds.top,
      });
    },
    canvasRef,
  );

  return {
    canvas: {
      screenSize,
      viewBox,
    },
    coords: {
      toDiagramSpace,
      toScreenSpace,
    },
    pointer: {
      spaces: {
        screen: pointerScreenCoords,
        diagram: pointerDiagramCoords,
      },
      style: pointerStyle,
      setStyle: setPointerStyle,
    },
  };
}
