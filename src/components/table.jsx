import { React, useState } from "react";
import { sqlDataTypes } from "../data/data";
import {
  IconEdit,
  IconDelete,
  IconPlus,
  IconMinus,
} from "@douyinfe/semi-icons";
import {
  Modal,
  Form,
  Checkbox,
  Row,
  Col,
  Popover,
  Tag,
  Popconfirm,
  Toast,
} from "@douyinfe/semi-ui";

export default function Table(props) {
  const [isHovered, setIsHovered] = useState(false);
  const [hoveredField, setHoveredField] = useState(-1);
  // const [name, setName] = useState(props.tableData.name);
  const [visible, setVisible] = useState(false);
  const [editFieldVisible, setEditFieldVisible] = useState(-1);

  const [field, setField] = useState({
    name: "",
    type: "",
    default: "",
    primary: false,
    unique: false,
    notNull: false,
    increment: false,
    comment: "",
  });

  const handleEditField = () => {
    props.setTables((prev) => {
      const updatedTables = [...prev];
      updatedTables[props.id].fields[editFieldVisible] = { ...field };
      return updatedTables;
    });

    setField({
      name: "",
      type: "",
      default: "",
      primary: false,
      unique: false,
      notNull: false,
      increment: false,
      comment: "",
    });
    setEditFieldVisible(-1);
  };

  const handleAddField = () => {
    props.setTables((prev) => {
      const updatedTables = [...prev];
      updatedTables[props.id].fields = [
        ...updatedTables[props.id].fields,
        { ...field },
      ];
      return updatedTables;
    });
    setField({
      name: "",
      type: "",
      default: "",
      primary: false,
      unique: false,
      notNull: false,
      increment: false,
      comment: "",
    });
    setVisible(false);
  };

  const height = props.tableData.fields.length * 36 + 40 + 4 + 36;

  const onCheck = (checkedValues) => {
    setField({
      ...field,
      [checkedValues.target.value]: checkedValues.target.checked,
    });
  };

  return (
    <g>
      <foreignObject
        key={props.id}
        x={props.tableData.x}
        y={props.tableData.y}
        width={220}
        height={height}
        style={{ cursor: "move" }}
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
            isHovered ? "border-sky-500" : "border-gray-500"
          } bg-gray-200 select-none rounded-md`}
        >
          <div
            // style={{ backgroundColor: props.tableData.color }}
            className="p-3 bg-gray-300 font-bold text-slate-800 h-[40px] rounded-t-md flex justify-between items-center"
          >
            <div className="p-1">
              {props.tableData.name}
            </div>
            {isHovered && (
              <div className="flex justify-end items-center">
                <button className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80">
                  <IconEdit />
                </button>
                <button
                  className="btn bg-green-600 text-white text-xs py-1 px-2 me-2 opacity-80"
                  onClick={(e) => setVisible(true)}
                >
                  <IconPlus />
                </button>
                <Popconfirm
                  title="Are you sure you want to delete this table?"
                  content="This modification will be irreversible."
                  cancelText="Cancel"
                  okText="Delete"
                  onConfirm={() => {
                    Toast.success(`Table deleted!`);
                    console.log("table.jsx ", props.id);
                  }}
                  onCancel={() => {}}
                >
                  <button className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80">
                    <IconDelete />
                  </button>
                </Popconfirm>
              </div>
            )}
          </div>
          {props.tableData.fields.map((e, i) => {
            return (
              <Popover
                key={i}
                content={
                  <div>
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
                  </div>
                }
                position="right"
                showArrow
              >
                <div
                  className={`${
                    i === props.tableData.fields.length - 1
                      ? ""
                      : "border-b-2 border-gray-400"
                  } h-[36px] p-2 flex justify-between`}
                  onMouseEnter={() => {
                    setHoveredField(i);
                    props.setOnRect({
                      tableId: props.id,
                      field: i,
                    });
                  }}
                  onMouseLeave={() => {
                    setHoveredField(-1);
                  }}
                >
                  <div
                    className={`${hoveredField === i ? "text-slate-600" : ""}`}
                  >
                    <button
                      className={`w-[10px] h-[10px] bg-green-600 rounded-full me-2`}
                      onMouseDown={(ev) => {
                        props.handleGripField(i);
                        props.setLine((prev) => ({
                          ...prev,
                          startFieldId: i,
                          startTableId: props.id,
                          startX: props.tableData.x + 15,
                          startY: props.tableData.y + i * 36 + 40 + 19,
                          endX: props.tableData.x + 15,
                          endY: props.tableData.y + i * 36 + 40 + 19,
                        }));
                      }}
                    ></button>
                    {e.name}
                  </div>
                  <div className="text-slate-600">
                    {hoveredField === i ? (
                      <div>
                        <button
                          className="btn bg-sky-800 text-white text-xs py-1 px-2 me-2 opacity-80"
                          onClick={(ev) => {
                            setEditFieldVisible(i);
                            setField({ ...e });
                          }}
                        >
                          <IconEdit />
                        </button>
                        <button
                          className="btn bg-red-800 text-white text-xs py-1 px-2 opacity-80"
                          onClick={(ev) => {
                            props.setTables((prev) => {
                              const updatedTables = [...prev];
                              const updatedFields = [
                                ...updatedTables[props.id].fields,
                              ];
                              updatedFields.splice(i, 1);
                              updatedTables[props.id].fields = [
                                ...updatedFields,
                              ];
                              return updatedTables;
                            });
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
              </Popover>
            );
          })}
          <div className="h-[36px] p-2">
            {props.tableData.comment === ""
              ? "No comment"
              : props.tableData.comment}
          </div>
        </div>
      </foreignObject>

      <Modal
        title="Add new field"
        visible={visible}
        onOk={handleAddField}
        onCancel={() => setVisible(false)}
        centered
        closeOnEsc={true}
        okText="Add"
        cancelText="Cancel"
      >
        <Form
          labelPosition="left"
          labelAlign="right"
          onValueChange={(v) => setField({ ...field, ...v })}
        >
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
                    value: value,
                  };
                })}
              ></Form.Select>
              <Form.Input field="comment" label="Comment" className="w-full" />
              <div className="flex justify-around mt-2">
                <Checkbox
                  value="primary"
                  onChange={() =>
                    setField({ ...field, primary: !field.primary })
                  }
                >
                  Primary
                </Checkbox>
                <Checkbox
                  value="unique"
                  onChange={() => setField({ ...field, unique: !field.unique })}
                >
                  Unique
                </Checkbox>
                <Checkbox
                  value="not null"
                  onChange={() =>
                    setField({ ...field, notNull: !field.notNull })
                  }
                >
                  Not null
                </Checkbox>
                <Checkbox
                  value="increment"
                  onChange={() =>
                    setField({ ...field, increment: !field.increment })
                  }
                >
                  Increment
                </Checkbox>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
      <Modal
        title={`Edit field ${
          editFieldVisible !== -1
            ? props.tableData.fields[editFieldVisible].name
            : ""
        }`}
        visible={editFieldVisible !== -1}
        onOk={handleEditField}
        onCancel={() => setEditFieldVisible(-1)}
        centered
        closeOnEsc={true}
        okText="Edit"
        cancelText="Cancel"
      >
        <Form
          labelPosition="left"
          labelAlign="right"
          onValueChange={(v) => setField({ ...field, ...v })}
        >
          <Row>
            <Col span={11}>
              <Form.Input
                field="name"
                label="Name"
                trigger="blur"
                initValue={
                  editFieldVisible !== -1
                    ? props.tableData.fields[editFieldVisible].name
                    : ""
                }
              />
            </Col>
            <Col span={2}></Col>
            <Col span={11}>
              <Form.Input
                field="default"
                label="Default"
                trigger="blur"
                initValue={
                  editFieldVisible !== -1
                    ? props.tableData.fields[editFieldVisible].default
                    : ""
                }
              />
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
                    value: value,
                  };
                })}
                filter
                initValue={
                  editFieldVisible !== -1
                    ? props.tableData.fields[editFieldVisible].type
                    : ""
                }
              ></Form.Select>
              <Form.Input
                field="comment"
                label="Comment"
                trigger="blur"
                initValue={
                  editFieldVisible !== -1
                    ? props.tableData.fields[editFieldVisible].comment
                    : ""
                }
              />
              <div className="flex justify-around mt-2">
                <Checkbox
                  value="primary"
                  onChange={onCheck}
                  defaultChecked={
                    editFieldVisible !== -1
                      ? props.tableData.fields[editFieldVisible].primary
                      : undefined
                  }
                >
                  Primary
                </Checkbox>
                <Checkbox
                  value="unique"
                  onChange={onCheck}
                  defaultChecked={
                    editFieldVisible !== -1
                      ? props.tableData.fields[editFieldVisible].unique
                      : undefined
                  }
                >
                  Unique
                </Checkbox>
                <Checkbox
                  value="notNull"
                  onChange={onCheck}
                  defaultChecked={
                    editFieldVisible !== -1
                      ? props.tableData.fields[editFieldVisible].notNull
                      : undefined
                  }
                >
                  Not null
                </Checkbox>
                <Checkbox
                  value="increment"
                  onChange={onCheck}
                  defaultChecked={
                    editFieldVisible !== -1
                      ? props.tableData.fields[editFieldVisible].increment
                      : undefined
                  }
                >
                  Increment
                </Checkbox>
              </div>
            </Col>
          </Row>
        </Form>
      </Modal>
    </g>
  );
}
 