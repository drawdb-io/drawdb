import { useEffect, useState } from "react";
import { useDiagram, useEnums, useLayout } from "../../hooks";
import { toDBML } from "../../utils/exportAs/dbml";
import { Button, Tooltip } from "@douyinfe/semi-ui";
import { IconTemplate } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import CodeEditor from "../CodeEditor";

export default function DBMLEditor() {
  const { tables: currentTables, relationships } = useDiagram();
  const diagram = useDiagram();
  const { enums } = useEnums();
  const [value, setValue] = useState(() => toDBML({ ...diagram, enums }));
  const { setLayout } = useLayout();
  const { t } = useTranslation();

  const toggleDBMLEditor = () => {
    setLayout((prev) => ({ ...prev, dbmlEditor: !prev.dbmlEditor }));
  };

  useEffect(() => {
    setValue(toDBML({ tables: currentTables, enums, relationships }));
  }, [currentTables, enums, relationships]);

  return (
    <CodeEditor
      showCopyButton
      value={value}
      language="dbml"
      onChange={setValue}
      height="100%"
      options={{
        readOnly: true,
        minimap: { enabled: false },
      }}
      extraControls={
        <Tooltip content={t("tab_view")}>
          <Button icon={<IconTemplate />} onClick={toggleDBMLEditor} />
        </Tooltip>
      }
    />
  );
}
