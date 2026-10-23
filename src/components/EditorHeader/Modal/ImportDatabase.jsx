import {
  Banner,
  Button,
  Checkbox,
  TabPane,
  Tabs,
  Upload,
} from "@douyinfe/semi-ui";
import { Fragment, useState } from "react";
import { IconCopy, IconDownload, IconTickCircle } from "@douyinfe/semi-icons";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";
import { STATUS } from "../../../data/constants";
import { databases } from "../../../data/databases";
import {
  useAreas,
  useDiagram,
  useNotes,
  useSettings,
  useViews,
} from "../../../hooks";
import { schemaQueries } from "../../../utils/importFrom/schemaQuery";
import CodeEditor from "../../CodeEditor";

export default function ImportDatabase({
  importData,
  setImportData,
  error,
  setError,
  sourceDb,
}) {
  const { t } = useTranslation();
  const { query, minVersion, cli, note } = schemaQueries[sourceDb];
  const editorHeight = Math.max(320, window.innerHeight - 480);
  const { tables } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { views } = useViews();
  const { settings } = useSettings();
  const [cliCopied, setCliCopied] = useState(false);
  const isEmpty =
    !tables.length && !notes.length && !areas.length && !views.length;

  const setSchema = (schema) => {
    setImportData((prev) => ({ ...prev, schema }));
    setError({ type: STATUS.NONE, message: "" });
  };

  return (
    <div className="space-y-1">
      <div className="text-sm">
        {t("schema_query_instructions", { database: databases[sourceDb].name })}
        <div className="opacity-70 mt-1">
          {t("requires_version", { version: minVersion })}
          {note && ` ${t(note)}`}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Tabs>
          <TabPane tab={t("query")} itemKey="query">
            <CodeEditor
              height={editorHeight}
              language="sql"
              value={query}
              options={{ readOnly: true, minimap: { enabled: false } }}
              formatOnMount={false}
              showCopyButton
              extraControls={
                <Button
                  icon={<IconDownload />}
                  aria-label={t("download")}
                  onClick={() =>
                    saveAs(
                      new Blob([query], { type: "text/plain" }),
                      "drawdb-schema.sql",
                    )
                  }
                />
              }
            />
          </TabPane>
        </Tabs>
        <Tabs>
          <TabPane tab={t("paste_result")} itemKey="paste">
            <CodeEditor
              height={editorHeight}
              language="json"
              value={importData.schema}
              options={{ minimap: { enabled: false } }}
              formatOnMount={false}
              onChange={(value) => setSchema(value ?? "")}
            />
          </TabPane>
          <TabPane tab={t("upload_file")} itemKey="upload">
            <div
              className="flex flex-col gap-3"
              style={{ height: editorHeight }}
            >
              <div className="text-sm">
                <div className="mb-2">{t("schema_query_large")}</div>
                <div
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                    settings.mode === "dark"
                      ? "border-zinc-800 bg-zinc-700"
                      : "border-zinc-200 bg-zinc-100"
                  }`}
                >
                  <pre
                    className={`min-w-0 flex-1 whitespace-pre-wrap font-mono text-sm ${
                      settings.mode === "dark"
                        ? "text-zinc-200"
                        : "text-zinc-800"
                    }`}
                  >
                    <span className="mr-2 select-none text-zinc-400">&gt;</span>
                    {cli.split(" ").map((part, i) => (
                      <Fragment key={i}>
                        {i > 0 && " "}
                        <span className="whitespace-nowrap">{part}</span>
                      </Fragment>
                    ))}
                  </pre>
                  <button
                    type="button"
                    aria-label={t("copy")}
                    onClick={() =>
                      navigator.clipboard.writeText(cli).then(() => {
                        setCliCopied(true);
                        setTimeout(() => setCliCopied(false), 1500);
                      })
                    }
                    className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors ${
                      settings.mode === "dark"
                        ? "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                        : "text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700"
                    }`}
                  >
                    {cliCopied ? <IconTickCircle /> : <IconCopy />}
                  </button>
                </div>
              </div>
              <Upload
                className="min-h-0 flex-1 !flex !flex-col !flex-nowrap [&_.semi-upload-drag-area]:min-h-0 [&_.semi-upload-drag-area]:flex-1 [&_.semi-upload-file-list]:!h-auto [&_.semi-upload-file-list]:!flex-none"
                action="#"
                beforeUpload={({ file, fileList }) => {
                  const f = fileList[0].fileInstance;
                  if (!f) return;
                  const reader = new FileReader();
                  reader.onload = (e) => setSchema(e.target.result);
                  reader.readAsText(f);
                  return {
                    autoRemove: false,
                    fileInstance: file.fileInstance,
                    status: "success",
                    shouldUpload: false,
                  };
                }}
                draggable
                dragMainText={t("drag_and_drop_files")}
                dragSubText={t("upload_query_result")}
                accept=".json,.txt"
                onRemove={() => setSchema("")}
                limit={1}
              />
            </div>
          </TabPane>
        </Tabs>
      </div>
      {!isEmpty && (
        <Checkbox
          aria-label={t("overwrite_checkbox")}
          checked={importData.overwrite}
          onChange={(e) =>
            setImportData((prev) => ({ ...prev, overwrite: e.target.checked }))
          }
        >
          {t("overwrite_existing_diagram")}
        </Checkbox>
      )}
      {error.type === STATUS.ERROR && (
        <Banner
          type="danger"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      )}
    </div>
  );
}
