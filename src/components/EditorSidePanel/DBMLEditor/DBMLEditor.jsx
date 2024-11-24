import { useEffect, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { languageExtension } from "../../../data/editorExtensions";
import { useSettings } from "../../../hooks";
import { useDebounceValue } from "usehooks-ts";
import { Parser } from "@dbml/core";
import "./styles.css";

const parser = new Parser();

export default function DBMLEditor() {
  const { settings } = useSettings();
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounceValue(value, 1000);

  useEffect(() => {
    if (debouncedValue) {
      try {
        const database = parser.parse(debouncedValue, "dbml");
        console.log(database);
      } catch (e) {
        console.log(e);
      }
    }
  }, [debouncedValue]);

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
