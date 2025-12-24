import { useState, useRef } from "react";
import {
  Collapse,
  Input,
  TextArea,
  Button,
  Card,
  Select,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import ColorPicker from "../ColorPicker";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import {
  useDiagram,
  useLayout,
  useSaveState,
  useUndoRedo,
  useBaseTables,
} from "../../../hooks";
import { Action, ObjectType, State, DB } from "../../../data/constants";
import TableField from "./TableField";
import IndexDetails from "./IndexDetails";
import { useTranslation } from "react-i18next";
import { SortableList } from "../../SortableList/SortableList";
import { nanoid } from "nanoid";

export default function TableInfo({ data }) {
  const { tables, database } = useDiagram();
  const { baseTables } = useBaseTables();
  const { t } = useTranslation();
  const [indexActiveKey, setIndexActiveKey] = useState("");
  const { layout } = useLayout();
  const { deleteTable, updateTable, setTables } = useDiagram();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { setSaveState } = useSaveState();
  const [editField, setEditField] = useState({});
  const initialColorRef = useRef(data.color);

  const handleColorPick = (color) => {
    setUndoStack((prev) => {
      let undoColor = initialColorRef.current;
      const lastColorChange = prev.findLast(
        (e) =>
          e.element === ObjectType.TABLE &&
          e.tid === data.id &&
          e.action === Action.EDIT &&
          e.redo?.color,
      );
      if (lastColorChange) {
        undoColor = lastColorChange.redo.color;
      }

      if (color === undoColor) return prev;

      const newStack = [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.TABLE,
          component: "self",
          tid: data.id,
          undo: { color: undoColor },
          redo: { color: color },
          message: t("edit_table", {
            tableName: data.name,
            extra: "[color]",
          }),
        },
      ];
      return newStack;
    });
    setRedoStack([]);
  };

  // Get inherited fields from PostgreSQL table inheritance (if any)
  const postgresInheritedFieldNames =
    database === DB.POSTGRES &&
    Array.isArray(data.inherits) &&
    data.inherits.length > 0
      ? data.inherits
          .map((parentName) => {
            const parent = tables.find((t) => t.name === parentName);
            return parent ? parent.fields.map((f) => f.name) : [];
          })
          .flat()
      : [];

  // Get inherited fields from base table
  // Only mark fields as inherited if they actually came from the base table
  // We determine this by checking which fields would be removed if we remove the base table
  const baseTableInheritedFieldNames = data.baseTableId
    ? (() => {
        const baseTable = baseTables.find((bt) => bt.id === data.baseTableId);
        if (!baseTable) return [];
        
        const baseTableFieldNames = new Set(
          baseTable.fields.map((f) => f.name),
        );

        // Get table's own fields (excluding any from old base table)
        const oldBaseTable = data.baseTableId
          ? baseTables.find((bt) => bt.id === data.baseTableId)
          : null;
        const oldBaseTableFieldNames = oldBaseTable
          ? new Set(oldBaseTable.fields.map((f) => f.name))
          : new Set();

        // Table's own fields are those NOT in the base table
        const tableOwnFieldNames = new Set(
          data.fields
            .filter((f) => !oldBaseTableFieldNames.has(f.name))
            .map((f) => f.name),
        );

        // Inherited fields are those that:
        // 1. Exist in the base table
        // 2. Exist in the current table's fields
        // 3. Are NOT in the table's own fields (meaning they came from inheritance)
        const inheritedFields = data.fields
          .filter(
            (f) =>
              baseTableFieldNames.has(f.name) &&
              !tableOwnFieldNames.has(f.name),
          )
          .map((f) => f.name);

        return inheritedFields;
      })()
    : [];

  const inheritedFieldNames = [
    ...postgresInheritedFieldNames,
    ...baseTableInheritedFieldNames,
  ];

  return (
    <div>
      <div className="flex items-center mb-2.5">
        <div className="text-md font-semibold break-keep">{t("name")}:</div>
        <Input
          value={data.name}
          validateStatus={data.name.trim() === "" ? "error" : "default"}
          placeholder={t("name")}
          className="ms-2"
          readonly={layout.readOnly}
          onChange={(value) => updateTable(data.id, { name: value })}
          onFocus={(e) => setEditField({ name: e.target.value })}
          onBlur={(e) => {
            if (e.target.value === editField.name) return;
            setUndoStack((prev) => [
              ...prev,
              {
                action: Action.EDIT,
                element: ObjectType.TABLE,
                component: "self",
                tid: data.id,
                undo: editField,
                redo: { name: e.target.value },
                message: t("edit_table", {
                  tableName: e.target.value,
                  extra: "[name]",
                }),
              },
            ]);
            setRedoStack([]);
          }}
        />
      </div>

      <SortableList
        items={data.fields}
        keyPrefix={`table-${data.id}`}
        onChange={(newFields) =>
          setTables((prev) =>
            prev.map((t) =>
              t.id === data.id ? { ...t, fields: newFields } : t,
            ),
          )
        }
        afterChange={() => setSaveState(State.SAVING)}
        renderItem={(item, i) => (
          <TableField
            data={item}
            tid={data.id}
            index={i}
            inherited={inheritedFieldNames.includes(item.name)}
          />
        )}
      />


      {database === DB.POSTGRES && (
        <div className="mb-2">
          <div className="text-md font-semibold break-keep">
            {t("inherits")}:
          </div>
          <Select
            multiple
            value={data.inherits || []}
            optionList={tables
              .filter((t) => t.id !== data.id)
              .map((t) => ({ label: t.name, value: t.name }))}
            onChange={(value) => {
              if (layout.readOnly) return;

              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "self",
                  tid: data.id,
                  undo: { inherits: data.inherits },
                  redo: { inherits: value },
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[inherits]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, { inherits: value });
            }}
            placeholder={t("inherits")}
            className="w-full"
          />
        </div>
      )}

      {data.indices.length > 0 && (
        <Card
          bodyStyle={{ padding: "4px" }}
          style={{ marginTop: "12px", marginBottom: "12px" }}
          headerLine={false}
        >
          <Collapse
            activeKey={indexActiveKey}
            keepDOM={false}
            lazyRender
            onChange={(itemKey) => setIndexActiveKey(itemKey)}
            accordion
          >
            <Collapse.Panel header={t("indices")} itemKey="1">
              {data.indices.map((idx, k) => (
                <IndexDetails
                  key={"index_" + k}
                  data={idx}
                  iid={k}
                  tid={data.id}
                  fields={data.fields.map((e) => ({
                    value: e.name,
                    label: e.name,
                  }))}
                />
              ))}
            </Collapse.Panel>
          </Collapse>
        </Card>
      )}

      <Card
        bodyStyle={{ padding: "4px" }}
        style={{ marginTop: "12px", marginBottom: "12px" }}
        headerLine={false}
      >
        <Collapse keepDOM={false} lazyRender>
          <Collapse.Panel header={t("comment")} itemKey="1">
            <TextArea
              field="comment"
              value={data.comment}
              readonly={layout.readOnly}
              autosize
              placeholder={t("comment")}
              rows={1}
              onChange={(value) =>
                updateTable(data.id, { comment: value }, false)
              }
              onFocus={(e) => setEditField({ comment: e.target.value })}
              onBlur={(e) => {
                if (e.target.value === editField.comment) return;
                setUndoStack((prev) => [
                  ...prev,
                  {
                    action: Action.EDIT,
                    element: ObjectType.TABLE,
                    component: "self",
                    tid: data.id,
                    undo: editField,
                    redo: { comment: e.target.value },
                    message: t("edit_table", {
                      tableName: e.target.value,
                      extra: "[comment]",
                    }),
                  },
                ]);
                setRedoStack([]);
              }}
            />
          </Collapse.Panel>
        </Collapse>
      </Card>

      <div className="flex justify-between items-center gap-1 mb-2">
        <ColorPicker
          usePopover={true}
          readOnly={layout.readOnly}
          value={data.color}
          onChange={(color) => updateTable(data.id, { color })}
          onColorPick={(color) => handleColorPick(color)}
        />
        <div className="flex gap-1">
          <Button
            block
            disabled={layout.readOnly}
            onClick={() => {
              setIndexActiveKey("1");
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "index_add",
                  tid: data.id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add index]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                indices: [
                  ...data.indices,
                  {
                    id: data.indices.length,
                    name: `${data.name}_index_${data.indices.length}`,
                    unique: false,
                    fields: [],
                  },
                ],
              });
            }}
          >
            {t("add_index")}
          </Button>
          <Button
            block
            disabled={layout.readOnly}
            onClick={() => {
              const id = nanoid();
              setUndoStack((prev) => [
                ...prev,
                {
                  action: Action.EDIT,
                  element: ObjectType.TABLE,
                  component: "field_add",
                  tid: data.id,
                  fid: id,
                  message: t("edit_table", {
                    tableName: data.name,
                    extra: "[add field]",
                  }),
                },
              ]);
              setRedoStack([]);
              updateTable(data.id, {
                fields: [
                  ...data.fields,
                  {
                    id,
                    name: "",
                    type: "",
                    default: "",
                    check: "",
                    primary: false,
                    unique: false,
                    notNull: false,
                    increment: false,
                    comment: "",
                  },
                ],
              });
            }}
          >
            {t("add_field")}
          </Button>
          <Popover
            content={
              <div className="p-2" style={{ minWidth: "200px" }}>
                <div className="text-sm font-semibold mb-2">
                  {t("inherit_from_base_table")}
                </div>
                <Select
                  value={data.baseTableId || ""}
                  optionList={[
                    { label: t("none"), value: "" },
                    ...baseTables.map((bt) => ({
                      label: bt.name,
                      value: bt.id,
                    })),
                  ]}
                  onChange={(value) => {
                    if (layout.readOnly) return;

                    const baseTable = baseTables.find((bt) => bt.id === value);

                    // Get current fields excluding any that came from the old base table
                    const oldBaseTable = data.baseTableId
                      ? baseTables.find((bt) => bt.id === data.baseTableId)
                      : null;
                    const oldBaseTableFieldNames = oldBaseTable
                      ? new Set(oldBaseTable.fields.map((f) => f.name))
                      : new Set();

                    if (!value) {
                      // Removing inheritance
                      // When inheritance is applied, fields are ordered as: [baseTableFields, currentFields]
                      // Base table fields come first, then table's own fields
                      
                      if (oldBaseTable) {
                        const baseTableFieldNameSet = new Set(
                          oldBaseTable.fields.map((f) => f.name),
                        );
                        
                        // Calculate what table's own fields would be (fields NOT in base table)
                        // These are definitely table's own fields
                        const definitelyOwnFieldNames = new Set(
                          data.fields
                            .filter((f) => !baseTableFieldNameSet.has(f.name))
                            .map((f) => f.name),
                        );
                        
                        // Calculate how many non-conflicting base table fields were added
                        // (base table fields that don't conflict with table's own fields)
                        const nonConflictingBaseFields = oldBaseTable.fields.filter(
                          (btf) => !definitelyOwnFieldNames.has(btf.name),
                        );
                        
                        // Fields in the first nonConflictingBaseFields.length positions
                        // that match base table field names are inherited and should be removed
                        const fieldsToKeep = data.fields.filter((f, index) => {
                          // If field is not in base table, definitely keep (table's own)
                          if (!baseTableFieldNameSet.has(f.name)) {
                            return true;
                          }
                          
                          // Field is in base table - check if it's inherited or table's own
                          // If it's in the first N positions (where N = non-conflicting base fields),
                          // it's likely inherited
                          if (index < nonConflictingBaseFields.length) {
                            // This field is in the inherited section, remove it
                            return false;
                          }
                          
                          // Field is after the inherited section, likely table's own, keep it
                          return true;
                        });
                        
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.EDIT,
                            element: ObjectType.TABLE,
                            component: "self",
                            tid: data.id,
                            undo: {
                              baseTableId: data.baseTableId,
                              fields: data.fields,
                            },
                            redo: {
                              baseTableId: value,
                              fields: fieldsToKeep,
                            },
                            message: t("edit_table", {
                              tableName: data.name,
                              extra: "[remove base table inheritance]",
                            }),
                          },
                        ]);
                        setRedoStack([]);
                        updateTable(data.id, {
                          baseTableId: value,
                          fields: fieldsToKeep,
                        });
                      } else {
                        // No old base table, just update
                        setUndoStack((prev) => [
                          ...prev,
                          {
                            action: Action.EDIT,
                            element: ObjectType.TABLE,
                            component: "self",
                            tid: data.id,
                            undo: {
                              baseTableId: data.baseTableId,
                              fields: data.fields,
                            },
                            redo: {
                              baseTableId: value,
                              fields: data.fields,
                            },
                            message: t("edit_table", {
                              tableName: data.name,
                              extra: "[remove base table inheritance]",
                            }),
                          },
                        ]);
                        setRedoStack([]);
                        updateTable(data.id, {
                          baseTableId: value,
                        });
                      }
                      return;
                    }

                    // Filter out old base table fields to get table's OWN fields only
                    // These are fields that the user created, not inherited
                    const currentFields = data.fields.filter(
                      (f) => !oldBaseTableFieldNames.has(f.name),
                    );

                    // Applying/changing inheritance

                    // Get existing field names from table's OWN fields (to avoid conflicts)
                    // We only check against the table's own fields, not inherited ones
                    const existingFieldNames = new Set(
                      currentFields.map((f) => f.name),
                    );

                    // Track which fields from base table conflict with table's own fields
                    const conflictingFields = baseTable
                      ? baseTable.fields
                          .filter((f) => existingFieldNames.has(f.name))
                          .map((f) => f.name)
                      : [];

                    // Add new base table fields, but skip any that conflict with table's own fields
                    // (table's own fields take precedence - they are NOT replaced)
                    const baseTableFields = baseTable
                      ? baseTable.fields
                          .filter((f) => !existingFieldNames.has(f.name))
                          .map((f) => ({
                            ...f,
                            id: nanoid(), // Generate new IDs for inherited fields
                          }))
                      : [];

                    // Base table fields come first, then table's own fields
                    // This ensures inherited fields appear before user-defined fields
                    const newFields = [...baseTableFields, ...currentFields];

                    // Show a warning toast if there were conflicts
                    if (conflictingFields.length > 0 && value) {
                      Toast.warning(
                        t("field_conflict_warning", {
                          fields: conflictingFields.join(", "),
                          baseTableName: baseTable.name,
                        }),
                      );
                    }

                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.TABLE,
                        component: "self",
                        tid: data.id,
                        undo: {
                          baseTableId: data.baseTableId,
                          fields: data.fields,
                        },
                        redo: {
                          baseTableId: value,
                          fields: newFields,
                        },
                        message: t("edit_table", {
                          tableName: data.name,
                          extra: "[inherit from base table]",
                        }),
                      },
                    ]);
                    setRedoStack([]);
                    updateTable(data.id, {
                      baseTableId: value,
                      fields: newFields,
                    });
                  }}
                  placeholder={t("select_base_table")}
                  className="w-full"
                />
              </div>
            }
            trigger="click"
            position="top"
            showArrow
          >
            <Button block disabled={layout.readOnly}>
              {t("inherit_from")}
            </Button>
          </Popover>
          <Button
            type="danger"
            disabled={layout.readOnly}
            icon={<IconDeleteStroked />}
            onClick={() => deleteTable(data.id)}
          />
        </div>
      </div>
    </div>
  );
}
