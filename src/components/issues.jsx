import React, { useContext, useState, useEffect } from "react";
import { Collapse } from "@douyinfe/semi-ui";
import { SettingsContext, TableContext } from "../pages/editor";
import { validateDiagram, arrayIsEqual } from "../utils";

export default function Issues() {
  const { settings } = useContext(SettingsContext);
  const { tables, relationships } = useContext(TableContext);
  const [issues, setIssues] = useState([]);
  
  useEffect(() => {
    const findIssues = async () => {
      const newIssues = validateDiagram({
        tables: tables,
        relationships: relationships,
      });

      if (!arrayIsEqual(newIssues, issues)) {
        setIssues(newIssues);
      }
    };

    findIssues();
  }, [tables, relationships, issues]);

  return (
    <Collapse style={{ width: "100%" }}>
      <Collapse.Panel
        header={
          <div>
            <i className="fa-solid fa-triangle-exclamation me-1 text-yellow-500"></i>{" "}
            Issues
          </div>
        }
        itemKey="1"
      >
        <div className="max-h-[160px] overflow-y-auto">
          {settings.strictMode ? (
            <div className="mb-1">
              Strict mode is off so no issues will be displayed.
            </div>
          ) : (
            <div>
              {issues.map((e, i) => (
                <div key={i} className="py-2">
                  {e}
                </div>
              ))}
            </div>
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}
