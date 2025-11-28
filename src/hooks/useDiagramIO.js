import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { nanoid } from "nanoid";
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
} from ".";
import { DB, State } from "../data/constants";
import { db } from "../data/db";
import { databases } from "../data/databases";
import { get, SHARE_FILENAME } from "../api/gists";

export default function useDiagramIO() {
    const [id, setId] = useState(0);
    const [gistId, setGistId] = useState("");
    const [version, setVersion] = useState("");
    const [loadedFromGistId, setLoadedFromGistId] = useState("");
    const [title, setTitle] = useState("Untitled Diagram");
    const [lastSaved, setLastSaved] = useState("");
    const [showSelectDbModal, setShowSelectDbModal] = useState(false);
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
    let [searchParams, setSearchParams] = useSearchParams();

    const save = useCallback(async () => {
        const name = window.name.split(" ");
        const op = name[0];
        const saveAsDiagram = window.name === "" || op === "d" || op === "lt";

        if (saveAsDiagram) {
            if (searchParams.has("shareId")) {
                searchParams.delete("shareId");
                setSearchParams(searchParams, { replace: true });
            }
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
                            if (d.types) {
                                setTypes(
                                    d.types.map((t) =>
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
                                d.enums.map((e) => (!e.id ? { ...e, id: nanoid() } : e)) ?? [],
                            );
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

    return {
        id,
        setId,
        gistId,
        setGistId,
        version,
        setVersion,
        loadedFromGistId,
        setLoadedFromGistId,
        title,
        setTitle,
        lastSaved,
        setLastSaved,
        showSelectDbModal,
        setShowSelectDbModal,
        selectedDb,
        setSelectedDb,
        returnToCurrentDiagram,
        setDatabase,
    };
}
