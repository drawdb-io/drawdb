import { Select, Input, Button } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useLayout } from "../../../hooks";
import {
  ConditionOperator,
  operatorTakesValue,
  viewColumnOptions,
} from "../../../utils/views";
import { useTranslation } from "react-i18next";

export default function ViewCondition({
  view,
  condition,
  first,
  onChange,
  onDelete,
}) {
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { t } = useTranslation();
  const takesValue = operatorTakesValue(condition.operator);

  return (
    <div className="py-2 border-b border-color last:border-b-0">
      <div className="flex items-center gap-2">
        {first ? (
          <div className="w-[84px] shrink-0" />
        ) : (
          <Select
            style={{ width: 84 }}
            value={condition.connector ?? "AND"}
            disabled={layout.readOnly}
            optionList={[
              { label: "AND", value: "AND" },
              { label: "OR", value: "OR" },
            ]}
            onChange={(connector) => onChange({ ...condition, connector })}
          />
        )}
        <Select
          className="flex-1 min-w-0"
          placeholder={t("column")}
          filter
          disabled={layout.readOnly}
          validateStatus={condition.fieldId ? "default" : "error"}
          value={
            condition.fieldId
              ? `${condition.tableId}:${condition.fieldId}`
              : null
          }
          optionList={viewColumnOptions(view, tables)}
          onChange={(value) => {
            const [tableId, fieldId] = value.split(":");
            onChange({ ...condition, tableId, fieldId });
          }}
        />
        <Button
          type="danger"
          theme="borderless"
          disabled={layout.readOnly}
          icon={<IconDeleteStroked />}
          onClick={onDelete}
        />
      </div>
      <div className="flex items-center gap-2 mt-2">
        <div className="w-[84px] shrink-0" />
        <Select
          className={takesValue ? "shrink-0" : "flex-1 min-w-0"}
          style={takesValue ? { width: 96 } : undefined}
          value={condition.operator}
          disabled={layout.readOnly}
          optionList={Object.values(ConditionOperator).map((value) => ({
            label: value,
            value,
          }))}
          onChange={(operator) => onChange({ ...condition, operator })}
        />
        {takesValue && (
          <Input
            className="flex-1 min-w-0"
            placeholder={t("value")}
            readonly={layout.readOnly}
            value={condition.value}
            onChange={(value) => onChange({ ...condition, value })}
          />
        )}
        <div className="w-8 shrink-0" />
      </div>
    </div>
  );
}
