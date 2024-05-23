import { useState } from "react";
import { useTranslation } from "react-i18next";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { json } from "@codemirror/lang-json";
import { githubLight } from "@uiw/codemirror-theme-github";
import {
  useAreas,
  useNotes,
  useTables,
  useTypes,
  useSettings,
} from "../../../hooks";
import ExportModal from "./ExportModal";

export default function ExportJson({ title, hideModal }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { tables, relationships } = useTables();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();

  const rawData = JSON.stringify(
    {
      tables: tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      types: types,
      title: title,
    },
    null,
    2,
  );
  const [exportData, setExportData] = useState({
    data: new Blob([rawData], { type: "application/json" }),
    filename: `${title}_${new Date().toISOString()}`,
    extension: "json",
  });

  return (
    <ExportModal
      modalTitle={t("export_json")}
      onCancel={hideModal}
      exportData={exportData}
      setExportData={setExportData}
    >
      <CodeMirror
        value={rawData}
        height="360px"
        extensions={[json()]}
        onChange={() => {}}
        editable={false}
        theme={settings.mode === "dark" ? vscodeDark : githubLight}
      />
    </ExportModal>
  );
}
