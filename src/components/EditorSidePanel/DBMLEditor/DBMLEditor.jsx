import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { languageExtension } from "../../../data/editorExtensions";
import { useDiagram, useSettings } from "../../../hooks";
import { useDebounceValue } from "usehooks-ts";
import "./styles.css";
import { fromDBML } from "../../../utils/dbml/fromDBML";

export default function DBMLEditor() {
  const { settings } = useSettings();
  const { setTables } = useDiagram();
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounceValue(value, 1000);

  useEffect(() => {
    if (debouncedValue) {
      try {
        const { tables } = fromDBML(debouncedValue);
        console.log(tables);
        setTables(tables);
      } catch (e) {
        console.log("error: ", e);
      }
    }
  }, [debouncedValue, setTables]);

  return (
    <div>
      <CodeMirror
        extensions={languageExtension.sql}
        onChange={(v) => setValue(v)}
        theme={settings.mode === "dark" ? vscodeDark : vscodeLight}
      />
    </div>
  );
}
