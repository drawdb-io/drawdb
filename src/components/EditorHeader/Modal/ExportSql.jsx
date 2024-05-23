import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { githubLight } from "@uiw/codemirror-theme-github";
import { Select } from "@douyinfe/semi-ui";
import { DATABASE_TYPES } from "../../../data/constants";
import toSQL from "../../../utils/toSQL";
import { useTables, useSettings, useTypes } from "../../../hooks";
import ExportModal from "./ExportModal";

export default function ExportSql({ title, hideModal }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { tables, relationships } = useTables();
  const { types } = useTypes();

  const [options, setOptions] = useState({
    format: DATABASE_TYPES[0],
  });

  const [exportData, setExportData] = useState({
    data: null,
    rawData: "",
    filename: `${title}_${new Date().toISOString()}`,
    extension: "sql",
  });

  const changeOptions = (options) => {
    setOptions((prev) => ({
      ...prev,
      ...options,
    }));
  };

  const changeData = useCallback(
    (options) => {
      const rawData = toSQL[`jsonTo${options.format}`]({
        tables: tables,
        references: relationships,
        types: types,
      });

      setExportData((prev) => ({
        ...prev,
        data: new Blob([rawData], {
          type: "application/json",
        }),
        rawData: rawData,
      }));
    },
    [tables, relationships, types],
  );

  useEffect(() => {
    changeData(options);
  }, [options, changeData]);

  return (
    <ExportModal
      modalTitle={t("export_source")}
      onCancel={hideModal}
      exportData={exportData}
      setExportData={setExportData}
    >
      <div className="font-semibold mb-1">{t("format")}:</div>
      <Select
        optionList={DATABASE_TYPES.map((v) => ({
          label: v,
          value: v,
        }))}
        value={options.format}
        className="w-full"
        onChange={(value) => changeOptions({ format: value })}
      />
      <CodeMirror
        value={exportData.rawData}
        height="360px"
        extensions={[sql()]}
        onChange={() => {}}
        editable={false}
        theme={settings.mode === "dark" ? vscodeDark : githubLight}
      />
    </ExportModal>
  );
}
