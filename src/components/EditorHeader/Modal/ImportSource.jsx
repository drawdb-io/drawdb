import { Upload, Checkbox, Banner } from "@douyinfe/semi-ui";
import { STATUS } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function ImportSource({
  importData,
  setImportData,
  error,
  setError,
}) {
  const { t } = useTranslation();

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
            setImportData((prev) => ({ ...prev, src: e.target.result }));
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
        dragSubText={t("upload_sql_to_generate_diagrams")}
        accept=".sql"
        onRemove={() => {
          setError({
            type: STATUS.NONE,
            message: "",
          });
          setImportData((prev) => ({ ...prev, src: "" }));
        }}
        onFileChange={() =>
          setError({
            type: STATUS.NONE,
            message: "",
          })
        }
        limit={1}
      />
      <div>
        <div className="text-xs mb-3 mt-1 opacity-80">
          {t("only_mysql_supported")}
        </div>
        <Checkbox
          aria-label="overwrite checkbox"
          checked={importData.overwrite}
          defaultChecked
          onChange={(e) =>
            setImportData((prev) => ({
              ...prev,
              overwrite: e.target.checked,
            }))
          }
        >
          {t("overwrite_existing_diagram")}
        </Checkbox>
        <div className="mt-2">
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
      </div>
    </div>
  );
}
