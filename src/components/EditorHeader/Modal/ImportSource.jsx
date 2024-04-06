import { Upload, Checkbox } from "@douyinfe/semi-ui";
import { STATUS } from "../../../data/constants";

export default function ImportSource({ importData, setImportData, setError }) {
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
        dragMainText="Drag and drop the file here or click to upload."
        dragSubText="Upload an sql file to autogenerate your tables and columns."
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
          * For the time being loading only MySQL scripts is supported.
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
          Overwrite existing diagram
        </Checkbox>
      </div>
    </div>
  );
}
