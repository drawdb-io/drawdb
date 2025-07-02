import { useState, useRef } from "react";
import { Button, Collapse, TextArea, Input } from "@douyinfe/semi-ui";
import ColorPicker from "../ColorPicker";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { Action, ObjectType } from "../../../data/constants";
import { useNotes, useUndoRedo } from "../../../hooks";
import { useTranslation } from "react-i18next";

export default function NoteInfo({ data, nid }) {
  const { updateNote, deleteNote } = useNotes();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const { t } = useTranslation();
  const initialColorRef = useRef(data.color);

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.NOTE &&
          e.nid === data.id &&
          e.action === Action.EDIT &&
          e.redo.color,
      );
      if (lastColorChange) {
        undoColor = lastColorChange.redo.color;
      }

      if (color === undoColor) return prev;

      const newStack = [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.NOTE,
          nid: data.id,
          undo: { color: undoColor },
          redo: { color: color },
          message: t("edit_note", {
            noteTitle: data.title,
            extra: "[color]",
          }),
        },
      ];
      return newStack;
    });
    setRedoStack([]);
  };

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
        <div className="ms-2 flex flex-col gap-2">
          <ColorPicker
            usePopover={true}
            value={data.color}
            onChange={(color) => updateNote(data.id, { color })}
            onColorPick={(color) => handleColorPick(color)}
          />
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
