import { Upload, Checkbox, Banner } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Parser } from "node-sql-parser";
import { astToDiagram } from "../../../utils/astToDiagram";
import { STATUS } from "../../../data/constants";
import {
  useAreas,
  useNotes,
  useTables,
  useTransform,
  useTypes,
  useUndoRedo,
} from "../../../hooks";
import BaseModal from "./BaseModal";

export default function ImportSource({ hideModal }) {
  const { t } = useTranslation();
  const { setTables, setRelationships } = useTables();
  const { setAreas } = useAreas();
  const { setNotes } = useNotes();
  const { setTypes } = useTypes();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const [importData, setImportData] = useState({
    src: "",
    overwrite: true,
    dbms: "MySQL",
  });
  const [error, setError] = useState({
    type: STATUS.NONE,
    message: "",
  });

  const beforeUpload = ({ file, fileList }) => {
    const f = fileList[0].fileInstance;
    if (!f) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      setImportData((prev) => ({ ...prev, src: e.target.result }));
    };
    reader.readAsText(f);

    return {
      autoRemove: false,
      fileInstance: file.fileInstance,
      status: "success",
      shouldUpload: false,
    };
  };

  const onOk = () => {
    const parser = new Parser();
    let ast = null;
    try {
      ast = parser.astify(importData.src, { database: "MySQL" });
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

    const d = astToDiagram(ast);
    if (importData.overwrite) {
      setTables(d.tables);
      setRelationships(d.relationships);
      setTransform((prev) => ({ ...prev, pan: { x: 0, y: 0 } }));
      setNotes([]);
      setAreas([]);
      setTypes([]);
      setUndoStack([]);
      setRedoStack([]);
    } else {
      setTables((prev) => [...prev, ...d.tables]);
      setRelationships((prev) => [...prev, ...d.relationships]);
    }
    hideModal();
  };

  return (
    <BaseModal
      modalTitle={t("import_diagram")}
      okText={t("import")}
      onOk={onOk}
      onCancel={hideModal}
      okBtnDisabled={
        (error && error?.type === STATUS.ERROR) || importData.src === ""
      }
    >
      <Upload
        action="#"
        beforeUpload={beforeUpload}
        draggable={true}
        dragMainText={t("drag_and_drop_files")}
        dragSubText={t("upload_sql_to_generate_diagrams")}
        accept=".sql"
        onRemove={() => {
          setError({
            type: STATUS.NONE,
            message: "",
          });
          setImportData((prev) => ({ ...prev, src: "" }));
        }}
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
      <div>
        <div className="text-xs mb-3 mt-1 opacity-80">
          {t("only_mysql_supported")}
        </div>
        <Checkbox
          aria-label="overwrite checkbox"
          checked={importData.overwrite}
          defaultChecked
          onChange={(e) =>
            setImportData((prev) => ({
              ...prev,
              overwrite: e.target.checked,
            }))
          }
        >
          {t("overwrite_existing_diagram")}
        </Checkbox>
        <div className="mt-2">
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
      </div>
    </BaseModal>
  );
}
