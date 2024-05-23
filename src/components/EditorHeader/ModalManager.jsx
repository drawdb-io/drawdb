import { MODAL } from "../../data/constants";
import Rename from "./Modal/Rename";
import Open from "./Modal/Open";
import New from "./Modal/New";
import ImportDiagram from "./Modal/ImportDiagram";
import ImportSource from "./Modal/ImportSource";
import SetTableWidth from "./Modal/SetTableWidth";
import Language from "./Modal/Language";
import ExportImage from "./Modal/ExportImage";
import ExportJson from "./Modal/ExportJson";
import ExportSql from "./Modal/ExportSql";
import SaveAs from "./Modal/SaveAs";

export default function ModalManager({
  modal,
  hideModal,
  title,
  setTitle,
  setDiagramId,
}) {
  switch (modal) {
    case MODAL.EXPORT_IMG:
      return <ExportImage hideModal={hideModal} title={title} />;
    case MODAL.EXPORT_SQL:
      return <ExportSql hideModal={hideModal} title={title} />;
    case MODAL.EXPORT_JSON:
      return <ExportJson hideModal={hideModal} title={title} />;
    case MODAL.IMPORT_DIAGRAM:
      return <ImportDiagram hideModal={hideModal} setTitle={setTitle} />;
    case MODAL.IMPORT_SRC:
      return <ImportSource hideModal={hideModal} />;
    case MODAL.NEW:
      return <New hideModal={hideModal} />;
    case MODAL.OPEN:
      return (
        <Open
          hideModal={hideModal}
          setDiagramId={setDiagramId}
          setTitle={setTitle}
        />
      );
    case MODAL.SAVEAS:
      return <SaveAs hideModal={hideModal} title={title} setTitle={setTitle} />;
    case MODAL.RENAME:
      return <Rename hideModal={hideModal} title={title} setTitle={setTitle} />;
    case MODAL.TABLE_WIDTH:
      return <SetTableWidth hideModal={hideModal} />;
    case MODAL.LANGUAGE:
      return <Language hideModal={hideModal} />;
    default:
      return <></>;
  }
}
