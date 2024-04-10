import { InputNumber } from "@douyinfe/semi-ui";
import { useSettings } from "../../../hooks";

export default function SetTableWidth() {
  const { settings, setSettings } = useSettings();

  return (
    <InputNumber
      className="w-full"
      value={settings.tableWidth}
      onChange={(c) => {
        if (c < 180) return;
        setSettings((prev) => ({ ...prev, tableWidth: c }));
      }}
    />
  );
}
