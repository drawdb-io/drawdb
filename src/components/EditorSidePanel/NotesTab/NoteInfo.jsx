import { useState } from "react";
import {
  Button,
  Collapse,
  TextArea,
  Popover,
  Input,
  Toast,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked, IconCheckboxTick } from "@douyinfe/semi-icons";
import { noteThemes, Action, ObjectType } from "../../../data/constants";
import { useNotes, useUndoRedo } from "../../../hooks";

export default function NoteInfo({ data, nid }) {
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});

  return (
    <Collapse.Panel
      header={
        <div className="overflow-hidden text-ellipsis whitespace-nowrap">
          {data.title}
        </div>
      }
      itemKey={`${data.id}`}
      id={`scroll_note_${data.id}`}
    >
      <div className="flex items-center mb-2">
        <div className="font-semibold me-2">Title:</div>
        <Input
          value={data.title}
          placeholder="Title"
          onChange={(value) => updateNote(data.id, { title: value })}
          onFocus={(e) => setEditField({ title: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.title) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.NOTE,
                nid: data.id,
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
          value={data.content}
          autosize
          onChange={(value) => {
            const textarea = document.getElementById(`note_${data.id}`);
            textarea.style.height = "0";
            textarea.style.height = textarea.scrollHeight + "px";
            const newHeight = textarea.scrollHeight + 16 + 20 + 4;
            updateNote(data.id, { height: newHeight, content: value });
          }}
          onFocus={(e) =>
            setEditField({ content: e.target.value, height: data.height })
          }
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            const textarea = document.getElementById(`note_${data.id}`);
            textarea.style.height = "0";
            textarea.style.height = textarea.scrollHeight + "px";
            const newHeight = textarea.scrollHeight + 16 + 20 + 4;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.NOTE,
                nid: nid,
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
                            nid: nid,
                            undo: { color: data.color },
                            redo: { color: c },
                            message: `Edit note color to ${c}`,
                          },
                        ]);
                        setRedoStack([]);
                        updateNote(nid, { color: c });
                      }}
                    >
                      {data.color === c ? (
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
              style={{ backgroundColor: data.color }}
            />
          </Popover>
          <Button
            icon={<IconDeleteStroked />}
            type="danger"
            onClick={() => {
              Toast.success(`Note deleted!`);
              deleteNote(nid);
            }}
          />
        </div>
      </div>
    </Collapse.Panel>
  );
}
