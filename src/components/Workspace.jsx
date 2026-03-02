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
  useSaveState,
  useEnums,
} from "../hooks";
import FloatingControls from "./FloatingControls";
import { Button, Modal, Tag } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";
import {
  useMatch,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { get, SHARE_FILENAME } from "../api/gists";
import { nanoid } from "nanoid";

export const IdContext = createContext({
  gistId: "",
  setGistId: () => {},
  version: "",
  setVersion: () => {},
});

const SIDEPANEL_MIN_WIDTH = 384;

export default function WorkSpace() {
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
  const { id: loadedDiagramId } = useParams();
  const isDiagram = useMatch("/editor/diagrams/:id");
  const isTemplate = useMatch("/editor/templates/:id");

  const navigate = useNavigate();

  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > SIDEPANEL_MIN_WIDTH) setWidth(w);
  };

  const save = useCallback(async () => {
    if (searchParams.has("shareId")) {
      searchParams.delete("shareId");
      setSearchParams(searchParams, { replace: true });
    }

    if (isTemplate || (!loadedDiagramId && !isTemplate && !isDiagram)) {
      const diagramId = crypto.randomUUID();
      await db.diagrams
        .add({
          diagramId,
          database: database,
          name: title,
          gistId: gistId ?? "",
          lastModified: new Date(),
          tables: tables,
          references: relationships,
          notes: notes,
          areas: areas,
          pan: transform.pan,
          zoom: transform.zoom,
          loadedFromGistId: loadedFromGistId,
          ...(databases[database].hasEnums && { enums: enums }),
          ...(databases[database].hasTypes && { types: types }),
        })
        .then(() => {
          navigate(`/editor/diagrams/${diagramId}`, { replace: true });
          setSaveState(State.SAVED);
          setLastSaved(new Date().toLocaleString());
        });
    } else {
      await db.diagrams
        .where("diagramId")
        .equals(loadedDiagramId)
        .modify({
          database: database,
          name: title,
          lastModified: new Date(),
          tables: tables,
          references: relationships,
          notes: notes,
          areas: areas,
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
  }, [
    searchParams,
    setSearchParams,
    tables,
    relationships,
    notes,
    areas,
    types,
    title,
    transform,
    setSaveState,
    database,
    enums,
    gistId,
    loadedFromGistId,
    isDiagram,
    isTemplate,
    loadedDiagramId,
    navigate,
  ]);

  const load = useCallback(async () => {
    const loadLatestDiagram = async () => {
      await db.diagrams
        .orderBy("lastModified")
        .last()
        .then((diagram) => {
          if (diagram) {
            if (diagram.database) {
              setDatabase(diagram.database);
            } else {
              setDatabase(DB.GENERIC);
            }
            setGistId(diagram.gistId);
            setLoadedFromGistId(diagram.loadedFromGistId);
            setTitle(diagram.name);
            setTables(diagram.tables);
            setRelationships(diagram.references);
            setNotes(diagram.notes);
            setAreas(diagram.areas);
            setTransform({ pan: diagram.pan, zoom: diagram.zoom });
            if (databases[database].hasTypes) {
              if (diagram.types) {
                setTypes(
                  diagram.types.map((t) =>
                    t.id
                      ? t
                      : {
                          ...t,
                          id: nanoid(),
                          fields: t.fields.map((f) =>
                            f.id ? f : { ...f, id: nanoid() },
                          ),
                        },
                  ),
                );
              } else {
                setTypes([]);
              }
            }
            if (databases[database].hasEnums) {
              setEnums(
                diagram.enums.map((e) =>
                  !e.id ? { ...e, id: nanoid() } : e,
                ) ?? [],
              );
            }
            navigate(`/editor/diagrams/${diagram.diagramId}`, {
              replace: true,
            });
          } else {
            if (selectedDb === "") setShowSelectDbModal(true);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    };

    const loadDiagram = async (id) => {
      const diagram = await db.diagrams.where("diagramId").equals(id).first();

      if (!diagram) return;

      if (diagram.database) {
        setDatabase(diagram.database);
      } else {
        setDatabase(DB.GENERIC);
      }
      setGistId(diagram.gistId);
      setLoadedFromGistId(diagram.loadedFromGistId);
      setTitle(diagram.name);
      setTables(diagram.tables);
      setRelationships(diagram.references);
      setAreas(diagram.areas);
      setNotes(diagram.notes);
      setTransform({
        pan: diagram.pan,
        zoom: diagram.zoom,
      });
      setUndoStack([]);
      setRedoStack([]);
      if (databases[database].hasTypes) {
        if (diagram.types) {
          setTypes(
            diagram.types.map((t) =>
              t.id
                ? t
                : {
                    ...t,
                    id: nanoid(),
                    fields: t.fields.map((f) =>
                      f.id ? f : { ...f, id: nanoid() },
                    ),
                  },
            ),
          );
        } else {
          setTypes([]);
        }
      }
      if (databases[database].hasEnums) {
        setEnums(
          diagram.enums.map((e) => (!e.id ? { ...e, id: nanoid() } : e)) ?? [],
        );
      }
    };

    const loadTemplate = async (id) => {
      const template = await db.templates
        .where("templateId")
        .equals(id)
        .first();

      if (template) {
        if (template.database) {
          setDatabase(template.database);
        } else {
          setDatabase(DB.GENERIC);
        }
        setTitle(template.title);
        setTables(template.tables);
        setRelationships(template.relationships);
        setAreas(template.subjectAreas);
        setNotes(template.notes);
        setTransform({
          zoom: 1,
          pan: { x: 0, y: 0 },
        });
        setUndoStack([]);
        setRedoStack([]);
        if (databases[database].hasTypes) {
          if (template.types) {
            setTypes(
              template.types.map((t) =>
                t.id
                  ? t
                  : {
                      ...t,
                      id: nanoid(),
                      fields: t.fields.map((f) =>
                        f.id ? f : { ...f, id: nanoid() },
                      ),
                    },
              ),
            );
          } else {
            setTypes([]);
          }
        }
        if (databases[database].hasEnums) {
          setEnums(
            template.enums.map((e) => (!e.id ? { ...e, id: nanoid() } : e)) ??
              [],
          );
        }
      } else {
        if (selectedDb === "") setShowSelectDbModal(true);
      }
    };

    const loadFromGist = async (shareId, diagramId = null) => {
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
          if (parsedDiagram.types) {
            setTypes(
              parsedDiagram.types.map((t) =>
                t.id
                  ? t
                  : {
                      ...t,
                      id: nanoid(),
                      fields: t.fields.map((f) =>
                        f.id ? f : { ...f, id: nanoid() },
                      ),
                    },
              ),
            );
          } else {
            setTypes([]);
          }
        }
        if (databases[parsedDiagram.database].hasEnums) {
          setEnums(
            parsedDiagram.enums.map((e) =>
              !e.id ? { ...e, id: nanoid() } : e,
            ) ?? [],
          );
        }
        if (diagramId) {
          navigate(`/editor/diagrams/${diagramId}`, {
            replace: true,
          });
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

      await loadFromGist(shareId, existingDiagram?.diagramId || null);
      return;
    }

    if (!loadedDiagramId) {
      await loadLatestDiagram();
      return;
    }

    if (isDiagram && loadedDiagramId) {
      await loadDiagram(loadedDiagramId);
      return;
    }

    if (isTemplate && loadedDiagramId) {
      await loadTemplate(loadedDiagramId);
      return;
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
    setDatabase,
    database,
    setEnums,
    selectedDb,
    setSaveState,
    searchParams,
    navigate,
    isDiagram,
    isTemplate,
    loadedDiagramId,
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
      types?.length === 0
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
