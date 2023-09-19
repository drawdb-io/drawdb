import React, { useContext, useState } from "react";
import {
  Empty,
  Row,
  Col,
  Button,
  Collapse,
  AutoComplete,
  TextArea,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import {
  IconDeleteStroked,
  IconPlus,
  IconSearch,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";
import { NoteContext, UndoRedoContext } from "../pages/editor";
import { noteThemes, Action, ObjectType } from "../data/data";

export default function NotesOverview(props) {
  const { notes, setNotes, addNote, deleteNote } = useContext(NoteContext);
  const { setUndoStack, setRedoStack } = useContext(UndoRedoContext);
  const [value, setValue] = useState("");
  const [editField, setEditField] = useState({});
  const [activeKey, setActiveKey] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    notes.map((t) => {
      return t.title;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      notes
        .map((t) => {
          return t.title;
        })
        .filter((i) => i.includes(value))
    );
  };

  const updateNote = (id, values) => {
    setNotes((prev) =>
      prev.map((note) => {
        if (note.id === id) {
          return { ...note, ...values };
        }
        return note;
      })
    );
  };

  return (
    <div>
      <Row gutter={6}>
        <Col span={16}>
          <AutoComplete
            data={filteredResult}
            value={value}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            emptyContent={<div className="p-3">No notes found</div>}
            onSearch={(v) => handleStringSearch(v)}
            onChange={(v) => setValue(v)}
            onSelect={(v) => {
              const { id } = notes.find((t) => t.title === v);
              setActiveKey(`${id}`);
              document
                .getElementById(`scroll_note_${id}`)
                .scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full"
          />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addNote()}>
            Add note
          </Button>
        </Col>
      </Row>
      {notes.length <= 0 ? (
        <div className="select-none">
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
        <Collapse
          activeKey={activeKey}
          onChange={(k) => setActiveKey(k)}
          accordion
        >
          {notes.map((n, i) => (
            <Collapse.Panel
              header={<div>{n.title}</div>}
              itemKey={`${n.id}`}
              id={`scroll_note_${n.id}`}
              key={n.id}
            >
              <div className="flex justify-between align-top">
                <TextArea
                  field="content"
                  label="Content"
                  placeholder="Add content"
                  value={n.content}
                  autosize
                  onChange={(value) => {
                    const textarea = document.getElementById(`note_${n.id}`);
                    textarea.style.height = "0";
                    textarea.style.height = textarea.scrollHeight + "px";
                    const newHeight = textarea.scrollHeight + 16 + 20 + 4;
                    updateNote(n.id, { height: newHeight, content: value });
                  }}
                  onFocus={(e) =>
                    setEditField({ content: e.target.value, height: n.height })
                  }
                  onBlur={(e) => {
                    if (e.target.value === editField.name) return;
                    const textarea = document.getElementById(`note_${n.id}`);
                    textarea.style.height = "0";
                    textarea.style.height = textarea.scrollHeight + "px";
                    const newHeight = textarea.scrollHeight + 16 + 20 + 4;
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.NOTE,
                        nid: i,
                        undo: editField,
                        redo: { content: e.target.value, height: newHeight },
                      },
                    ]);
                    setRedoStack([]);
                    setEditField({});
                  }}
                  rows={3}
                />
                <div className="ms-2">
                  <Popover
                    content={
                      <div>
                        <div className="font-medium">Theme</div>
                        <hr />
                        <div className="py-3">
                          {noteThemes.map((c) => (
                            <button
                              key={c}
                              style={{ backgroundColor: c }}
                              className="p-3 rounded-full mx-1"
                              onClick={() => {
                                setUndoStack((prev) => [
                                  ...prev,
                                  {
                                    action: Action.EDIT,
                                    element: ObjectType.NOTE,
                                    nid: i,
                                    undo: { color: n.color },
                                    redo: { color: c },
                                  },
                                ]);
                                setRedoStack([]);
                                updateNote(i, { color: c });
                              }}
                            >
                              {n.color === c ? (
                                <IconCheckboxTick style={{ color: "white" }} />
                              ) : (
                                <IconCheckboxTick style={{ color: c }} />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    }
                    trigger="click"
                    position="rightTop"
                    showArrow
                  >
                    <div
                      className="h-[32px] w-[32px] rounded mb-2"
                      style={{ backgroundColor: n.color }}
                    />
                  </Popover>
                  <Button
                    icon={<IconDeleteStroked />}
                    type="danger"
                    onClick={() => {
                      Toast.success(`Note deleted!`);
                      deleteNote(i, true);
                    }}
                  ></Button>
                </div>
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
}
