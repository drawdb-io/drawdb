import { InputNumber } from "@douyinfe/semi-ui";
import { useLayout, useSettings } from "../../../hooks";

export default function SetTableWidth() {
  const { layout } = useLayout();
  const { settings, setSettings } = useSettings();

  return (
    <InputNumber
      className="w-full"
      value={settings.tableWidth}
      readonly={layout.readOnly}
      onChange={(c) => {
        if (c < 180) return;
        setSettings((prev) => ({ ...prev, tableWidth: c }));
      }}
    />
  );
}
