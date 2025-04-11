import { useState } from "react";
import {
  Button,
  Collapse,
  TextArea,
  Input,
  ColorPicker,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { Action, ObjectType } from "../../../data/constants";
import { useNotes, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function NoteInfo({ data, nid }) {
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { t } = useTranslation();

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
        <div className="font-semibold me-2 break-keep">{t("title")}:</div>
        <Input
          value={data.title}
          placeholder={t("title")}
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
                message: t("edit_note", {
                  noteTitle: e.target.value,
                  extra: "[title]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>
      <div className="flex justify-between align-top">
        <TextArea
          placeholder={t("content")}
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
            if (e.target.value === editField.content) return;
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
                message: t("edit_note", {
                  noteTitle: e.target.value,
                  extra: "[content]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
          rows={3}
        />
        <div className="ms-2">
          <ColorPicker
            onChange={({ hex: color }) => {
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.NOTE,
                  nid: nid,
                  undo: { color: data.color },
                  redo: { color },
                  message: t("edit_note", {
                    noteTitle: data.title,
                    extra: "[color]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateNote(nid, { color });
            }}
            usePopover={true}
            value={ColorPicker.colorStringToValue(data.color)}
          >
            <div
              className="h-[32px] w-[32px] rounded-sm shrink-0 mb-2"
              style={{ backgroundColor: data.color }}
            />
          </ColorPicker>
          <Button
            icon={<IconDeleteStroked />}
            type="danger"
            onClick={() => deleteNote(nid, true)}
          />
        </div>
      </div>
    </Collapse.Panel>
  );
}
