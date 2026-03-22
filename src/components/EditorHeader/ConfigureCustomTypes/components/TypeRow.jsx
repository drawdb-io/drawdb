import { Button, Input, Select } from "@douyinfe/semi-ui";
import { IconDeleteStroked } from "@douyinfe/semi-icons";
import ColorPicker from "../../../EditorSidePanel/ColorPicker";
import { DB } from "../../../../data/constants";
import { databases } from "../../../../data/databases";

const dbOptions = Object.values(DB)
  .filter((value) => value !== DB.GENERIC)
  .map((value) => ({
    label: databases[value].name,
    value,
  }));

export default function TypeRow({ type, index, onChange, onDelete }) {
  return (
    <tr className="configure-custom-types-row border-b border-[var(--semi-color-border)] last:border-b-0">
      <td className="py-2 pr-3 align-middle">
        <Input
          value={type.type}
          placeholder="VARCHAR"
          onChange={(v) => onChange(index, "type", v)}
        />
      </td>
      <td className="py-2 pr-3 align-middle w-[1%] whitespace-nowrap">
        <ColorPicker
          usePopover={true}
          value={type.color}
          onColorPick={(color) => onChange(index, "color", color)}
        />
      </td>
      <td className="py-2 pr-3 align-middle w-[1%] whitespace-nowrap">
        <Select
          value={type.database}
          className="w-36"
          optionList={dbOptions}
          onChange={(v) => onChange(index, "database", v)}
        />
      </td>
      <td className="py-2 align-middle w-[1%] whitespace-nowrap">
        <Button
          icon={<IconDeleteStroked />}
          type="danger"
          size="large"
          onClick={() => onDelete(index)}
        />
      </td>
    </tr>
  );
}
