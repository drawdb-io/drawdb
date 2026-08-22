import { useEffect, useRef, useState } from "react";
import { Upload, Banner, Button, Progress } from "@douyinfe/semi-ui";
import { IMPORT_FROM, STATUS } from "../../../data/constants";
import {
  useAreas,
  useEnums,
  useNotes,
  useDiagram,
  useTypes,
} from "../../../hooks";
import { useTranslation } from "react-i18next";
import { fromDBML } from "../../../utils/importFrom/dbml";
import {
  getDiagramImportFormat,
  validateImportedDiagram,
} from "../../../utils/importDiagram";

export default function ImportDiagram({
  setImportData,
  error,
  setError,
  importFrom,
}) {
  const { areas } = useAreas();
  const { notes } = useNotes();
  const { tables, relationships, database } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { t } = useTranslation();
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const workerRef = useRef(null);
  const pendingRejectRef = useRef(null);
  const importRunRef = useRef(0);

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0 &&
      types.length === 0 &&
      enums.length === 0
    );
  };

  const finishSuccessfulImport = (jsonObject) => {
    setImportData(jsonObject);
    if (diagramIsEmpty()) {
      setError({
        type: STATUS.OK,
        message: "Everything looks good. You can now import.",
      });
    } else {
      setError({
        type: STATUS.WARNING,
        message:
          "The current diagram is not empty. Importing a new diagram will overwrite the current changes.",
      });
    }
  };

  const cancelImport = () => {
    importRunRef.current++;
    pendingRejectRef.current?.({ cancelled: true });
    pendingRejectRef.current = null;
    workerRef.current?.terminate();
    workerRef.current = null;
    setProcessing(false);
    setProgress(0);
    setImportData(null);
  };

  useEffect(
    () => () => {
      importRunRef.current++;
      pendingRejectRef.current?.({ cancelled: true });
      workerRef.current?.terminate();
    },
    [],
  );

  const readAsArrayBuffer = (file) => {
    if (typeof file.arrayBuffer === "function") return file.arrayBuffer();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const validateInWorker = (buffer, format) =>
    new Promise((resolve, reject) => {
      let worker;
      try {
        worker = new Worker(
          new URL("../../../workers/importDiagram.worker.js", import.meta.url),
          { type: "module" },
        );
      } catch (error) {
        reject({ workerFailure: true, error });
        return;
      }

      workerRef.current = worker;
      pendingRejectRef.current = reject;
      const dispose = () => {
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        pendingRejectRef.current = null;
      };

      worker.onmessage = ({ data }) => {
        if (data.type === "progress") {
          setProgress(data.progress);
          return;
        }
        if (data.type === "validation-error") {
          dispose();
          reject({ validationFailure: true, message: data.message });
          return;
        }
        if (data.type === "complete") {
          dispose();
          resolve(data);
        }
      };
      worker.onerror = (event) => {
        event.preventDefault();
        dispose();
        reject({ workerFailure: true });
      };
      worker.postMessage({ buffer, format, expectedDatabase: database }, [
        buffer,
      ]);
    });

  const validateOnMainThread = (buffer, format) => {
    let source = new TextDecoder().decode(buffer);
    const diagram = JSON.parse(source);
    source = null;
    const validation = validateImportedDiagram(diagram, {
      format,
      expectedDatabase: database,
    });
    if (!validation.ok) {
      throw { validationFailure: true, message: validation.message };
    }
    return { diagram, ...validation, duration: 0 };
  };

  const loadJsonData = async (file) => {
    const run = ++importRunRef.current;
    const startedAt = performance.now();
    const format = getDiagramImportFormat(file);
    setProcessing(true);
    setProgress(5);
    setImportData(null);
    setError({ type: STATUS.NONE, message: "" });

    try {
      let buffer = await readAsArrayBuffer(file);
      if (run !== importRunRef.current) return;
      setProgress(20);

      let result;
      if (typeof Worker === "function") {
        try {
          result = await validateInWorker(buffer, format);
          buffer = result.buffer;
        } catch (error) {
          if (!error?.workerFailure) throw error;
          buffer = await readAsArrayBuffer(file);
          result = validateOnMainThread(buffer, format);
        }
      } else {
        result = validateOnMainThread(buffer, format);
      }

      if (run !== importRunRef.current) return;
      setProgress(95);
      let jsonObject = result.diagram;
      if (!jsonObject) {
        let source = new TextDecoder().decode(buffer);
        jsonObject = JSON.parse(source);
        source = null;
      }
      if (!jsonObject.database) jsonObject.database = result.database;

      if (import.meta.env.DEV) {
        console.debug("[drawDB:import]", {
          counts: result.counts,
          workerMs: Number((result.duration ?? 0).toFixed(2)),
          totalMs: Number((performance.now() - startedAt).toFixed(2)),
        });
      }

      setProgress(100);
      finishSuccessfulImport(jsonObject);
    } catch (error) {
      if (error?.cancelled || run !== importRunRef.current) return;
      setError({
        type: STATUS.ERROR,
        message: error?.validationFailure
          ? error.message
          : "The file contains an error.",
      });
    } finally {
      if (run === importRunRef.current) setProcessing(false);
    }
  };

  const loadDBMLData = (source) => {
    try {
      finishSuccessfulImport(fromDBML(source, database));
    } catch (error) {
      const message = `${error.diags[0].name} [Ln ${error.diags[0].location.start.line}, Col ${error.diags[0].location.start.column}]: ${error.diags[0].message}`;

      setError({ type: STATUS.ERROR, message });
    }
  };

  const readAsText = (file) => {
    if (typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const processFile = async (file) => {
    if (importFrom === IMPORT_FROM.JSON) {
      await loadJsonData(file);
      return;
    }
    if (importFrom === IMPORT_FROM.DBML) {
      try {
        loadDBMLData(await readAsText(file));
      } catch (_error) {
        setError({
          type: STATUS.ERROR,
          message: "The file contains an error.",
        });
      }
    }
  };

  const getAcceptableFileTypes = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return "application/json,.ddb";
      case IMPORT_FROM.DBML:
        return ".dbml";
      default:
        return "";
    }
  };

  const getDragSubText = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return `${t("supported_types")} JSON, DDB`;
      case IMPORT_FROM.DBML:
        return `${t("supported_types")} DBML`;
      default:
        return "";
    }
  };

  return (
    <div>
      <Upload
        action="#"
        beforeUpload={({ file, fileList }) => {
          const f = fileList[0].fileInstance;
          if (!f) {
            return;
          }
          processFile(f);

          return {
            autoRemove: false,
            fileInstance: file.fileInstance,
            status: "success",
            shouldUpload: false,
          };
        }}
        draggable={true}
        dragMainText={t("drag_and_drop_files")}
        dragSubText={getDragSubText()}
        accept={getAcceptableFileTypes()}
        onRemove={() => {
          cancelImport();
          setError({
            type: STATUS.NONE,
            message: "",
          });
        }}
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
      {processing && (
        <div className="flex items-center gap-3 py-3">
          <Progress percent={progress} className="grow" />
          <Button size="small" type="tertiary" onClick={cancelImport}>
            {t("cancel")}
          </Button>
        </div>
      )}
      {error.type === STATUS.ERROR ? (
        <Banner
          type="danger"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : error.type === STATUS.OK ? (
        <Banner
          type="info"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : (
        error.type === STATUS.WARNING && (
          <Banner
            type="warning"
            fullMode={false}
            description={<div>{error.message}</div>}
          />
        )
      )}
    </div>
  );
}
