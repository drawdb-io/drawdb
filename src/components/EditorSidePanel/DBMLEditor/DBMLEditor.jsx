import { useEffect, useState } from "react";
import { useDiagram, useEnums } from "../../../hooks";
import { useDebounceValue } from "usehooks-ts";
import { fromDBML } from "../../../utils/dbml/fromDBML";
import { toDBML } from "../../../utils/dbml/toDBML";
import CodeEditor from "../../CodeEditor";

export default function DBMLEditor({ setIssues }) {
  const { setTables } = useDiagram();
  const [value, setValue] = useState("");
  const [debouncedValue] = useDebounceValue(value, 1000);
  const diagram = useDiagram();
  const { enums } = useEnums();

  useEffect(() => setValue(toDBML({ ...diagram, enums })), [diagram, enums]);

  useEffect(() => {
    if (debouncedValue) {
      try {
        const { tables } = fromDBML(debouncedValue);
        console.log(tables);
        setTables(tables);
      } catch (e) {
        setIssues((prev) => ({ ...prev, dbml: e.diags.map((x) => x.message) }));
      }
    }
  }, [debouncedValue, setTables, setIssues]);

  return (
      <CodeEditor
        value={value}
        language="dbml"
        onChange={(v) => setValue(v)}
        height="100%"
      />
  );
}
