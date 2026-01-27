import { useState } from "react";
import { Editor } from "@monaco-editor/react";
import { useDiagram, useSettings } from "../../hooks";
import { Button } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { IconCopy, IconTick } from "@douyinfe/semi-icons";
import { setUpDBML } from "./setUpDBML";

export default function CodeEditor({
  showCopyButton,
  extraControls,
  filename,
  className = "",
  ...props
}) {
  const { settings } = useSettings();
  const { database } = useDiagram();
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard
      .writeText(props.value)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      })
      .catch((e) => console.error(e));
  };

  const handleEditorMount = (editor, monaco) => {
    setUpDBML(monaco, database);
    setTimeout(() => {
      editor.getAction("editor.action.formatDocument").run();
    }, 300);
  };

  return (
    <div className={`relative h-full ${className}`}>
      {filename && (
        <div
          className={`px-4 py-2 rounded-t-md text-xs flex justify-between items-center ${
            settings.mode === "dark"
              ? "bg-neutral-800 text-gray-50"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          <div>{filename}</div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <i className={`bi ${copied ? "bi-check2" : "bi-copy"} me-1`} />
            {t("copy")}
          </button>
        </div>
      )}
      <Editor
        {...props}
        theme={settings.mode === "light" ? "vs" : "vs-dark"}
        onMount={handleEditorMount}
      />
      {showCopyButton && (
        <div className="absolute flex flex-col right-6 bottom-2 z-10 space-y-2">
          {extraControls}
          <Button
            icon={copied ? <IconTick /> : <IconCopy />}
            onClick={copyCode}
            className="inline-block"
          />
        </div>
      )}
    </div>
  );
}
