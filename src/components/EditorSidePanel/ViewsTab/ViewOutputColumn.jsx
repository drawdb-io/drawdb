import { Select, Input, Button } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import { useDiagram, useLayout } from "../../../hooks";
import { viewColumnOptions } from "../../../utils/views";
import { DragHandle } from "../../SortableList/DragHandle";
import { useTranslation } from "react-i18next";

export default function ViewOutputColumn({ view, column, onChange, onDelete }) {
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { t } = useTranslation();

  const options = viewColumnOptions(view, tables);

  return (
    <div className="flex items-center gap-2 py-2 border-b border-color last:border-b-0">
      <div className="w-5 shrink-0 flex justify-center -mt-1.5">
        <DragHandle readOnly={layout.readOnly} id={column.id} />
      </div>
      <Select
        className="flex-1 min-w-0"
        placeholder={t("column")}
        filter
        disabled={layout.readOnly}
        validateStatus={column.fieldId ? "default" : "error"}
        value={column.fieldId ? `${column.tableId}:${column.fieldId}` : null}
        optionList={options}
        onChange={(value) => {
          const [tableId, fieldId] = value.split(":");
          onChange({ ...column, tableId, fieldId });
        }}
      />
      <Input
        style={{ width: 104 }}
        placeholder={t("alias")}
        readonly={layout.readOnly}
        value={column.alias}
        onChange={(alias) => onChange({ ...column, alias })}
      />
      <Button
        type="danger"
        theme="borderless"
        disabled={layout.readOnly}
        icon={<IconDeleteStroked />}
        onClick={onDelete}
      />
    </div>
  );
}
