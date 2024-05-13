import { Row, Col, Button, Collapse } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useNotes, useSelect } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import NoteInfo from "./NoteInfo";

export default function NotesTab() {
  const { notes, addNote } = useNotes();
  const { selectedElement, setSelectedElement } = useSelect();

  return (
    <>
      <Row gutter={6}>
        <Col span={16}>
          <SearchBar
            setActiveKey={(activeKey) =>
              setSelectedElement((prev) => ({
                ...prev,
                id: parseInt(activeKey),
              }))
            }
          />
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
          activeKey={selectedElement.open ? `${selectedElement.id}` : ""}
          keepDOM
          lazyRender
          onChange={(activeKey) => {
            setSelectedElement((prev) => ({
              ...prev,
              id: parseInt(activeKey),
              open: true,
            }));
          }}
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
