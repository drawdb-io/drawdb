import { React, useState, useContext } from "react";
// import { sqlDataTypes } from "../data/data";
import { IconEdit, IconPlus, IconMore, IconMinus } from "@douyinfe/semi-icons";
import {
  // Modal,
  // Form,
  // Checkbox,
  // Row,
  // Col,
  Popover,
  Tag,
  Button,
  SideSheet,
} from "@douyinfe/semi-ui";
import { LayoutContext, TableContext } from "../pages/editor";

export default function Table(props) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const [visible, setVisible] = useState(false);
  const {layout} = useContext(LayoutContext);
  const {setTables} = useContext(TableContext);
  // const [editFieldVisible, setEditFieldVisible] = useState(-1);
  // const [field, setField] = useState({
  //   name: "",
  //   type: "",
  //   default: "",
  //   primary: false,
  //   unique: false,
  //   notNull: false,
  //   increment: false,
  //   comment: "",
  // });

  const height = props.tableData.fields.length * 36 + 50 + 3;

  return (
    <g>
      <foreignObject
        key={props.tableData.id}
        x={props.tableData.x}
        y={props.tableData.y}
        width={200}
        height={height}
        className="shadow-lg rounded-md cursor-move"
        onMouseDown={props.onMouseDown}
        onMouseEnter={() => {
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          props.setOnRect({
            tableId: -1,
            field: -2,
          });
        }}
      >
        <div
          className={`border-2 ${
            isHovered ? "border-sky-500" : "border-gray-400"
          } bg-gray-100 select-none rounded-md w-full`}
        >
          <div
            className={`h-[10px] w-full rounded-t-md`}
            style={{ backgroundColor: props.tableData.color }}
          />
          <div className="font-bold text-slate-800 h-[40px] flex justify-between items-center border-b border-gray-400 bg-gray-200">
            <div className="px-3">{props.tableData.name}</div>
            {isHovered && (
              <div className="flex justify-end items-center mx-2">
                <Button
                  icon={<IconEdit />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#2f68ad",
                    opacity: "0.7",
                    marginRight: "6px",
                  }}
                  onClick={() => setVisible(true)}
                ></Button>
                <Button
                  icon={<IconPlus />}
                  size="small"
                  theme="solid"
                  style={{
                    backgroundColor: "#3cb558",
                    opacity: "0.7",
                    marginRight: "6px",
                  }}
                ></Button>
                <Popover
                  content={
                    <div className="text-slate-600">
                      <p className="mb-2">
                        <strong>Comment :</strong>{" "}
                        {props.tableData.comment === ""
                          ? "No comment"
                          : <div>{props.tableData.comment}</div>}
                      </p>
                      <p className="text-slate-600">
                        <strong
                          className={`${
                            props.tableData.indices.length === 0 ? "" : "block"
                          }`}
                        >
                          Indices :
                        </strong>{" "}
                        {props.tableData.indices.length === 0 ? (
                          "No indices"
                        ) : (
                          <div>
                            {props.tableData.indices.map((index, k) => (
                              <div
                                className="flex items-center my-1 px-2 py-1 rounded bg-gray-100"
                                key={k}
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
                      </p>
                    </div>
                  }
                  position="rightTop"
                  showArrow
                  trigger="click"
                  style={{width: "200px"}}
                >
                  <Button
                    icon={<IconMore />}
                    type="tertiary"
                    size="small"
                    theme="solid"
                    style={{
                      opacity: "0.7",
                    }}
                  ></Button>
                </Popover>
              </div>
            )}
          </div>
          {props.tableData.fields.map((e, i) => {
            return (
              <Popover
                key={i}
                content={
                  <>
                    <div className="flex justify-between items-center pb-2">
                      <p className="me-4 font-bold">{e.name}</p>
                      <p className="ms-4 text-slate-600">{e.type}</p>
                    </div>
                    <hr />
                    {e.primary && (
                      <Tag color="blue" className="me-2 my-2">
                        Primary
                      </Tag>
                    )}
                    {e.unique && (
                      <Tag color="amber" className="me-2 my-2">
                        Unique
                      </Tag>
                    )}
                    {e.notNull && (
                      <Tag color="purple" className="me-2 my-2">
                        Not null
                      </Tag>
                    )}
                    {e.increment && (
                      <Tag color="green" className="me-2 my-2">
                        Increment
                      </Tag>
                    )}
                    <p className="text-slate-600">
                      <strong>Default :</strong>{" "}
                      {e.default === "" ? "Not set" : e.default}
                    </p>
                    <p className="text-slate-600">
                      <strong>Comment :</strong>{" "}
                      {e.comment === "" ? "Not comment" : e.comment}
                    </p>
                  </>
                }
                position="right"
                showArrow
              >
                <div
                  className={`${
                    i === props.tableData.fields.length - 1
                      ? ""
                      : "border-b border-gray-400"
                  } h-[36px] px-2 py-1 flex justify-between`}
                  onMouseEnter={() => {
                    setHoveredField(i);
                    props.setOnRect({
                      tableId: props.tableData.id,
                      field: i,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredField(-1);
                  }}
                >
                  <div
                    className={`${hoveredField === i ? "text-slate-500" : ""}`}
                  >
                    <button
                      className={`w-[10px] h-[10px] bg-[#2f68ad] opacity-80 z-50 rounded-full me-2`}
                      onMouseDown={(ev) => {
                        props.handleGripField(i);
                        props.setLine((prev) => ({
                          ...prev,
                          startFieldId: i,
                          startTableId: props.tableData.id,
                          startX: props.tableData.x + 15,
                          startY: props.tableData.y + i * 36 + 50 + 19,
                          endX: props.tableData.x + 15,
                          endY: props.tableData.y + i * 36 + 50 + 19,
                        }));
                      }}
                    ></button>
                    {e.name}
                  </div>
                  <div className="text-slate-400">
                    {hoveredField === i ? (
                      <Button
                        theme="solid"
                        size="small"
                        style={{
                          opacity: "0.7",
                          backgroundColor: "#d42020",
                        }}
                        onClick={(ev) => {
                          setTables((prev) => {
                            const updatedTables = [...prev];
                            const updatedFields = [
                              ...updatedTables[props.tableData.id].fields,
                            ];
                            updatedFields.splice(i, 1);
                            updatedTables[props.tableData.id].fields = [...updatedFields];
                            return updatedTables;
                          });
                        }}
                        icon={<IconMinus />}
                      ></Button>
                    ) : (
                      e.type
                    )}
                  </div>
                </div>
              </Popover>
            );
          })}
        </div>
      </foreignObject>
      <SideSheet
        title="Sidesheet"
        visible={visible && !layout.sidebar}
        onCancel={() => setVisible((prev) => !prev)}
      >
        <p>This is the content of a basic sidesheet.</p>
        <p>Here is more content...</p>
      </SideSheet>
    </g>
  );
}
