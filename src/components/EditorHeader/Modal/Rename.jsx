import { Input } from "@douyinfe/semi-ui";
import { useRef } from "react";
import { useTranslation } from "react-i18next";
import BaseModal from "./BaseModal";

export default function Rename({ hideModal, title, setTitle }) {
  const { t } = useTranslation();
  const originalTitle = useRef(title);

  const onCancel = () => {
    setTitle(originalTitle.current);
    hideModal();
  };

  const onOk = () => {
    hideModal();
  };

  return (
    <BaseModal
      modalTitle={t("rename_diagram")}
      okText={t("rename")}
      onOk={onOk}
      onCancel={onCancel}
      okBtnDisabled={title === ""}
    >
      <Input
        placeholder={t("name")}
        value={title}
        onChange={(v) => setTitle(v)}
      />
    </BaseModal>
  );
}
