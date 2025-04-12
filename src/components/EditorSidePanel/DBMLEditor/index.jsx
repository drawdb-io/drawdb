import { useEffect, useState } from "react";
import { useDiagram, useEnums, useTransform } from "../../../hooks";
import { useDebounceValue } from "usehooks-ts";
import { fromDBML } from "../../../utils/importFrom/dbml";
import { toDBML } from "../../../utils/exportAs/dbml";
import CodeEditor from "../../CodeEditor";

export default function DBMLEditor({ setIssues }) {
  const { tables: currentTables, setTables } = useDiagram();
  const diagram = useDiagram();
  const { enums } = useEnums();
  const { transform } = useTransform();
  const [value, setValue] = useState(() => toDBML({ ...diagram, enums }));
  const [debouncedValue] = useDebounceValue(value, 2000);

  useEffect(() => {
    const updateDiagram = () => {
      try {
        const currentDBML = toDBML({ ...diagram, enums });

        if (debouncedValue && debouncedValue !== currentDBML) {
          const { tables: newTables } = fromDBML(debouncedValue);

          const mergedTables = newTables
            .map((newTable) => {
              const existingTable = currentTables.find(
                (t) => t.id === newTable.id || t.name === newTable.name,
              );

              return {
                ...newTable,
                ...(existingTable
                  ? {
                      x: existingTable.x,
                      y: existingTable.y,
                      color: existingTable.color,
                      id: existingTable.id,
                    }
                  : {
                      x: transform.pan.x,
                      y: transform.pan.y,
                    }),
              };
            })
            .map((x, i) => ({ ...x, id: i }));

          setTables(mergedTables);
        }
      } catch (e) {
        setIssues((prev) => ({
          ...prev,
          dbml: e.diags?.map((x) => x.message) || [e.message],
        }));
      }
    };

    updateDiagram();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);

  return (
    <CodeEditor
      value={value}
      language="dbml"
      onChange={setValue}
      height="100%"
      options={{
        minimap: { enabled: false },
      }}
    />
  );
}
