import { Upload, Banner } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  ddbDiagramIsValid,
  jsonDiagramIsValid,
} from "../../../utils/validateSchema";
import { STATUS } from "../../../data/constants";
import {
  useAreas,
  useNotes,
  useTables,
  useTransform,
  useUndoRedo,
} from "../../../hooks";
import BaseModal from "./BaseModal";

export default function ImportDiagram({ hideModal, setTitle }) {
  const { t } = useTranslation();
  const { tables, relationships, setTables, setRelationships } = useTables();
  const { areas, setAreas } = useAreas();
  const { notes, setNotes } = useNotes();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const [importData, setImportData] = useState(null);
  const [error, setError] = useState({
    type: STATUS.NONE,
    message: "",
  });

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0
    );
  };

  const beforeUpload = ({ file, fileList }) => {
    const f = fileList[0].fileInstance;
    if (!f) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      let jsonObject = null;
      try {
        jsonObject = JSON.parse(e.target.result);
      } catch (error) {
        setError({
          type: STATUS.ERROR,
          message: "The file contains an error.",
        });
        return;
      }
      if (f.type === "application/json") {
        if (!jsonDiagramIsValid(jsonObject)) {
          setError({
            type: STATUS.ERROR,
            message: "The file is missing necessary properties for a diagram.",
          });
          return;
        }
      } else if (f.name.split(".").pop() === "ddb") {
        if (!ddbDiagramIsValid(jsonObject)) {
          setError({
            type: STATUS.ERROR,
            message: "The file is missing necessary properties for a diagram.",
          });
          return;
        }
      }
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
    reader.readAsText(f);

    return {
      autoRemove: false,
      fileInstance: file.fileInstance,
      status: "success",
      shouldUpload: false,
    };
  };

  const overwriteDiagram = () => {
    setTables(importData.tables);
    setRelationships(importData.relationships);
    setAreas(importData.subjectAreas);
    setNotes(importData.notes);
    if (importData.title) {
      setTitle(importData.title);
    }
  };

  const onOk = () => {
    if (error.type !== STATUS.ERROR) {
      setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
      overwriteDiagram();
      setImportData(null);
      setUndoStack([]);
      setRedoStack([]);
      hideModal();
    }
  };

  return (
    <BaseModal
      modalTitle={t("import_diagram")}
      okText={t("import")}
      onOk={onOk}
      onCancel={hideModal}
      okBtnDisabled={(error && error?.type === STATUS.ERROR) || !importData}
    >
      <Upload
        action="#"
        beforeUpload={beforeUpload}
        draggable={true}
        dragMainText={t("drag_and_drop_files")}
        dragSubText={t("support_json_and_ddb")}
        accept="application/json,.ddb"
        onRemove={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
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
    </BaseModal>
  );
}
