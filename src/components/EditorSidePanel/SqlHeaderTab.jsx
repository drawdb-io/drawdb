import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDiagram, useLayout } from "../../hooks";
import CodeEditor from "../CodeEditor";

export default function SqlHeaderTab() {
  const { sqlHeader, setSqlHeader } = useDiagram();
  const { layout } = useLayout();
  const { t } = useTranslation();
  const [draft, setDraft] = useState(sqlHeader);
  const committedRef = useRef(sqlHeader);
  const draftRef = useRef(sqlHeader);
  const setSqlHeaderRef = useRef(setSqlHeader);
  setSqlHeaderRef.current = setSqlHeader;

  const commit = (value) => {
    if (value === committedRef.current) return;
    committedRef.current = value;
    setSqlHeaderRef.current(value);
  };

  useEffect(() => {
    if (sqlHeader === committedRef.current) return;
    committedRef.current = sqlHeader;
    draftRef.current = sqlHeader;
    setDraft(sqlHeader);
  }, [sqlHeader]);

  useEffect(() => {
    const id = setTimeout(() => commit(draft), 500);
    return () => clearTimeout(id);
  }, [draft]);

  useEffect(() => () => commit(draftRef.current), []);

  const onChange = (value) => {
    draftRef.current = value ?? "";
    setDraft(value ?? "");
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="text-sm">{t("sql_header_description")}</div>
      <div className="flex-1 min-h-0">
        <CodeEditor
          height="100%"
          language="sql"
          value={draft}
          formatOnMount={false}
          onChange={onChange}
          options={{
            readOnly: layout.readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}
