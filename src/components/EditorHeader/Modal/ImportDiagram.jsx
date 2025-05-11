import {
  ddbDiagramIsValid,
  jsonDiagramIsValid,
} from "../../../utils/validateSchema";
import { Upload, Banner } from "@douyinfe/semi-ui";
import { DB, IMPORT_FROM, STATUS } from "../../../data/constants";
import {
  useAreas,
  useEnums,
  useNotes,
  useDiagram,
  useTypes,
} from "../../../hooks";
import { useTranslation } from "react-i18next";
import { fromDBML } from "../../../utils/importFrom/dbml";

export default function ImportDiagram({
  setImportData,
  error,
  setError,
  importFrom,
}) {
  const { areas } = useAreas();
  const { notes } = useNotes();
  const { tables, relationships, database } = useDiagram();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { t } = useTranslation();

  const diagramIsEmpty = () => {
    return (
      tables.length === 0 &&
      relationships.length === 0 &&
      notes.length === 0 &&
      areas.length === 0 &&
      types.length === 0 &&
      enums.length === 0
    );
  };

  const loadJsonData = (file, e) => {
    let jsonObject = null;
    try {
      jsonObject = JSON.parse(e.target.result);
    } catch (error) {
      setError({
        type: STATUS.ERROR,
        message: "The file contains an error.",
      });
      return;
    }

    if (file.type === "application/json") {
      if (!jsonDiagramIsValid(jsonObject)) {
        setError({
          type: STATUS.ERROR,
          message: "The file is missing necessary properties for a diagram.",
        });
        return;
      }
    } else if (file.name.split(".").pop() === "ddb") {
      if (!ddbDiagramIsValid(jsonObject)) {
        setError({
          type: STATUS.ERROR,
          message: "The file is missing necessary properties for a diagram.",
        });
        return;
      }
    }

    if (!jsonObject.database) {
      jsonObject.database = DB.GENERIC;
    }

    if (jsonObject.database !== database) {
      setError({
        type: STATUS.ERROR,
        message:
          "The imported diagram and the open diagram don't use matching databases.",
      });
      return;
    }

    let ok = true;
    jsonObject.relationships.forEach((rel) => {
      const startTable = jsonObject.tables.find(
        (t) => t.id === rel.startTableId,
      );
      const endTable = jsonObject.tables.find((t) => t.id === rel.endTableId);

      if (!startTable || !endTable) {
        setError({
          type: STATUS.ERROR,
          message: `Relationship ${rel.name} references a table that does not exist.`,
        });
        ok = false;
        return;
      }

      if (
        !startTable.fields.find((f) => f.id === rel.startFieldId) ||
        !endTable.fields.find((f) => f.id === rel.endFieldId)
      ) {
        setError({
          type: STATUS.ERROR,
          message: `Relationship ${rel.name} references a field that does not exist.`,
        });
        ok = false;
        return;
      }
    });

    if (!ok) return;

    setImportData(jsonObject);
    if (diagramIsEmpty()) {
      setError({
        type: STATUS.OK,
        message: "Everything looks good. You can now import.",
      });
    } else {
      setError({
        type: STATUS.WARNING,
        message:
          "The current diagram is not empty. Importing a new diagram will overwrite the current changes.",
      });
    }
  };

  const loadDBMLData = (e) => {
    try {
      setImportData(fromDBML(e.target.result));
    } catch (error) {
      const message = `${error.diags[0].name} [Ln ${error.diags[0].location.start.line}, Col ${error.diags[0].location.start.column}]: ${error.diags[0].message}`;

      setError({ type: STATUS.ERROR, message });
    }
  };

  const getAcceptableFileTypes = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return "application/json,.ddb";
      case IMPORT_FROM.DBML:
        return ".dbml";
      default:
        return "";
    }
  };

  const getDragSubText = () => {
    switch (importFrom) {
      case IMPORT_FROM.JSON:
        return `${t("supported_types")} JSON, DDB`;
      case IMPORT_FROM.DBML:
        return `${t("supported_types")} DBML`;
      default:
        return "";
    }
  };

  return (
    <div>
      <Upload
        action="#"
        beforeUpload={({ file, fileList }) => {
          const f = fileList[0].fileInstance;
          if (!f) {
            return;
          }
          const reader = new FileReader();
          reader.onload = async (e) => {
            if (importFrom == IMPORT_FROM.JSON) loadJsonData(f, e);
            if (importFrom == IMPORT_FROM.DBML) loadDBMLData(e);
          };
          reader.readAsText(f);

          return {
            autoRemove: false,
            fileInstance: file.fileInstance,
            status: "success",
            shouldUpload: false,
          };
        }}
        draggable={true}
        dragMainText={t("drag_and_drop_files")}
        dragSubText={getDragSubText()}
        accept={getAcceptableFileTypes()}
        onRemove={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
      {error.type === STATUS.ERROR ? (
        <Banner
          type="danger"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : error.type === STATUS.OK ? (
        <Banner
          type="info"
          fullMode={false}
          description={<div>{error.message}</div>}
        />
      ) : (
        error.type === STATUS.WARNING && (
          <Banner
            type="warning"
            fullMode={false}
            description={<div>{error.message}</div>}
          />
        )
      )}
    </div>
  );
}
