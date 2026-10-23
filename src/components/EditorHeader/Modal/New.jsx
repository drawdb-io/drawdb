import { useSettings } from "../../../hooks";
import Thumbnail from "../../Thumbnail";
import { Slot } from "../../../context/ExtensionsContext";

export default function New({
  templates,
  selectedTemplateId,
  setSelectedTemplateId,
}) {
  const { settings } = useSettings();

  return (
    <div className="grid grid-cols-3 gap-2 overflow-auto px-1">
      {templates.map((temp) => (
        <div
          key={temp.templateId}
          onClick={() => setSelectedTemplateId(temp.templateId)}
        >
          <div
            className={`rounded-md h-[180px] border-2 hover:border-dashed ${
              selectedTemplateId === temp.templateId
                ? "border-blue-400"
                : "border-zinc-400"
            }`}
          >
            <Thumbnail
              i={temp.templateId}
              diagram={temp}
              zoom={0.24}
              theme={settings.mode}
            />
          </div>
          <div className="text-center mt-1">{temp.title}</div>
        </div>
      ))}
      <Slot name="new-diagram-end" />
    </div>
  );
}
