import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { languageExtension } from "../../../data/editorExtensions";
import { useDiagram, useEnums, useSettings } from "../../../hooks";
import { useDebounceValue } from "usehooks-ts";
import "./styles.css";
import { fromDBML } from "../../../utils/dbml/fromDBML";
import { toDBML } from "../../../utils/dbml/toDBML";

export default function DBMLEditor({ setIssues }) {
  const { settings } = useSettings();
  const { setTables } = useDiagram();
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounceValue(value, 1000);
  const diagram = useDiagram();
  const { enums } = useEnums();

  useEffect(() => setValue(toDBML({ ...diagram, enums })), [diagram, enums]);

  useEffect(() => {
    if (debouncedValue) {
      try {
        const { tables } = fromDBML(debouncedValue);
        console.log(tables);
        setTables(tables);
      } catch (e) {
        setIssues((prev) => ({ ...prev, dbml: e.diags.map((x) => x.message) }));
      }
    }
  }, [debouncedValue, setTables, setIssues]);

  return (
    <div>
      <CodeMirror
        value={value}
        extensions={languageExtension.sql}
        onChange={(v) => setValue(v)}
        theme={settings.mode === "dark" ? vscodeDark : vscodeLight}
      />
    </div>
  );
}
