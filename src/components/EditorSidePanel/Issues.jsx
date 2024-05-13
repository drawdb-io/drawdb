import { useState, useEffect } from "react";
import { Collapse, Badge } from "@douyinfe/semi-ui";
import { arrayIsEqual } from "../../utils/utils";
import { getIssues } from "../../utils/issues";
import { useSettings, useTables, useTypes } from "../../hooks";

export default function Issues() {
  const { settings } = useSettings();
  const { types } = useTypes();
  const { tables, relationships } = useTables();
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const findIssues = async () => {
      const newIssues = getIssues({
        tables: tables,
        relationships: relationships,
        types: types,
      });

      if (!arrayIsEqual(newIssues, issues)) {
        setIssues(newIssues);
      }
    };

    findIssues();
  }, [tables, relationships, issues, types]);

  return (
    <Collapse keepDOM lazyRender style={{ width: "100%" }}>
      <Collapse.Panel
        header={
          <Badge
            type={issues.length > 0 ? "danger" : "primary"}
            count={settings.strictMode ? null : issues.length}
            overflowCount={99}
            className="mt-1"
          >
            <div className="pe-3 select-none">
              <i className="fa-solid fa-triangle-exclamation me-2 text-yellow-500" />
              Issues
            </div>
          </Badge>
        }
        itemKey="1"
      >
        <div className="max-h-[160px] overflow-y-auto">
          {settings.strictMode ? (
            <div className="mb-1">
              Strict mode is off so no issues will be displayed.
            </div>
          ) : issues.length > 0 ? (
            <>
              {issues.map((e, i) => (
                <div key={i} className="py-2">
                  {e}
                </div>
              ))}
            </>
          ) : (
            <div>No issues were detected.</div>
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}
