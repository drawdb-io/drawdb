import { useState } from "react";
import { Row, Col, Button, Collapse } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useNotes } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import NoteInfo from "./NoteInfo";

export default function NotesTab() {
  const { notes, addNote } = useNotes();
  const [activeKey, setActiveKey] = useState("");

  return (
    <>
      <Row gutter={6}>
        <Col span={16}>
          <SearchBar setActiveKey={setActiveKey} />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addNote()}>
            Add note
          </Button>
        </Col>
      </Row>
      {notes.length <= 0 ? (
        <Empty title="No text notes" text="Add notes cuz why not!" />
      ) : (
        <Collapse
          activeKey={activeKey}
          onChange={(k) => setActiveKey(k)}
          accordion
        >
          {notes.map((n, i) => (
            <NoteInfo data={n} key={i} nid={i} />
          ))}
        </Collapse>
      )}
    </>
  );
}
