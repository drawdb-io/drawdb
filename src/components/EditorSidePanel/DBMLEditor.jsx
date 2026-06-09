import { useEffect, useState } from "react";
import { useDiagram, useEnums } from "../../hooks";
import { toDBML } from "../../utils/exportAs/dbml";
import CodeEditor from "../CodeEditor";

export default function DBMLEditor() {
  const { tables: currentTables, relationships } = useDiagram();
  const diagram = useDiagram();
  const { enums } = useEnums();
  const [value, setValue] = useState(() => toDBML({ ...diagram, enums }));

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
    />
  );
}
