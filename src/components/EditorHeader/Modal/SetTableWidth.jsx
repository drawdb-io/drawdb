import { InputNumber } from "@douyinfe/semi-ui";
import { useLayout } from "../../../hooks";

export default function SetTableWidth({ value, onChange }) {
  const { layout } = useLayout();

  return (
    <InputNumber
      className="w-full"
      value={value}
      readonly={layout.readOnly}
      min={180}
      formatter={(v) => `${v ?? ""}`.replace(/\D/g, "")}
      onNumberChange={(c) => onChange(c)}
    />
  );
}
