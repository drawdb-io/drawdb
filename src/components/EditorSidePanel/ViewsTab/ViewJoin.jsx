import { useState } from "react";
import { Select, Button } from "@douyinfe/semi-ui";
import { IconChevronDown, IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useLayout } from "../../../hooks";
import { JoinType } from "../../../utils/views";
import { DragHandle } from "../../SortableList/DragHandle";
import { useTranslation } from "react-i18next";

export default function ViewJoin({ view, join, onChange, onDelete }) {
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  const joinTable = tables.find((tb) => tb.id === join.tableId);
  const complete = Boolean(join.on?.leftFieldId && join.on?.rightFieldId);
  const showOn = Boolean(joinTable) && (expanded || !complete);

  const precedingJoins = view.joins.slice(
    0,
    view.joins.findIndex((j) => j.id === join.id),
  );
  const leftScope = [view.baseTableId, ...precedingJoins.map((j) => j.tableId)]
    .filter(Boolean)
    .map((id) => tables.find((tb) => tb.id === id))
    .filter(Boolean);

  const leftOptions = leftScope.flatMap((table) =>
    table.fields.map((field) => ({
      label: `${table.name}.${field.name}`,
      value: `${table.id}:${field.id}`,
    })),
  );

  return (
    <div className="py-2 border-b border-color last:border-b-0">
      <div className="flex items-center gap-2">
        <div className="w-5 shrink-0 flex justify-center -mt-1.5">
          <DragHandle readOnly={layout.readOnly} id={join.id} />
        </div>
        <Select
          style={{ width: 88 }}
          value={join.type}
          disabled={layout.readOnly}
          optionList={Object.values(JoinType).map((value) => ({
            label: value,
            value,
          }))}
          onChange={(type) => onChange({ ...join, type })}
        />
        <Select
          className="flex-1 min-w-0"
          placeholder={t("select_a_table")}
          value={join.tableId}
          filter
          disabled={layout.readOnly}
          validateStatus={join.tableId ? "default" : "error"}
          optionList={tables.map((tb) => ({ label: tb.name, value: tb.id }))}
          onChange={(tableId) => onChange({ ...join, tableId, on: null })}
        />
        <div className="flex items-center shrink-0">
          <Button
            theme="borderless"
            type="tertiary"
            title={t("join_condition")}
            disabled={!joinTable || !complete}
            icon={
              <IconChevronDown
                className={`transition-transform duration-200 ease-out ${
                  showOn ? "rotate-180" : ""
                }`}
              />
            }
            onClick={() => setExpanded((prev) => !prev)}
          />
          <Button
            type="danger"
            theme="borderless"
            disabled={layout.readOnly}
            icon={<IconDeleteStroked />}
            onClick={onDelete}
          />
        </div>
      </div>

      <div
        inert={showOn ? undefined : ""}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
          showOn ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          {joinTable && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center gap-2">
                <div className="w-5 shrink-0" />
                <span className="w-[88px] shrink-0 text-center opacity-60">
                  ON
                </span>
                <Select
                  className="flex-1 min-w-0"
                  placeholder={t("column")}
                  filter
                  disabled={layout.readOnly}
                  validateStatus={join.on?.leftFieldId ? "default" : "error"}
                  value={
                    join.on?.leftFieldId
                      ? `${join.on.leftTableId}:${join.on.leftFieldId}`
                      : null
                  }
                  optionList={leftOptions}
                  onChange={(value) => {
                    const [leftTableId, leftFieldId] = value.split(":");
                    onChange({
                      ...join,
                      on: { ...join.on, leftTableId, leftFieldId },
                    });
                  }}
                />
                <div className="w-16 shrink-0" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 shrink-0" />
                <span className="w-[88px] shrink-0 text-center opacity-60">
                  =
                </span>
                <Select
                  className="flex-1 min-w-0"
                  placeholder={t("column")}
                  filter
                  disabled={layout.readOnly}
                  validateStatus={join.on?.rightFieldId ? "default" : "error"}
                  value={join.on?.rightFieldId ?? null}
                  optionList={joinTable.fields.map((field) => ({
                    label: `${joinTable.name}.${field.name}`,
                    value: field.id,
                  }))}
                  onChange={(rightFieldId) =>
                    onChange({ ...join, on: { ...join.on, rightFieldId } })
                  }
                />
                <div className="w-16 shrink-0" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
