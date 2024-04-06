import { Button } from "@douyinfe/semi-ui";
import { IconCheckboxTick } from "@douyinfe/semi-icons";
import { tableThemes } from "../data/constants";

export default function ColorPallete({
  currentColor,
  onClearColor,
  onPickColor,
}) {
  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <div className="font-medium">Theme</div>
        <Button type="tertiary" size="small" onClick={onClearColor}>
          Clear
        </Button>
      </div>
      <hr />
      <div className="py-3 space-y-3">
        <div>
          {tableThemes.slice(0, Math.ceil(tableThemes.length / 2)).map((c) => (
            <button
              key={c}
              style={{ backgroundColor: c }}
              className="p-3 rounded-full mx-1"
              onClick={() => onPickColor(c)}
            >
              {currentColor === c ? (
                <IconCheckboxTick style={{ color: "white" }} />
              ) : (
                <IconCheckboxTick style={{ color: c }} />
              )}
            </button>
          ))}
        </div>
        <div>
          {tableThemes.slice(Math.ceil(tableThemes.length / 2)).map((c) => (
            <button
              key={c}
              style={{ backgroundColor: c }}
              className="p-3 rounded-full mx-1"
              onClick={() => onPickColor(c)}
            >
              <IconCheckboxTick
                style={{
                  color: currentColor === c ? "white" : c,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
