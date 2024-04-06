import {
  Spin,
  Input,
  Image,
  Toast,
  Modal as SemiUIModal,
} from "@douyinfe/semi-ui";
import { MODAL, STATUS } from "../../../data/constants";
import { useState } from "react";
import { db } from "../../../data/db";
import {
  useAreas,
  useNotes,
  useSettings,
  useTables,
  useTransform,
  useTypes,
  useUndoRedo,
} from "../../../hooks";
import { saveAs } from "file-saver";
import { Parser } from "node-sql-parser";
import { astToDiagram } from "../../../utils/astToDiagram";
import { getModalTitle, getOkText } from "../../../utils/modalTitles";
import Rename from "./Rename";
import Open from "./Open";
import New from "./New";
import ImportDiagram from "./ImportDiagram";
import ImportSource from "./ImportSource";
import Editor from "@monaco-editor/react";

export default function Modal({
  modal,
  setModal,
  title,
  setTitle,
  prevTitle,
  setPrevTitle,
  setDiagramId,
  exportData,
  setExportData,
}) {
  const { setTables, setRelationships } = useTables();
  const { setNotes } = useNotes();
  const { setAreas } = useAreas();
  const { setTypes } = useTypes();
  const { settings } = useSettings();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [importSource, setImportSource] = useState({
    src: "",
    overwrite: true,
    dbms: "MySQL",
  });
  const [importData, setImportData] = useState(null);
  const [error, setError] = useState({
    type: STATUS.NONE,
    message: "",
  });
  const [selectedTemplateId, setSelectedTemplateId] = useState(-1);
  const [selectedDiagramId, setSelectedDiagramId] = useState(0);
  const [saveAsTitle, setSaveAsTitle] = useState(title);

  const overwriteDiagram = () => {
    setTables(importData.tables);
    setRelationships(importData.relationships);
    setAreas(importData.subjectAreas);
    setNotes(importData.notes);
    if (importData.title) {
      setTitle(importData.title);
    }
  };

  const loadDiagram = async (id) => {
    await db.diagrams
      .get(id)
      .then((diagram) => {
        if (diagram) {
          setDiagramId(diagram.id);
          setTitle(diagram.name);
          setTables(diagram.tables);
          setTypes(diagram.types);
          setRelationships(diagram.references);
          setAreas(diagram.areas);
          setNotes(diagram.notes);
          setTransform({
            pan: diagram.pan,
            zoom: diagram.zoom,
          });
          setUndoStack([]);
          setRedoStack([]);
          window.name = `d ${diagram.id}`;
        } else {
          Toast.error("Oops! Something went wrong.");
        }
      })
      .catch(() => {
        Toast.error("Oops! Couldn't load diagram.");
      });
  };

  const parseSQLAndLoadDiagram = () => {
    const parser = new Parser();
    let ast = null;
    try {
      ast = parser.astify(importData.src, { database: "MySQL" });
    } catch (err) {
      Toast.error(
        "Could not parse the sql file. Make sure there are no syntax errors."
      );
      return;
    }

    const d = astToDiagram(ast);
    if (importData.overwrite) {
      setTables(d.tables);
      setRelationships(d.relationships);
      setNotes([]);
      setAreas([]);
      setTypes([]);
      setUndoStack([]);
      setRedoStack([]);
    } else {
      setTables((prev) => [...prev, ...d.tables]);
      setRelationships((prev) => [...prev, ...d.relationships]);
    }
  };

  const createNewDiagram = (id) => {
    const newWindow = window.open("/editor");
    newWindow.name = "lt " + id;
  };

  const getModalOnOk = async () => {
    switch (modal) {
      case MODAL.IMG:
        saveAs(
          exportData.data,
          `${exportData.filename}.${exportData.extension}`
        );
        return;
      case MODAL.CODE: {
        const blob = new Blob([exportData.data], {
          type: "application/json",
        });
        saveAs(blob, `${exportData.filename}.${exportData.extension}`);
        return;
      }
      case MODAL.IMPORT:
        if (error.type !== STATUS.ERROR) {
          setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
          overwriteDiagram();
          setImportData(null);
          setModal(MODAL.NONE);
          setUndoStack([]);
          setRedoStack([]);
        }
        return;
      case MODAL.IMPORT_SRC:
        parseSQLAndLoadDiagram();
        setModal(MODAL.NONE);
        return;
      case MODAL.OPEN:
        if (selectedDiagramId === 0) return;
        loadDiagram(selectedDiagramId);
        setModal(MODAL.NONE);
        return;
      case MODAL.RENAME:
        setPrevTitle(title);
        setModal(MODAL.NONE);
        return;
      case MODAL.SAVEAS:
        setTitle(saveAsTitle);
        setModal(MODAL.NONE);
        return;
      case MODAL.NEW:
        setModal(MODAL.NONE);
        createNewDiagram(selectedTemplateId);
        return;
      default:
        setModal(MODAL.NONE);
        return;
    }
  };

  const getModalBody = () => {
    switch (modal) {
      case MODAL.IMPORT:
        return (
          <ImportDiagram
            setImportData={setImportData}
            error={error}
            setError={setError}
          />
        );
      case MODAL.IMPORT_SRC:
        return (
          <ImportSource
            importData={importSource}
            setImportData={setImportSource}
            setError={setError}
          />
        );
      case MODAL.NEW:
        return (
          <New
            selectedTemplateId={selectedTemplateId}
            setSelectedTemplateId={setSelectedTemplateId}
          />
        );
      case MODAL.RENAME:
        return <Rename title={title} setTitle={setTitle} />;
      case MODAL.OPEN:
        return (
          <Open
            selectedDiagramId={selectedDiagramId}
            setSelectedDiagramId={setSelectedDiagramId}
          />
        );
      case MODAL.SAVEAS:
        return (
          <Input
            placeholder="Diagram name"
            value={saveAsTitle}
            onChange={(v) => setSaveAsTitle(v)}
          />
        );
      case MODAL.CODE:
      case MODAL.IMG:
        if (exportData.data !== "" || exportData.data) {
          return (
            <>
              {modal === MODAL.IMG ? (
                <Image src={exportData.data} alt="Diagram" height={280} />
              ) : (
                <Editor
                  height="360px"
                  value={exportData.data}
                  language={exportData.extension}
                  options={{ readOnly: true }}
                  theme={settings.mode === "light" ? "light" : "vs-dark"}
                />
              )}
              <div className="text-sm font-semibold mt-2">Filename:</div>
              <Input
                value={exportData.filename}
                placeholder="Filename"
                suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
                onChange={(value) =>
                  setExportData((prev) => ({ ...prev, filename: value }))
                }
                field="filename"
              />
            </>
          );
        } else {
          return (
            <div className="text-center my-3">
              <Spin tip="Loading..." size="large" />
            </div>
          );
        }
      default:
        return <></>;
    }
  };

  return (
    <SemiUIModal
      title={getModalTitle(modal)}
      visible={modal !== MODAL.NONE}
      onOk={getModalOnOk}
      afterClose={() => {
        setExportData(() => ({
          data: "",
          extension: "",
          filename: `${title}_${new Date().toISOString()}`,
        }));
        setError({
          type: STATUS.NONE,
          message: "",
        });
        setImportData(null);
        setImportSource({
          src: "",
          overwrite: true,
          dbms: "MySQL",
        });
      }}
      onCancel={() => {
        if (modal === MODAL.RENAME) setTitle(prevTitle);
        setModal(MODAL.NONE);
      }}
      centered
      closeOnEsc={true}
      okText={getOkText(modal)}
      okButtonProps={{
        disabled:
          (error && error?.type === STATUS.ERROR) ||
          (modal === MODAL.IMPORT &&
            (error.type === STATUS.ERROR || !importData)) ||
          (modal === MODAL.RENAME && title === "") ||
          ((modal === MODAL.IMG || modal === MODAL.CODE) && !exportData.data) ||
          (modal === MODAL.SAVEAS && saveAsTitle === "") ||
          (modal === MODAL.IMPORT_SRC && importSource.src === ""),
      }}
      cancelText="Cancel"
      width={modal === MODAL.NEW ? 740 : 600}
    >
      {getModalBody()}
    </SemiUIModal>
  );
}
