import { Input } from "@douyinfe/semi-ui";
import { saveAs } from "file-saver";
import { useTranslation } from "react-i18next";
import BaseModal from "./BaseModal";

export default function ExportModal({
  children,
  modalTitle,
  exportData,
  setExportData,
  onCancel,
}) {
  const { t } = useTranslation();

  const onOk = () => {
    saveAs(exportData.data, `${exportData.filename}.${exportData.extension}`);
  };

  return (
    <BaseModal
      modalTitle={modalTitle}
      okText={t("export")}
      onOk={onOk}
      onCancel={onCancel}
      okBtnDisabled={!exportData.data}
    >
      <div className="text-sm font-semibold mt-2">{t("filename")}:</div>
      <Input
        className="mb-1"
        value={exportData.filename}
        placeholder={t("filename")}
        suffix={<div className="p-2">{`.${exportData.extension}`}</div>}
        onChange={(value) =>
          setExportData((prev) => ({ ...prev, filename: value }))
        }
        field="filename"
      />
      {children}
    </BaseModal>
  );
}
