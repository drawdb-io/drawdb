import { Banner, Toast } from "@douyinfe/semi-ui";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../../../data/db";
import {
  useAreas,
  useNotes,
  useTables,
  useTransform,
  useTypes,
  useUndoRedo,
} from "../../../hooks";
import BaseModal from "./BaseModal";

export default function Open({ hideModal, setDiagramId, setTitle }) {
  const { t } = useTranslation();
  const { setTables, setRelationships } = useTables();
  const { setNotes } = useNotes();
  const { setAreas } = useAreas();
  const { setTypes } = useTypes();
  const { setTransform } = useTransform();
  const { setUndoStack, setRedoStack } = useUndoRedo();

  const diagrams = useLiveQuery(() => db.diagrams.toArray());
  const [selectedDiagramId, setSelectedDiagramId] = useState(0);

  const getDiagramSize = (d) => {
    const size = JSON.stringify(d).length;
    let sizeStr;
    if (size >= 1024 && size < 1024 * 1024)
      sizeStr = (size / 1024).toFixed(1) + "KB";
    else if (size >= 1024 * 1024)
      sizeStr = (size / (1024 * 1024)).toFixed(1) + "MB";
    else sizeStr = size + "B";

    return sizeStr;
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

  const onOk = () => {
    if (selectedDiagramId === 0) return;
    loadDiagram(selectedDiagramId);
    hideModal();
  };

  return (
    <BaseModal
      modalTitle={t("open_diagram")}
      okText={t("open")}
      onOk={onOk}
      onCancel={hideModal}
    >
      {diagrams?.length === 0 ? (
        <Banner
          fullMode={false}
          type="info"
          bordered
          icon={null}
          closeIcon={null}
          description={<div>You have no saved diagrams.</div>}
        />
      ) : (
        <div className="max-h-[360px]">
          <table className="w-full text-left border-separate border-spacing-x-0">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("last_modified")}</th>
                <th>{t("size")}</th>
              </tr>
            </thead>
            <tbody>
              {diagrams?.map((d) => {
                return (
                  <tr
                    key={d.id}
                    className={`${
                      selectedDiagramId === d.id
                        ? "bg-blue-300 bg-opacity-30"
                        : "hover-1"
                    }`}
                    onClick={() => {
                      setSelectedDiagramId(d.id);
                    }}
                  >
                    <td className="py-1">
                      <i className="bi bi-file-earmark-text text-[16px] me-1 opacity-60" />
                      {d.name}
                    </td>
                    <td className="py-1">
                      {d.lastModified.toLocaleDateString() +
                        " " +
                        d.lastModified.toLocaleTimeString()}
                    </td>
                    <td className="py-1">{getDiagramSize(d)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </BaseModal>
  );
}
