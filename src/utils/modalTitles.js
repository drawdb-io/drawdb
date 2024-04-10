import { MODAL } from "../data/constants";

export const getModalTitle = (modal) => {
  switch (modal) {
    case MODAL.IMPORT:
    case MODAL.IMPORT_SRC:
      return "Import diagram";
    case MODAL.CODE:
      return "Export source";
    case MODAL.IMG:
      return "Export image";
    case MODAL.RENAME:
      return "Rename diagram";
    case MODAL.OPEN:
      return "Open diagram";
    case MODAL.SAVEAS:
      return "Save as";
    case MODAL.NEW:
      return "Create new diagram";
    case MODAL.TABLE_WIDTH:
      return "Set the table width";
    default:
      return "";
  }
};

export const getOkText = (modal) => {
  switch (modal) {
    case MODAL.IMPORT:
    case MODAL.IMPORT_SRC:
      return "Import";
    case MODAL.CODE:
    case MODAL.IMG:
      return "Export";
    case MODAL.RENAME:
      return "Rename";
    case MODAL.OPEN:
      return "Open";
    case MODAL.SAVEAS:
      return "Save as";
    case MODAL.NEW:
      return "Create";
    default:
      return "Confirm";
  }
};
