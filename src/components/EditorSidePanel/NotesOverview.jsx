import { useState } from "react";
import {
  Row,
  Col,
  Button,
  Collapse,
  AutoComplete,
  TextArea,
  Popover,
  Input,
  Toast,
} from "@douyinfe/semi-ui";
import {
  IconDeleteStroked,
  IconPlus,
  IconSearch,
  IconCheckboxTick,
} from "@douyinfe/semi-icons";
import { noteThemes, Action, ObjectType } from "../../data/constants";
import { useUndoRedo, useNotes } from "../../hooks";
import Empty from "./Empty";

export default function NotesOverview() {
  const { notes, updateNote, addNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [searchText, setSearchText] = useState("");
  const [editField, setEditField] = useState({});
  const [activeKey, setActiveKey] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    notes.map((t) => t.title)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      notes.map((t) => t.title).filter((i) => i.includes(value))
    );
  };

  return (
    <div>
      <Row gutter={6}>
        <Col span={16}>
          <AutoComplete
            data={filteredResult}
            value={searchText}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            emptyContent={
              <div className="p-3 popover-theme">No notes found</div>
            }
            onSearch={(v) => handleStringSearch(v)}
            onChange={(v) => setSearchText(v)}
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
        <Empty title="No text notes" text="Add notes cuz why not!" />
      ) : (
        <Collapse
          activeKey={activeKey}
          onChange={(k) => setActiveKey(k)}
          accordion
        >
          {notes.map((n, i) => (
            <Collapse.Panel
              header={
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {n.title}
                </div>
              }
              itemKey={`${n.id}`}
              id={`scroll_note_${n.id}`}
              key={n.id}
            >
              <div className="flex items-center mb-2">
                <div className="font-semibold me-2">Title:</div>
                <Input
                  value={n.title}
                  placeholder="Title"
                  onChange={(value) => updateNote(n.id, { title: value })}
                  onFocus={(e) => setEditField({ title: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value === editField.title) return;
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.NOTE,
                        nid: n.id,
                        undo: editField,
                        redo: { title: e.target.value },
                        message: `Edit note title to "${e.target.name}"`,
                      },
                    ]);
                    setRedoStack([]);
                  }}
                />
              </div>
              <div className="flex justify-between align-top">
                <TextArea
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
                        message: `Edit note content to "${e.target.value}"`,
                      },
                    ]);
                    setRedoStack([]);
                  }}
                  rows={3}
                />
                <div className="ms-2">
                  <Popover
                    content={
                      <div className="popover-theme">
                        <div className="font-medium mb-1">Theme</div>
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
                                    message: `Edit note color to ${c}`,
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
                  />
                </div>
              </div>
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
}
