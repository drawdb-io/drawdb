import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { db } from "../../../data/db";
import Thumbnail from "../../Thumbnail";
import { useSettings } from "../../../hooks";
import BaseModal from "./BaseModal";

export default function New({ hideModal }) {
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [selectedTemplateId, setSelectedTemplateId] = useState(-1);

  const templates = useLiveQuery(() => db.templates.toArray());

  const createNewDiagram = (id) => {
    const newWindow = window.open("/editor");
    newWindow.name = "lt " + id;
  };

  const onOk = () => {
    hideModal();
    createNewDiagram(selectedTemplateId);
  };

  return (
    <BaseModal
      modalTitle={t("create_new_diagram")}
      okText={t("create")}
      onOk={onOk}
      onCancel={hideModal}
      width={740}
    >
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
    </BaseModal>
  );
}
