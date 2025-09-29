import { useCallback, useState } from "react";
import { Tabs, TabPane, Modal } from "@douyinfe/semi-ui";
import { DiffEditor } from "@monaco-editor/react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../hooks";
import { compare, VERSION_FILENAME } from "../../../api/gists";
import CodeEditor from "../../CodeEditor";

export default function Migration({
  gistId,
  selectedVersion,
  versionToCompareTo,
  setSelectedVersion,
}) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [contentA, setContentA] = useState("");
  const [contentB, setContentB] = useState("");

  const getDiff = useCallback(async () => {
    const acc = {};
    const { data } = await compare(
      gistId,
      VERSION_FILENAME,
      selectedVersion,
      versionToCompareTo,
    );
    setContentA(JSON.stringify(JSON.parse(data.contentA), null, 2));
    setContentB(JSON.stringify(JSON.parse(data.contentB), null, 2));

    deepDiff(contentA, contentB, acc);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gistId, selectedVersion, versionToCompareTo]);

  const deepDiff = (original, modified, acc, path = "") => {
    for (const key of new Set([
      ...Object.keys(original),
      ...Object.keys(modified),
    ])) {
      const newPath = path ? `${path}.${key}` : key;

      if (
        typeof original[key] === "object" &&
        typeof modified[key] === "object"
      ) {
        deepDiff(original[key], modified[key], acc, newPath);
      } else if (original[key] !== modified[key]) {
        acc[newPath] = {
          from: original[key] || null,
          to: modified[key] || null,
        };
      }
    }
  };

  useEffect(() => {
    if (!gistId || !selectedVersion || !versionToCompareTo) return;
    getDiff();
  }, [getDiff, gistId, selectedVersion, versionToCompareTo]);

  if (!selectedVersion) return null;

  return (
    <Modal
      centered
      size="medium"
      title={t("migrations")}
      visible={!!selectedVersion}
      onCancel={() => setSelectedVersion(null)}
    >
      <Tabs lazyRender keepDOM={false} className="h-[26rem] -mt-3">
        <TabPane tab={t("scripts")} itemKey="1">
          <CodeEditor language="sql" height="9rem" filename="hello.sql" />
          <CodeEditor language="sql" height="9rem" filename="hello.sql" className="mt-2" />
        </TabPane>
        <TabPane tab={t("json_diff")} itemKey="2">
          <DiffEditor
            original={contentB}
            modified={contentA}
            options={{ readOnly: true }}
            height="22rem"
            theme={settings.mode === "light" ? "vs" : "vs-dark"}
            language="json"
          />
        </TabPane>
      </Tabs>
    </Modal>
  );
}
