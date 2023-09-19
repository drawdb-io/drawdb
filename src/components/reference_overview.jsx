import React from "react";
import { Collapse, Input } from "@douyinfe/semi-ui";

export default function ReferenceOverview(props) {
  return (
    <Collapse>
      {props.relationships.map((r, i) => (
        <Collapse.Panel
          key={i}
          header={
            <div>
              <Input defaultValue={r.name} borderless />
            </div>
          }
          itemKey={`${i}`}
        >
          {r.name}
        </Collapse.Panel>
      ))}
    </Collapse>
  );
}
