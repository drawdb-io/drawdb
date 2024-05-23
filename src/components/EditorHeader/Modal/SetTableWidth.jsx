import { InputNumber } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../../hooks";
import BaseModal from "./BaseModal";

export default function SetTableWidth({ hideModal }) {
  const { t } = useTranslation();
  const { settings, setSettings } = useSettings();

  return (
    <BaseModal
      modalTitle={t("table_width")}
      onOk={hideModal}
      onCancel={hideModal}
    >
      <InputNumber
        className="w-full"
        value={settings.tableWidth}
        onChange={(c) => {
          if (c < 180) return;
          setSettings((prev) => ({ ...prev, tableWidth: c }));
        }}
      />
    </BaseModal>
  );
}
