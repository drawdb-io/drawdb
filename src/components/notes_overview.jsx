import React, { useContext } from "react";
import {
  Empty,
  Row,
  Col,
  Button,
//   Input,
//   Popover,
//   Toast,
} from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import { IconPlus } from "@douyinfe/semi-icons";
import { NoteContext } from "../pages/editor";

export default function NotesOverview(props) {
  const { notes, setNotes } = useContext(NoteContext);

  return (
    <div>
      <Row gutter={6}>
        <Col span={24}>
          <Button
            icon={<IconPlus />}
            block
            onClick={() => {
              const newNote = {
                id: notes.length,
                x: 0,
                y: 0,
                title: `note_${notes.length}`,
                content: ""
              };
              setNotes((prev) => [...prev, newNote]);
            }}
          >
            Add note
          </Button>
        </Col>
      </Row>
      {notes.length <= 0 ? (
        <div className="select-none mt-2">
          <Empty
            image={
              <IllustrationNoContent style={{ width: 160, height: 160 }} />
            }
            darkModeImage={
              <IllustrationNoContentDark style={{ width: 160, height: 160 }} />
            }
            title="No text notes"
            description="Add notes cuz why not!"
          />
        </div>
      ) : (
        <div className="p-2">
          {notes.map((n, i) => (
            <div key={n.id}>{n.title}</div>
          ))}
        </div>
      )}
    </div>
  );
}
