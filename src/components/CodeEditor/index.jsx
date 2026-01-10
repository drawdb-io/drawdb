import { Editor } from "@monaco-editor/react";
import { useEffect, useRef } from "react";
import { useDiagram, useSettings } from "../../hooks";
import { Button, Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { IconCopy } from "@douyinfe/semi-icons";
import { setUpDBML } from "./setUpDBML";
import "./styles.css";

export default function CodeEditor({
  showCopyButton,
  extraControls,
  markers = [],
  ...props
}) {
  const { settings } = useSettings();
  const { database } = useDiagram();
  const { t } = useTranslation();

  const copyCode = () => {
    navigator.clipboard
      .writeText(props.value)
      .then(() => Toast.success(t("copied_to_clipboard")))
      .catch((e) => {
        console.log(e);
      });
  };

  const editorRef = useRef(null);
  const monacoRef = useRef(null);

  const handleEditorMount = (editor, monaco) => {
    setUpDBML(monaco, database);

    setTimeout(() => {
      editor.getAction("editor.action.formatDocument").run();
    }, 300);

    editorRef.current = editor;
    monacoRef.current = monaco;

    // Apply existing markers after mount
    try {
      const model = editor.getModel();
      if (model) {
        const normalized = markers.map((m) => ({
          severity: m.severity ?? monaco.MarkerSeverity.Error,
          ...m,
        }));
        monaco.editor.setModelMarkers(model, "dbml", normalized);
      }
    } catch (err) {
      console.warn("Failed to set initial markers", err);
    }
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current) return;
    try {
      const model = editorRef.current.getModel();
      if (!model) return;
      const normalized = markers.map((m) => ({
        severity: m.severity ?? monacoRef.current.MarkerSeverity.Error,
        ...m,
      }));
      monacoRef.current.editor.setModelMarkers(model, "dbml", normalized);
    } catch (err) {
      console.warn("Failed to update markers", err);
    }
  }, [markers]);

  return (
    <div className="relative h-full">
      <Editor
        {...props}
        theme={settings.mode === "light" ? "vs" : "vs-dark"}
        onMount={handleEditorMount}
      />
      {showCopyButton && (
        <div className="absolute right-6 bottom-2 z-10 space-y-2">
          <div>{extraControls}</div>
          <Button
            icon={<IconCopy />}
            onClick={copyCode}
            className="inline-block"
          />
        </div>
      )}
    </div>
  );
}
