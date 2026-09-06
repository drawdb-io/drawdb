import { useRef, useState } from "react";
import {
  Button,
  Card,
  Checkbox,
  Collapse,
  Input,
  Select,
  TextArea,
} from "@douyinfe/semi-ui";
import { IconDeleteStroked, IconPlus } from "@douyinfe/semi-icons";
import { nanoid } from "nanoid";
import ColorPicker from "../ColorPicker";
import ViewJoin from "./ViewJoin";
import ViewOutputColumn from "./ViewOutputColumn";
import ViewCondition from "./ViewCondition";
import { SortableList } from "../../SortableList/SortableList";
import {
  useDiagram,
  useLayout,
  useSaveState,
  useUndoRedo,
  useViews,
} from "../../../hooks";
import { Action, ObjectType, State } from "../../../data/constants";
import { databases } from "../../../data/databases";
import {
  ConditionOperator,
  JoinType,
  suggestJoinCondition,
} from "../../../utils/views";
import { useTranslation } from "react-i18next";

function Section({ title, count, action, children }) {
  return (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="text-md font-semibold break-keep whitespace-nowrap">
          {title} <span className="font-normal">({count})</span>
        </div>
        <div className="flex items-center justify-end min-w-0">{action}</div>
      </div>
      {children}
    </div>
  );
}

export default function ViewInfo({ data }) {
  const { t } = useTranslation();
  const { layout } = useLayout();
  const { database, tables, relationships } = useDiagram();
  const { updateView, deleteView, setViews } = useViews();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { setSaveState } = useSaveState();
  const [editField, setEditField] = useState({});
  const [showComment, setShowComment] = useState(false);
  const [commentActiveKey, setCommentActiveKey] = useState("");
  const initialColorRef = useRef(data.color);

  const pushEdit = (undo, redo, extra) => {
    setUndoStack((prev) => [
      ...prev,
      {
        action: Action.EDIT,
        element: ObjectType.VIEW,
        component: "self",
        vid: data.id,
        undo,
        redo,
        message: t("edit_view", { viewName: data.name, extra }),
      },
    ]);
    setRedoStack([]);
  };

  const commit = (patch, extra) => {
    const undo = Object.fromEntries(
      Object.keys(patch).map((key) => [key, data[key]]),
    );
    pushEdit(undo, patch, extra);
    updateView(data.id, patch);
  };

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.VIEW &&
          e.vid === data.id &&
          e.action === Action.EDIT &&
          e.redo?.color,
      );
      if (lastColorChange) undoColor = lastColorChange.redo.color;
      if (color === undoColor) return prev;

      return [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.VIEW,
          component: "self",
          vid: data.id,
          undo: { color: undoColor },
          redo: { color },
          message: t("edit_view", { viewName: data.name, extra: "[color]" }),
        },
      ];
    });
    setRedoStack([]);
  };

  const setBaseTable = (baseTableId) => {
    commit(
      {
        baseTableId,
        joins: [],
        columns: [],
        conditions: [],
      },
      "[base table]",
    );
  };

  const addJoin = () => {
    commit(
      {
        joins: [
          ...data.joins,
          { id: nanoid(), type: JoinType.INNER, tableId: null, on: null },
        ],
      },
      "[add join]",
    );
  };

  const changeJoin = (next) => {
    const withSuggestion =
      next.tableId && !next.on
        ? {
            ...next,
            on: suggestJoinCondition(data, tables, relationships, next.tableId),
          }
        : next;

    commit(
      { joins: data.joins.map((j) => (j.id === next.id ? withSuggestion : j)) },
      "[join]",
    );
  };

  const addColumn = () => {
    commit(
      {
        columns: [
          ...data.columns,
          { id: nanoid(), tableId: null, fieldId: null, alias: "" },
        ],
      },
      "[add column]",
    );
  };

  const addCondition = () => {
    commit(
      {
        conditions: [
          ...data.conditions,
          {
            id: nanoid(),
            connector: "AND",
            tableId: null,
            fieldId: null,
            operator: ConditionOperator.EQ,
            value: "",
          },
        ],
      },
      "[add condition]",
    );
  };

  return (
    <div>
      <div className="flex items-center mb-3">
        <div className="text-md font-semibold break-keep">{t("name")}:</div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          readonly={layout.readOnly}
          onChange={(value) => updateView(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            pushEdit(editField, { name: e.target.value }, "[name]");
          }}
        />
      </div>

      <div className="text-md font-semibold break-keep mb-1">
        {t("base_table")}
      </div>
      <Select
        className="w-full"
        placeholder={t("select_a_table")}
        filter
        disabled={layout.readOnly}
        validateStatus={data.baseTableId ? "default" : "error"}
        value={data.baseTableId}
        optionList={tables.map((tb) => ({ label: tb.name, value: tb.id }))}
        onChange={setBaseTable}
      />

      {databases[database].hasMaterializedViews && (
        <Checkbox
          className="mt-3 !flex w-full flex-row-reverse justify-between pe-2"
          checked={!!data.materialized}
          disabled={layout.readOnly}
          onChange={(e) =>
            commit({ materialized: e.target.checked }, "[materialized]")
          }
        >
          {t("materialized")}
        </Checkbox>
      )}

      <Section
        title={t("joins")}
        count={data.joins.length}
        action={
          <Button
            theme="borderless"
            icon={<IconPlus />}
            title={t("add_join")}
            aria-label={t("add_join")}
            disabled={layout.readOnly || !data.baseTableId}
            onClick={addJoin}
          />
        }
      >
        <SortableList
          items={data.joins}
          keyPrefix={`view-joins-${data.id}`}
          onChange={(joins) =>
            setViews((prev) =>
              prev.map((v) => (v.id === data.id ? { ...v, joins } : v)),
            )
          }
          afterChange={() => setSaveState(State.SAVING)}
          renderItem={(join) => (
            <ViewJoin
              view={data}
              join={join}
              onChange={changeJoin}
              onDelete={() =>
                commit(
                  { joins: data.joins.filter((j) => j.id !== join.id) },
                  "[delete join]",
                )
              }
            />
          )}
        />
      </Section>

      <Section
        title={t("output_columns")}
        count={data.columns.length}
        action={
          <Button
            theme="borderless"
            icon={<IconPlus />}
            title={t("add_column")}
            aria-label={t("add_column")}
            disabled={layout.readOnly || !data.baseTableId}
            onClick={addColumn}
          />
        }
      >
        <SortableList
          items={data.columns}
          keyPrefix={`view-${data.id}`}
          onChange={(columns) =>
            setViews((prev) =>
              prev.map((v) => (v.id === data.id ? { ...v, columns } : v)),
            )
          }
          afterChange={() => setSaveState(State.SAVING)}
          renderItem={(column) => (
            <ViewOutputColumn
              view={data}
              column={column}
              onChange={(next) =>
                commit(
                  {
                    columns: data.columns.map((c) =>
                      c.id === next.id ? next : c,
                    ),
                  },
                  "[column]",
                )
              }
              onDelete={() =>
                commit(
                  {
                    columns: data.columns.filter((c) => c.id !== column.id),
                  },
                  "[delete column]",
                )
              }
            />
          )}
        />
      </Section>

      <Section
        title={t("where")}
        count={data.conditions.length}
        action={
          <Button
            theme="borderless"
            icon={<IconPlus />}
            title={t("add_condition")}
            aria-label={t("add_condition")}
            disabled={layout.readOnly || !data.baseTableId}
            onClick={addCondition}
          />
        }
      >
        {data.conditions.map((condition, index) => (
          <ViewCondition
            key={condition.id}
            view={data}
            condition={condition}
            first={index === 0}
            onChange={(next) =>
              commit(
                {
                  conditions: data.conditions.map((c) =>
                    c.id === next.id ? next : c,
                  ),
                },
                "[condition]",
              )
            }
            onDelete={() =>
              commit(
                {
                  conditions: data.conditions.filter(
                    (c) => c.id !== condition.id,
                  ),
                },
                "[delete condition]",
              )
            }
          />
        ))}
      </Section>

      {((data.comment && data.comment.trim() !== "") || showComment) && (
        <Card
          bodyStyle={{ padding: "4px" }}
          style={{ marginTop: "12px", marginBottom: "12px" }}
          headerLine={false}
        >
          <Collapse
            activeKey={commentActiveKey}
            onChange={(itemKey) => setCommentActiveKey(itemKey)}
            keepDOM={false}
            lazyRender
            accordion
          >
            <Collapse.Panel header={t("comment")} itemKey="1">
              <TextArea
                value={data.comment}
                readonly={layout.readOnly}
                autosize
                rows={1}
                placeholder={t("comment")}
                onChange={(value) => updateView(data.id, { comment: value })}
                onFocus={(e) => setEditField({ comment: e.target.value })}
                onBlur={(e) => {
                  if (e.target.value === editField.comment) return;
                  pushEdit(editField, { comment: e.target.value }, "[comment]");
                }}
              />
            </Collapse.Panel>
          </Collapse>
        </Card>
      )}

      <div className="flex justify-between items-center gap-1 mt-5 mb-2">
        <ColorPicker
          usePopover={true}
          readOnly={layout.readOnly}
          value={data.color}
          onChange={(color) => updateView(data.id, { color })}
          onColorPick={handleColorPick}
        />
        <div className="flex gap-1">
          <Button
            disabled={layout.readOnly}
            onClick={() => {
              setShowComment(true);
              setCommentActiveKey("1");
            }}
          >
            {t("add_comment")}
          </Button>
          <Button
            type="danger"
            disabled={layout.readOnly}
            icon={<IconDeleteStroked />}
            onClick={() => deleteView(data.id)}
          />
        </div>
      </div>
    </div>
  );
}
