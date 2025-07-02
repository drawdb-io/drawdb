import { ColorPicker as SemiColorPicker } from "@douyinfe/semi-ui";
import { useState } from "react";

export default function ColorPicker({
  children,
  value,
  onChange,
  onColorPick,
  ...props
}) {
  const [pickedColor, setPickedColor] = useState(null);

  const handleColorPick = () => {
    if (pickedColor) onColorPick(pickedColor);
    setPickedColor(null);
  };

  return (
    <div
      onPointerUp={handleColorPick}
      onBlur={handleColorPick}
      onMouseLeave={handleColorPick}
    >
      <SemiColorPicker
        {...props}
        value={SemiColorPicker.colorStringToValue(value)}
        onChange={({ hex: color }) => {
          setPickedColor(color);
          onChange(color);
        }}
      >
        {children || (
          <div
            className="h-8 w-8 rounded-md"
            style={{ backgroundColor: value }}
          />
        )}
      </SemiColorPicker>
    </div>
  );
}
