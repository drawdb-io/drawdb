import React, { useContext } from "react";
import { Collapse } from "@douyinfe/semi-ui";
import { SettingsContext } from "../pages/editor";

export default function Issues() {
  const { settings } = useContext(SettingsContext);
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
              <div className="py-2">Issue 1</div>
              <div className="py-2">Issue 2</div>
              <div className="py-2">Issue 3</div>
              <div className="py-2">Issue 4</div>
              <div className="py-2">Issue 5</div>
              <div className="py-2">Issue 6</div>
            </div>
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}
