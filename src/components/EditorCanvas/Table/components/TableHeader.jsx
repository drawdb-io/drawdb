import { IconEdit, IconMore, IconDeleteStroked } from "@douyinfe/semi-icons";
import { Popover, Tag, Button } from "@douyinfe/semi-ui";
import { useDiagram } from "../../../../hooks";

export default function TableHeader({ tableData, settings, openEditor, t }) {
  const { deleteTable } = useDiagram();

  return (
    <div
      className={`overflow-hidden font-bold h-[40px] flex justify-between items-center border-b border-gray-400 ${
        settings.mode === "light" ? "bg-zinc-200" : "bg-zinc-900"
      }`}
    >
      <div className="px-3 overflow-hidden text-ellipsis whitespace-nowrap">
        {tableData.name}
      </div>
      <div className="hidden group-hover:block">
        <div className="flex justify-end items-center mx-2">
          <Button
            icon={<IconEdit />}
            size="small"
            theme="solid"
            style={{
              backgroundColor: "#2f68adb3",
              marginRight: "6px",
            }}
            onClick={openEditor}
          />
          <Popover
            key={tableData.key}
            content={
              <div className="popover-theme">
                <div className="mb-2">
                  <strong>{t("comment")}:</strong>{" "}
                  {tableData.comment === "" ? (
                    t("not_set")
                  ) : (
                    <div>{tableData.comment}</div>
                  )}
                </div>
                <div>
                  <strong
                    className={`${
                      tableData.indices.length === 0 ? "" : "block"
                    }`}
                  >
                    {t("indices")}:
                  </strong>{" "}
                  {tableData.indices.length === 0 ? (
                    t("not_set")
                  ) : (
                    <div>
                      {tableData.indices.map((index, k) => (
                        <div
                          key={k}
                          className={`flex items-center my-1 px-2 py-1 rounded ${
                            settings.mode === "light"
                              ? "bg-gray-100"
                              : "bg-zinc-800"
                          }`}
                        >
                          <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500"></i>
                          <div>
                            {index.fields.map((f) => (
                              <Tag color="blue" key={f} className="me-1">
                                {f}
                              </Tag>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  icon={<IconDeleteStroked />}
                  type="danger"
                  block
                  style={{ marginTop: "8px" }}
                  onClick={() => deleteTable(tableData.id)}
                >
                  {t("delete")}
                </Button>
              </div>
            }
            position="rightTop"
            showArrow
            trigger="click"
            style={{ width: "200px", wordBreak: "break-word" }}
          >
            <Button
              icon={<IconMore />}
              type="tertiary"
              size="small"
              style={{
                backgroundColor: "#808080b3",
                color: "white",
              }}
            />
          </Popover>
        </div>
      </div>
    </div>
  );
}
