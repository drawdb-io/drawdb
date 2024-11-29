import { useState } from "react";
import { sql } from "@codemirror/lang-sql";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { githubLight } from "@uiw/codemirror-theme-github";
import { useSettings } from "../../../hooks";
import { useTranslation } from "react-i18next";
import CodeMirror from "@uiw/react-codemirror";

const languageExtension = {
  sql: [sql()],
  json: [json()],
};

export default function Code({ value, language }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <div className="relative">
      <CodeMirror
        value={value}
        height="360px"
        extensions={languageExtension[language]}
        editable={false}
        theme={settings.mode === "dark" ? vscodeDark : githubLight}
      />
      <button
        onClick={copyCode}
        className={`absolute right-4 top-2 px-2 py-1 rounded ${settings.mode === "dark" ? "bg-zinc-700" : "bg-zinc-200"}`}
      >
        <i className={`bi bi-clipboard${copied ? "-check" : ""} me-2`} />
        {t("copy")}
      </button>
    </div>
  );
}
