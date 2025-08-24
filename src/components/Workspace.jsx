import { useState, useEffect, useCallback, createContext } from "react";
import ControlPanel from "./EditorHeader/ControlPanel";
import Canvas from "./EditorCanvas/Canvas";
import { CanvasContextProvider } from "../context/CanvasContext";
import SidePanel from "./EditorSidePanel/SidePanel";
import { DB, State } from "../data/constants";
import { db } from "../data/db";
import {
  useLayout,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useAreas,
  useNotes,
  useTypes,
  useTasks,
  useSaveState,
  useEnums,
} from "../hooks";
import FloatingControls from "./FloatingControls";
import { Button, Modal, Tag } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";
import { useSearchParams } from "react-router-dom";
import { get, SHARE_FILENAME } from "../api/gists";

export const IdContext = createContext({
  gistId: "",
  setGistId: () => {},
  version: "",
  setVersion: () => {},
});

const SIDEPANEL_MIN_WIDTH = 384;

export default function WorkSpace() {
  const [id, setId] = useState(0);
  const [gistId, setGistId] = useState("");
  const [version, setVersion] = useState("");
  const [loadedFromGistId, setLoadedFromGistId] = useState("");
  const [title, setTitle] = useState("Untitled Diagram");
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(SIDEPANEL_MIN_WIDTH);
  const [lastSaved, setLastSaved] = useState("");
  const [showSelectDbModal, setShowSelectDbModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState("");
  const { layout, setLayout } = useLayout();
  const { settings } = useSettings();
  const { types, setTypes } = useTypes();
  const { areas, setAreas } = useAreas();
  const { tasks, setTasks } = useTasks();
  const { notes, setNotes } = useNotes();
  const { saveState, setSaveState } = useSaveState();
  const { transform, setTransform } = useTransform();
  const { enums, setEnums } = useEnums();
  const {
    tables,
    relationships,
    setTables,
    setRelationships,
    database,
    setDatabase,
  } = useDiagram();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { t, i18n } = useTranslation();
  let [searchParams, setSearchParams] = useSearchParams();
  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > SIDEPANEL_MIN_WIDTH) setWidth(w);
  };

  const save = useCallback(async () => {
    const name = window.name.split(" ");
    const op = name[0];
    const saveAsDiagram = window.name === "" || op === "d" || op === "lt";

    if (saveAsDiagram) {
      searchParams.delete("shareId");
      setSearchParams(searchParams);
      if ((id === 0 && window.name === "") || op === "lt") {
        await db.diagrams
          .add({
            database: database,
            name: title,
            gistId: gistId ?? "",
            lastModified: new Date(),
            tables: tables,
            references: relationships,
            notes: notes,
            areas: areas,
            todos: tasks,
            pan: transform.pan,
            zoom: transform.zoom,
            loadedFromGistId: loadedFromGistId,
            ...(databases[database].hasEnums && { enums: enums }),
            ...(databases[database].hasTypes && { types: types }),
          })
          .then((id) => {
            setId(id);
            window.name = `d ${id}`;
            setSaveState(State.SAVED);
            setLastSaved(new Date().toLocaleString());
          });
      } else {
        await db.diagrams
          .update(id, {
            database: database,
            name: title,
            lastModified: new Date(),
            tables: tables,
            references: relationships,
            notes: notes,
            areas: areas,
            todos: tasks,
            gistId: gistId ?? "",
            pan: transform.pan,
            zoom: transform.zoom,
            loadedFromGistId: loadedFromGistId,
            ...(databases[database].hasEnums && { enums: enums }),
            ...(databases[database].hasTypes && { types: types }),
          })
          .then(() => {
            setSaveState(State.SAVED);
            setLastSaved(new Date().toLocaleString());
          });
      }
    } else {
      await db.templates
        .update(id, {
          database: database,
          title: title,
          tables: tables,
          relationships: relationships,
          notes: notes,
          subjectAreas: areas,
          todos: tasks,
          pan: transform.pan,
          zoom: transform.zoom,
          ...(databases[database].hasEnums && { enums: enums }),
          ...(databases[database].hasTypes && { types: types }),
        })
        .then(() => {
          setSaveState(State.SAVED);
          setLastSaved(new Date().toLocaleString());
        })
        .catch(() => {
          setSaveState(State.ERROR);
        });
    }
  }, [
    searchParams,
    setSearchParams,
    tables,
    relationships,
    notes,
    areas,
    types,
    title,
    id,
    tasks,
    transform,
    setSaveState,
    database,
    enums,
    gistId,
    loadedFromGistId,
  ]);

  const load = useCallback(async () => {
    const loadLatestDiagram = async () => {
      await db.diagrams
        .orderBy("lastModified")
        .last()
        .then((d) => {
          if (d) {
            if (d.database) {
              setDatabase(d.database);
            } else {
              setDatabase(DB.GENERIC);
            }
            setId(d.id);
            setGistId(d.gistId);
            setLoadedFromGistId(d.loadedFromGistId);
            setTitle(d.name);
            setTables(d.tables);
            setRelationships(d.references);
            setNotes(d.notes);
            setAreas(d.areas);
            setTasks(d.todos ?? []);
            setTransform({ pan: d.pan, zoom: d.zoom });
            if (databases[database].hasTypes) {
              setTypes(d.types ?? []);
            }
            if (databases[database].hasEnums) {
              setEnums(d.enums ?? []);
            }
            window.name = `d ${d.id}`;
          } else {
            window.name = "";
            if (selectedDb === "") setShowSelectDbModal(true);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadDiagram = async (id) => {
      await db.diagrams
        .get(id)
        .then((diagram) => {
          if (diagram) {
            if (diagram.database) {
              setDatabase(diagram.database);
            } else {
              setDatabase(DB.GENERIC);
            }
            setId(diagram.id);
            setGistId(diagram.gistId);
            setLoadedFromGistId(diagram.loadedFromGistId);
            setTitle(diagram.name);
            setTables(diagram.tables);
            setRelationships(diagram.references);
            setAreas(diagram.areas);
            setNotes(diagram.notes);
            setTasks(diagram.todos ?? []);
            setTransform({
              pan: diagram.pan,
              zoom: diagram.zoom,
            });
            setUndoStack([]);
            setRedoStack([]);
            if (databases[database].hasTypes) {
              setTypes(diagram.types ?? []);
            }
            if (databases[database].hasEnums) {
              setEnums(diagram.enums ?? []);
            }
            window.name = `d ${diagram.id}`;
          } else {
            window.name = "";
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadTemplate = async (id) => {
      await db.templates
        .get(id)
        .then((diagram) => {
          if (diagram) {
            if (diagram.database) {
              setDatabase(diagram.database);
            } else {
              setDatabase(DB.GENERIC);
            }
            setId(diagram.id);
            setTitle(diagram.title);
            setTables(diagram.tables);
            setRelationships(diagram.relationships);
            setAreas(diagram.subjectAreas);
            setTasks(diagram.todos ?? []);
            setNotes(diagram.notes);
            setTransform({
              zoom: 1,
              pan: { x: 0, y: 0 },
            });
            setUndoStack([]);
            setRedoStack([]);
            if (databases[database].hasTypes) {
              setTypes(diagram.types ?? []);
            }
            if (databases[database].hasEnums) {
              setEnums(diagram.enums ?? []);
            }
          } else {
            if (selectedDb === "") setShowSelectDbModal(true);
          }
        })
        .catch((error) => {
          console.log(error);
          if (selectedDb === "") setShowSelectDbModal(true);
        });
    };

    const loadFromGist = async (shareId) => {
      try {
        const { data } = await get(shareId);
        const parsedDiagram = JSON.parse(data.files[SHARE_FILENAME].content);
        setUndoStack([]);
        setRedoStack([]);
        setGistId(shareId);
        setLoadedFromGistId(shareId);
        setDatabase(parsedDiagram.database);
        setTitle(parsedDiagram.title);
        setTables(parsedDiagram.tables);
        setRelationships(parsedDiagram.relationships);
        setNotes(parsedDiagram.notes);
        setAreas(parsedDiagram.subjectAreas);
        setTransform(parsedDiagram.transform);
        if (databases[parsedDiagram.database].hasTypes) {
          setTypes(parsedDiagram.types ?? []);
        }
        if (databases[parsedDiagram.database].hasEnums) {
          setEnums(parsedDiagram.enums ?? []);
        }
      } catch (e) {
        console.log(e);
        setSaveState(State.FAILED_TO_LOAD);
      }
    };

    const shareId = searchParams.get("shareId");
    if (shareId) {
      const existingDiagram = await db.diagrams.get({
        loadedFromGistId: shareId,
      });

      if (existingDiagram) {
        window.name = "d " + existingDiagram.id;
        setId(existingDiagram.id);
      } else {
        window.name = "";
        setId(0);
      }
      await loadFromGist(shareId);
      return;
    }

    if (window.name === "") {
      await loadLatestDiagram();
    } else {
      const name = window.name.split(" ");
      const op = name[0];
      const id = parseInt(name[1]);
      switch (op) {
        case "d": {
          await loadDiagram(id);
          break;
        }
        case "t":
        case "lt": {
          await loadTemplate(id);
          break;
        }
        default:
          break;
      }
    }
  }, [
    setTransform,
    setRedoStack,
    setUndoStack,
    setRelationships,
    setTables,
    setAreas,
    setNotes,
    setTypes,
    setTasks,
    setDatabase,
    database,
    setEnums,
    selectedDb,
    setSaveState,
    searchParams,
  ]);

  const returnToCurrentDiagram = async () => {
    await load();
    setLayout((prev) => ({ ...prev, readOnly: false }));
    setVersion(null);
  };

  useEffect(() => {
    if (
      tables?.length === 0 &&
      areas?.length === 0 &&
      notes?.length === 0 &&
      types?.length === 0 &&
      tasks?.length === 0
    )
      return;

    if (settings.autosave) {
      setSaveState(State.SAVING);
    }
  }, [
    undoStack,
    redoStack,
    settings.autosave,
    tables?.length,
    areas?.length,
    notes?.length,
    types?.length,
    relationships?.length,
    tasks?.length,
    transform.zoom,
    title,
    gistId,
    setSaveState,
  ]);

  useEffect(() => {
    if (layout.readOnly) return;

    if (saveState !== State.SAVING) return;

    save();
  }, [saveState, layout, save]);

  useEffect(() => {
    document.title = "Editor | drawDB";

    load();
  }, [load]);

  return (
    <div className="h-full flex flex-col overflow-hidden theme">
      <IdContext.Provider value={{ gistId, setGistId, version, setVersion }}>
        <ControlPanel
          diagramId={id}
          setDiagramId={setId}
          title={title}
          setTitle={setTitle}
          lastSaved={lastSaved}
          setLastSaved={setLastSaved}
        />
      </IdContext.Provider>
      <div
        className="flex h-full overflow-y-auto"
        onPointerUp={(e) => e.isPrimary && setResize(false)}
        onPointerLeave={(e) => e.isPrimary && setResize(false)}
        onPointerMove={(e) => e.isPrimary && handleResize(e)}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        {layout.sidebar && (
          <SidePanel resize={resize} setResize={setResize} width={width} />
        )}
        <div className="relative w-full h-full overflow-hidden">
          <CanvasContextProvider className="h-full w-full">
            <Canvas saveState={saveState} setSaveState={setSaveState} />
          </CanvasContextProvider>
          {version && (
            <div className="absolute right-8 top-2 space-x-2">
              <Button
                icon={<i className="fa-solid fa-rotate-right mt-0.5"></i>}
                onClick={() => setShowRestoreModal(true)}
              >
                {t("restore_version")}
              </Button>
              <Button
                type="tertiary"
                onClick={returnToCurrentDiagram}
                icon={<i className="bi bi-arrow-return-right mt-1"></i>}
              >
                {t("return_to_current")}
              </Button>
            </div>
          )}
          {!(layout.sidebar || layout.toolbar || layout.header) && (
            <div className="fixed right-5 bottom-4">
              <FloatingControls />
            </div>
          )}
        </div>
      </div>
      <Modal
        centered
        size="medium"
        closable={false}
        hasCancel={false}
        title={t("pick_db")}
        okText={t("confirm")}
        visible={showSelectDbModal}
        onOk={() => {
          if (selectedDb === "") return;
          setDatabase(selectedDb);
          setShowSelectDbModal(false);
        }}
        okButtonProps={{ disabled: selectedDb === "" }}
      >
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {Object.values(databases).map((x) => (
            <div
              key={x.name}
              onClick={() => setSelectedDb(x.label)}
              className={`space-y-3 p-3 rounded-md border-2 select-none ${
                settings.mode === "dark"
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-100 hover:bg-zinc-200"
              } ${selectedDb === x.label ? "border-zinc-400" : "border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{x.name}</div>
                {x.beta && (
                  <Tag size="small" color="light-blue">
                    Beta
                  </Tag>
                )}
              </div>
              {x.image && (
                <img
                  src={x.image}
                  className="h-8"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                />
              )}
              <div className="text-xs">{x.description}</div>
            </div>
          ))}
        </div>
      </Modal>
      <Modal
        visible={showRestoreModal}
        centered
        closable
        onCancel={() => setShowRestoreModal(false)}
        title={
          <span className="flex items-center gap-2">
            <IconAlertTriangle className="text-amber-400" size="extra-large" />{" "}
            {t("restore_version")}
          </span>
        }
        okText={t("continue")}
        cancelText={t("cancel")}
        onOk={() => {
          setLayout((prev) => ({ ...prev, readOnly: false }));
          setShowRestoreModal(false);
          setVersion(null);
        }}
      >
        {t("restore_warning")}
      </Modal>
    </div>
  );
}
