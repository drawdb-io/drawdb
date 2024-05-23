import { Input } from "@douyinfe/semi-ui";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import BaseModal from "./BaseModal";

export default function SaveAs({ hideModal, title, setTitle }) {
  const { t } = useTranslation();
  const [saveAsTitle, setSaveAsTitle] = useState(title);

  const onOk = () => {
    setTitle(saveAsTitle);
    hideModal();
  };

  return (
    <BaseModal
      modalTitle={t("save_as")}
      okText={t("save_as")}
      onOk={onOk}
      onCancel={hideModal}
      okBtnDisabled={saveAsTitle === ""}
    >
      <Input
        placeholder={t("name")}
        value={saveAsTitle}
        onChange={(v) => setSaveAsTitle(v)}
      />
    </BaseModal>
  );
}
