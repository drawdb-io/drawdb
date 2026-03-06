import { InputNumber } from "@douyinfe/semi-ui";
import { useLayout } from "../../../hooks";

export default function SetTableWidth({ tempWidth, setTempWidth }) {
  const { layout } = useLayout();

  return (
    <InputNumber
      className="w-full"
      value={tempWidth}
      readonly={layout.readOnly}
      onChange={(c) => {
        if (c < 180) return;
        setTempWidth(c);
      }}
    />
  );
}
