import {
  Spin,
  Input,
  Image,
  Toast,
  Modal as SemiUIModal,
} from "@douyinfe/semi-ui";
import { DB, MODAL, STATUS } from "../../../data/constants";
import { useState } from "react";
import { db } from "../../../data/db";
import {
  useAreas,
  useEnums,
  useNotes,
  useSettings,
  useDiagram,
  useTransform,
  useTypes,
  useUndoRedo,
  useTasks,
} from "../../../hooks";
import { saveAs } from "file-saver";
import { Parser } from "node-sql-parser";
import { getModalTitle, getOkText } from "../../../utils/modalTitles";
import Rename from "./Rename";
import Open from "./Open";
import New from "./New";
import ImportDiagram from "./ImportDiagram";
import ImportSource from "./ImportSource";
import SetTableWidth from "./SetTableWidth";
import Language from "./Language";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { json } from "@codemirror/lang-json";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useTranslation } from "react-i18next";
import { importSQL } from "../../../utils/importSQL";
import { databases } from "../../../data/databases";

const languageExtension = {
  sql: [sql()],
  json: [json()],
};

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
  importDb,
}) {
  const { t } = useTranslation();
  const { setTables, setRelationships, database, setDatabase } = useDiagram();
  const { setNotes } = useNotes();
  const { setAreas } = useAreas();
  const { setTypes } = useTypes();
  const { settings } = useSettings();
  const { setEnums } = useEnums();
  const { setTasks } = useTasks();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [importSource, setImportSource] = useState({
    src: "",
    overwrite: true,
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
          if (diagram.database) {
            setDatabase(diagram.database);
          } else {
            setDatabase(DB.GENERIC);
          }
          setDiagramId(diagram.id);
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
          Toast.error(t("didnt_find_diagram"));
        }
      })
      .catch((error) => {
        console.log(error);
        Toast.error(t("didnt_find_diagram"));
      });
  };

  const parseSQLAndLoadDiagram = () => {
    const parser = new Parser();
    let ast = null;
    try {
      ast = parser.astify(importSource.src, {
        database: database === DB.GENERIC ? importDb : database,
      });
    } catch (err) {
      setError({
        type: STATUS.ERROR,
        message:
          err.name +
          " [Ln " +
          err.location.start.line +
          ", Col " +
          err.location.start.column +
          "]: " +
          err.message,
      });
      return;
    }

    const d = importSQL(
      ast,
      database === DB.GENERIC ? importDb : database,
      database,
    );
    if (importSource.overwrite) {
      setTables(d.tables);
      setRelationships(d.relationships);
      setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
      setNotes([]);
      setAreas([]);
      if (databases[database].hasTypes) setTypes(d.types ?? []);
      if (databases[database].hasEnums) setEnums(d.enums ?? []);
      setUndoStack([]);
      setRedoStack([]);
    } else {
      setTables((prev) => [...prev, ...d.tables]);
      setRelationships((prev) => [...prev, ...d.relationships]);
    }
    setModal(MODAL.NONE);
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
          `${exportData.filename}.${exportData.extension}`,
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
            error={error}
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
            placeholder={t("name")}
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
                <CodeMirror
                  value={exportData.data}
                  height="360px"
                  extensions={languageExtension[exportData.extension]}
                  onChange={() => {}}
                  editable={false}
                  theme={settings.mode === "dark" ? vscodeDark : githubLight}
                />
              )}
              <div className="text-sm font-semibold mt-2">{t("filename")}:</div>
              <Input
                value={exportData.filename}
                placeholder={t("filename")}
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
              <Spin tip={t("loading")} size="large" />
            </div>
          );
        }
      case MODAL.TABLE_WIDTH:
        return <SetTableWidth />;
      case MODAL.LANGUAGE:
        return <Language />;
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
      cancelText={t("cancel")}
      width={modal === MODAL.NEW || modal === MODAL.OPEN ? 740 : 600}
      bodyStyle={{ maxHeight: window.innerHeight - 280, overflow: "auto" }}
    >
      {getModalBody()}
    </SemiUIModal>
  );
}
