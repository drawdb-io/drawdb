import { React, useState } from "react";
import Node from "./node";
import {
  IconEdit,
  IconDelete,
  IconPlus,
  IconMinus,
} from "@douyinfe/semi-icons";
import { Modal, Form, Checkbox, Row, Col } from "@douyinfe/semi-ui";

const Rect = (props) => {
  const [node, setNode] = useState(Node.NONE);
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  const [name, setName] = useState("New Table");
  const [visible, setVisible] = useState(false);
  const [editFieldVisible, setEditFieldVisible] = useState(-1);

  const handleOkEdit = () => {
    setEditFieldVisible(-1);
  };

  const handleOk = () => {
    setVisible(false);
  };

  const sqlDataTypes = [
    "INT",
    "SMALLINT",
    "BIGINT",
    "DECIMAL",
    "NUMERIC",
    "FLOAT",
    "REAL",
    "DOUBLE PRECISION",
    "CHAR",
    "VARCHAR",
    "TEXT",
    "DATE",
    "TIME",
    "TIMESTAMP",
    "INTERVAL",
    "BOOLEAN",
    "BINARY",
    "VARBINARY",
    "BLOB",
    "CLOB",
    "UUID",
    "XML",
    "JSON",
  ];

  const [fields, setFields] = useState([
    {
      name: "id",
      type: "uuid",
      default: "",
      primary: true,
      unique: true,
      notNull: true,
      increment: false,
    },
    {
      name: "name",
      type: "varchar(20)",
      default: "n/a",
      primary: false,
      unique: false,
      notNull: true,
      increment: false,
    },
  ]);

  const height = fields.length * 36 + 40 + 4;

  return (
    <g>
      <foreignObject
        key={props.id}
        x={props.x}
        y={props.y}
        width={props.width}
        height={height}
        style={{ cursor: "move" }}
        onMouseDown={props.onMouseDown}
        onMouseEnter={() => {
          setIsHovered(true);
          props.setOnRect(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          props.setOnRect(false);
        }}
      >
        <div
          className={`border-2 ${
            isHovered ? "border-sky-500" : "border-gray-500"
          } bg-gray-300 select-none rounded-md`}
        >
          <div className="p-3 font-bold text-slate-800 h-[40px] bg-gray-400 rounded-t-md flex justify-between items-center">
            {
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`p-1 select-text w-[100px] bg-gray-400 focus:bg-gray-200 ${
                    name < 1
                      ? "ring-2 ring-red-600"
                      : "focus:ring-2 focus:ring-sky-500 "
                  }`}
                />
              </form>
            }
            {isHovered && (
              <div className="flex justify-end items-center">
                <button className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80">
                  <IconEdit />
                </button>
                <button
                  className="btn bg-green-600 text-white text-xs py-1 px-2 me-2 opacity-80"
                  onClick={(e) => {
                    setVisible(true);
                  }}
                >
                  <IconPlus />
                </button>
                <button
                  className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80"
                  onClick={(e) => props.onDelete(props.id)}
                >
                  <IconDelete />
                </button>
              </div>
            )}
          </div>
          {fields.map((e, i) => {
            return (
              <div
                key={i}
                className={`${
                  i === fields.length - 1 ? "" : "border-b-2 border-gray-400"
                } h-[36px] p-2 flex justify-between`}
                onMouseEnter={() => {
                  setHoveredField(i);
                }}
                onMouseLeave={() => {
                  setHoveredField(-1);
                }}
              >
                <div>{e.name}</div>
                <div className="text-slate-600">
                  {hoveredField === i ? (
                    <div>
                      <button
                        className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80"
                        onClick={(e) => setEditFieldVisible(i)}
                      >
                        <IconEdit />
                      </button>
                      <button
                        className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80"
                        onClick={(e) => {
                          const updatedFields = [...fields];
                          updatedFields.splice(i, 1);
                          setFields(updatedFields);
                        }}
                      >
                        <IconMinus />
                      </button>
                    </div>
                  ) : (
                    e.type
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </foreignObject>
      <circle
        id="TOP"
        cx={props.x + props.width / 2}
        cy={props.y}
        r={5}
        onClick={(e) => {
          setNode(Node.TOP);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.TOP,
              x: props.x + props.width / 2,
              y: props.y,
            },
          ]);
        }}
        style={{ fill: node === Node.TOP ? "green" : "black" }}
      />
      <circle
        id="LEFT"
        cx={props.x}
        cy={props.y + height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.LEFT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.LEFT,
              x: props.x,
              y: props.y + height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.LEFT ? "green" : "black" }}
      />
      <circle
        id="RIGHT"
        cx={props.x + props.width}
        cy={props.y + height / 2}
        r={5}
        onClick={(e) => {
          setNode(Node.RIGHT);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.RIGHT,
              x: props.x + props.width,
              y: props.y + height / 2,
            },
          ]);
        }}
        style={{ fill: node === Node.RIGHT ? "green" : "black" }}
      />
      <circle
        id="BOTTOM"
        cx={props.x + props.width / 2}
        cy={props.y + height}
        r={5}
        onClick={(e) => {
          setNode(Node.BOTTOM);
          props.setLinks([
            ...props.links,
            {
              rect: props.id,
              node: Node.BOTTOM,
              x: props.x + props.width / 2,
              y: props.y + height,
            },
          ]);
        }}
        style={{ fill: node === Node.BOTTOM ? "green" : "black" }}
      />
      <Modal
        title="Add new field"
        visible={visible}
        onOk={handleOk}
        afterClose={handleOk}
        onCancel={handleOk}
        centered
        closeOnEsc={true}
        okText="Add"
        cancelText="Cancel"
      >
        <Form labelPosition="left" labelAlign="right">
          <Row>
            <Col span={11}>
              <Form.Input field="name" label="Name" trigger="blur" />
            </Col>
            <Col span={2}></Col>
            <Col span={11}>
              <Form.Input field="default" label="Default" trigger="blur" />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Select
                field="type"
                label="Type"
                className="w-full"
                filter
                optionList={sqlDataTypes.map((value, index) => {
                  return {
                    label: value,
                    value: index,
                  };
                })}
              ></Form.Select>
              <div className="flex justify-around mt-2">
                <Checkbox value="A">Primary</Checkbox>
                <Checkbox value="B">Unique</Checkbox>
                <Checkbox value="C">Not null</Checkbox>
                <Checkbox value="D">Increment</Checkbox>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
      <Modal
        title={`Edit field ${
          editFieldVisible !== -1 ? fields[editFieldVisible].name : ""
        }`}
        visible={editFieldVisible !== -1}
        onOk={handleOkEdit}
        afterClose={handleOkEdit}
        onCancel={handleOkEdit}
        centered
        closeOnEsc={true}
        okText="Edit"
        cancelText="Cancel"
      >
        <Form labelPosition="left" labelAlign="right">
          <Row>
            <Col span={11}>
              <Form.Input field="name" label="Name" trigger="blur" />
            </Col>
            <Col span={2}></Col>
            <Col span={11}>
              <Form.Input field="default" label="Default" trigger="blur" />
            </Col>
          </Row>
          <Row>
            <Col span={24}>
              <Form.Select
                field="type"
                label="Type"
                className="w-full"
                optionList={sqlDataTypes.map((value, index) => {
                  return {
                    label: value,
                    value: index,
                  };
                })}
              ></Form.Select>
              <div className="flex justify-around mt-2">
                <Checkbox value="A">Primary</Checkbox>
                <Checkbox value="B">Unique</Checkbox>
                <Checkbox value="C">Not null</Checkbox>
                <Checkbox value="D">Increment</Checkbox>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </g>
  );
};

export default Rect;
