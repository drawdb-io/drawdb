import { useState } from "react";
import { Collapse } from "@douyinfe/semi-ui";
import { useTables } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import RelationshipInfo from "./RelationshipInfo";

export default function RelationshipsTab() {
  const { relationships } = useTables();
  const [refActiveIndex, setRefActiveIndex] = useState("");

  return (
    <>
      <SearchBar setRefActiveIndex={setRefActiveIndex} />
      <Collapse
        activeKey={refActiveIndex}
        onChange={(k) => setRefActiveIndex(k)}
        accordion
      >
        {relationships.length <= 0 ? (
          <Empty
            title="No relationships"
            text="Drag to connect fields and form relationships!"
          />
        ) : (
          relationships.map((r) => <RelationshipInfo key={r.id} data={r} />)
        )}
      </Collapse>
    </>
  );
}
