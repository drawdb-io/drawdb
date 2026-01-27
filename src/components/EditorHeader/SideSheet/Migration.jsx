import { useCallback, useState } from "react";
import { Tabs, TabPane, Modal, Input, Tag, Spin } from "@douyinfe/semi-ui";
import { DiffEditor } from "@monaco-editor/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../hooks";
import { compare, VERSION_FILENAME } from "../../../api/gists";
import { deepDiff } from "../../../utils/diff";
import { DateTime } from "luxon";
import CodeEditor from "../../CodeEditor";
import { generateMigrationSQL } from "../../../utils/migrations/diffToSQL";

export default function Migration({
  gistId,
  selectedVersion,
  versionToCompareTo,
  setSelectedVersion,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);
  const [contentA, setContentA] = useState("");
  const [contentB, setContentB] = useState("");
  const [filename, setFilename] = useState(
    `${DateTime.now().toFormat("yyyyMMddHHmmss")}-migration`,
  );
  const [migrationSQL, setMigrationSQL] = useState({
    up: "",
    down: "",
  });

  const getDiff = useCallback(async () => {
    try {
      setLoading(true);
      const diff = {};
      const { data } = await compare(
        gistId,
        VERSION_FILENAME,
        selectedVersion,
        versionToCompareTo,
      );
      setContentA(JSON.stringify(JSON.parse(data.contentA), null, 2));
      setContentB(
        data.contentB ? JSON.stringify(JSON.parse(data.contentB), null, 2) : "",
      );

      const keysToIgnore = [
        "x",
        "y",
        "width",
        "height",
        "locked",
        "color",
        "title",
        "transform",
        "notes",
        "subjectAreas",
        "database",
      ];

      deepDiff(
        data.contentB ? JSON.parse(data.contentB) : {},
        JSON.parse(data.contentA),
        diff,
        keysToIgnore,
      );
      const diagramA = data.contentA ? JSON.parse(data.contentA) : {};
      const diagramB = data.contentB ? JSON.parse(data.contentB) : {};
      const database = diagramA.database;
      setMigrationSQL(
        generateMigrationSQL(diff, database, { from: diagramB, to: diagramA }),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [gistId, selectedVersion, versionToCompareTo]);

  useEffect(() => {
    if (versionToCompareTo === "") {
      setLoading(true);
      return;
    }
    if (!gistId || !selectedVersion) return;
    getDiff();
  }, [getDiff, gistId, selectedVersion, versionToCompareTo]);

  if (!selectedVersion) return null;

  return (
    <Modal
      centered
      size="medium"
      title={
        <div className="flex items-center gap-2">
          {t("migrations")} <Tag color="blue">Beta</Tag>
        </div>
      }
      visible={!!selectedVersion}
      onCancel={() => setSelectedVersion(null)}
    >
      <Tabs lazyRender keepDOM={false} className="h-[26rem] -mt-3">
        <TabPane tab={t("scripts")} itemKey="1">
          {loading && (
            <div className="text-blue-500 flex flex-col gap-2 justify-center items-center h-[24rem]">
              <Spin size="middle" />
              <div>{t("loading")}</div>
            </div>
          )}

          {!loading && migrationSQL?.up && (
            <>
              <CodeEditor
                language="sql"
                height="9rem"
                filename={`${filename}.up.sql`}
                value={migrationSQL.up}
                options={{ readOnly: true }}
              />
              <CodeEditor
                language="sql"
                height="9rem"
                filename={`${filename}.down.sql`}
                value={migrationSQL.down}
                className="mt-2"
                options={{ readOnly: true }}
              />
            </>
          )}

          {!loading && !migrationSQL?.up && (
            <div className="text-center opacity-60 mt-44">
              {t("no_migration_needed")}
            </div>
          )}
        </TabPane>

        <TabPane tab={t("json_diff")} itemKey="2">
          {!loading && (
            <DiffEditor
              original={contentB}
              modified={contentA}
              options={{ readOnly: true }}
              height="22rem"
              theme={settings.mode === "light" ? "vs" : "vs-dark"}
              language="json"
            />
          )}
          {loading && (
            <div className="text-blue-500 flex flex-col gap-2 justify-center items-center h-[24rem]">
              <Spin size="middle" />
              <div>{t("loading")}</div>
            </div>
          )}
        </TabPane>
      </Tabs>
      <div className="text-sm font-semibold mt-2">{t("filename")}:</div>
      <Input
        value={filename}
        placeholder={t("filename")}
        suffix={<div className="p-2">.zip</div>}
        onChange={(value) => setFilename(value)}
        field="filename"
      />
    </Modal>
  );
}
