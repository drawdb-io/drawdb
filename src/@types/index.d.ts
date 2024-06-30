// @ts-check

import { Dispatch, SetStateAction } from "react";
import { Action, ObjectType } from "../data/constants";

type CursorStyle = "default" | "grabbing";

declare global {
  namespace DrawDB {
    export interface Vector2d {
      x: number;
      y: number;
    }

    export interface UndoRedoItem {
      action: (typeof Action)[keyof typeof Action];
      element: (typeof ObjectType)[keyof typeof ObjectType];
      undo: any;
      redo: any;
      message: string;
    }

    export interface UndoRedoContext {
      undoStack: UndoRedoItem[];
      setUndoStack: React.Dispatch<React.SetStateAction<UndoRedoItem[]>>;
      redoStack: UndoRedoItem[];
      setRedoStack: React.Dispatch<React.SetStateAction<UndoRedoItem[]>>;
    }

    export interface TransformContext {
      transform: {
        pan: Vector2d;
        zoom: number;
      };
      setTransform: Dispatch<SetStateAction<TransformContext["transform"]>>;
    }

    export interface SettingsContext {
      settings: {
        strictMode: boolean;
        showFieldSummary: boolean;
        showGrid: boolean;
        mode: "light" | "dark";
        autosave: boolean;
        panning: boolean;
        showCardinality: boolean;
        tableWidth: number;
        showDebugCoordinates: boolean;
      };
      setSettings: Dispatch<SetStateAction<SettingsContext["settings"]>>;
    }

    export interface CanvasContext {
      canvas: {
        screenSize: Vector2d;
        viewBox: DOMRect;
      };
      coords: {
        toDiagramSpace(coords: Vector2d): Vector2d;
        toDiagramSpace(coords: Pick<Vector2d, "x">): Pick<Vector2d, "x">;
        toDiagramSpace(coords: Pick<Vector2d, "y">): Pick<Vector2d, "y">;
        toScreenSpace(coords: Vector2d): Vector2d;
        toScreenSpace(coords: Pick<Vector2d, "x">): Pick<Vector2d, "x">;
        toScreenSpace(coords: Pick<Vector2d, "y">): Pick<Vector2d, "y">;
      };
      pointer: {
        spaces: {
          screen: DrawDB.Vector2d;
          diagram: DrawDB.Vector2d;
        };
        style: CursorStyle;
        setStyle: Dispatch<SetStateAction<CursorStyle>>;
      };
    }
  }
}
