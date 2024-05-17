import { db } from "../../../data/db";
import { useSettings } from "../../../hooks";
import { useLiveQuery } from "dexie-react-hooks";
import Thumbnail from "../../Thumbnail";
import { useTranslation } from "react-i18next";

export default function New({ selectedTemplateId, setSelectedTemplateId }) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const templates = useLiveQuery(() => db.templates.toArray());

  return (
    <div className="grid grid-cols-3 gap-2 overflow-auto px-1">
      <div onClick={() => setSelectedTemplateId(0)}>
        <div
          className={`rounded-md h-[180px] border-2 hover:border-dashed ${
            selectedTemplateId === 0 ? "border-blue-400" : "border-zinc-400"
          }`}
        >
          <Thumbnail i={0} diagram={{}} zoom={0.24} theme={settings.mode} />
        </div>
        <div className="text-center mt-1">{t("blank")}</div>
      </div>
      {templates?.map((temp, i) => (
        <div key={i} onClick={() => setSelectedTemplateId(temp.id)}>
          <div
            className={`rounded-md h-[180px] border-2 hover:border-dashed ${
              selectedTemplateId === temp.id
                ? "border-blue-400"
                : "border-zinc-400"
            }`}
          >
            <Thumbnail
              i={temp.id}
              diagram={temp}
              zoom={0.24}
              theme={settings.mode}
            />
          </div>
          <div className="text-center mt-1">{temp.title}</div>
        </div>
      ))}
    </div>
  );
}
