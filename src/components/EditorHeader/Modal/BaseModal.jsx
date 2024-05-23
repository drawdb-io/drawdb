import { Modal as SemiUIModal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export default function Modal({
  children,
  modalTitle,
  okText,
  onOk,
  onCancel,
  okBtnDisabled,
  width,
}) {
  const { t } = useTranslation();

  return (
    <SemiUIModal
      title={modalTitle || ""}
      visible={true}
      onOk={onOk}
      onCancel={onCancel}
      centered
      closeOnEsc={true}
      okText={okText || t("confirm")}
      okButtonProps={{
        disabled: okBtnDisabled,
      }}
      cancelText={t("cancel")}
      width={width || 600}
      // bodyStyle={{ maxHeight: window.innerHeight - 280, overflow: "auto" }}
    >
      {children}
    </SemiUIModal>
  );
}
