import CodeMirror from "@uiw/react-codemirror";
import { vscodeDark, vscodeLight } from "@uiw/codemirror-theme-vscode";
import { languageExtension } from "../../../data/editorExtensions";
import { useSettings } from "../../../hooks";
import "./styles.css";

export default function DBMLEditor() {
  const { settings } = useSettings();
  return (
    <div>
      <CodeMirror
        extensions={languageExtension.sql}
        onChange={() => {}}
        theme={settings.mode === "dark" ? vscodeDark : vscodeLight}
      />
    </div>
  );
}
