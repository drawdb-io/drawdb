import { MODAL } from "../data/constants";
import { useTranslation } from 'react-i18next'

export const getModalTitle = (modal) => {
  const { t } = useTranslation();
  switch (modal) {
    case MODAL.IMPORT:
    case MODAL.IMPORT_SRC:
      return t("Page.editor.ModalTitle.Import diagram");
    case MODAL.CODE:
      return t("Page.editor.ModalTitle.Export source");
    case MODAL.IMG:
      return t("Page.editor.ModalTitle.Export image");
    case MODAL.RENAME:
      return t("Page.editor.ModalTitle.Rename diagram");
    case MODAL.OPEN:
      return t("Page.editor.ModalTitle.Open diagram");
    case MODAL.SAVEAS:
      return t("Page.editor.ModalTitle.Save as");
    case MODAL.NEW:
      return t("Page.editor.ModalTitle.Create new diagram");
    case MODAL.TABLE_WIDTH:
      return t("Page.editor.ModalTitle.Set the table width");
    default:
      return "";
  }
};

export const getOkText = (modal) => {
  const { t } = useTranslation();
  switch (modal) {
    case MODAL.IMPORT:
    case MODAL.IMPORT_SRC:
      return t("Global.Import");
    case MODAL.CODE:
    case MODAL.IMG:
      return t("Global.Export");
    case MODAL.RENAME:
      return t("Global.Rename");
    case MODAL.OPEN:
      return t("Global.Open");
    case MODAL.SAVEAS:
      return t("Global.Save as");
    case MODAL.NEW:
      return t("Global.Create");
    default:
      return t("Global.Confirm");
  }
};
