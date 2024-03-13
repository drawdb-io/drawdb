import { useContext, useState } from "react";
import {
  Checkbox,
  Input,
  TextArea,
  Row,
  Col,
  Dropdown,
  Button,
  Popover,
  Tag,
  List,
  RadioGroup,
  Radio,
} from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconMore,
  IconDeleteStroked,
  IconCaretdown,
} from "@douyinfe/semi-icons";
import { StateContext } from "../pages/Editor";
import { State } from "../data/data";
import useTasks from "../hooks/useTasks";

export default function Todo() {
  const Priority = {
    NONE: 0,
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  };
  const SortOrder = {
    ORIGINAL: "My order",
    PRIORITY: "Priority",
    COMPLETED: "Completed",
    ALPHABETICALLY: "Alphabetically",
  };
  const [activeTask, setActiveTask] = useState(-1);
  const [, setSortOrder] = useState(SortOrder.ORIGINAL);
  const { tasks, setTasks, updateTask } = useTasks();
  const { setState } = useContext(StateContext);

  const priorityLabel = (p) => {
    switch (p) {
      case Priority.NONE:
        return "None";
      case Priority.LOW:
        return "Low";
      case Priority.MEDIUM:
        return "Medium";
      case Priority.HIGH:
        return "High";
      default:
        return "";
    }
  };

  const priorityColor = (p) => {
    switch (p) {
      case Priority.NONE:
        return "blue";
      case Priority.LOW:
        return "green";
      case Priority.MEDIUM:
        return "yellow";
      case Priority.HIGH:
        return "red";
      default:
        return "";
    }
  };

  const sort = (s) => {
    setActiveTask(-1);
    switch (s) {
      case SortOrder.ORIGINAL:
        setTasks((prev) => prev.sort((a, b) => a.order - b.order));
        return;
      case SortOrder.PRIORITY:
        setTasks((prev) => prev.sort((a, b) => b.priority - a.priority));
        return;
      case SortOrder.COMPLETED:
        setTasks((prev) =>
          prev.sort((a, b) => {
            if (a.complete && !b.complete) {
              return 1;
            } else if (!a.complete && b.complete) {
              return -1;
            } else {
              return 0;
            }
          })
        );
        break;
      case SortOrder.ALPHABETICALLY:
        setTasks((prev) => prev.sort((a, b) => a.title.localeCompare(b.title)));
        break;
      default:
        break;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mx-5 mb-2 sidesheet-theme">
        <Dropdown
          render={
            <Dropdown.Menu>
              {Object.values(SortOrder).map((order) => (
                <Dropdown.Item
                  key={order}
                  onClick={() => {
                    setSortOrder(order);
                    sort(order);
                  }}
                >
                  {order}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          }
          trigger="click"
        >
          <Button
            style={{ marginRight: "10px" }}
            theme="borderless"
            type="tertiary"
          >
            Sort by <IconCaretdown />
          </Button>
        </Dropdown>
        <Button
          icon={<IconPlus />}
          block
          onClick={() => {
            setTasks((prev) => [
              {
                complete: false,
                details: "",
                title: "",
                priority: Priority.NONE,
                order: prev.length,
              },
              ...prev,
            ]);
          }}
        >
          Add task
        </Button>
      </div>
      {tasks.length > 0 ? (
        <List className="sidesheet-theme">
          {tasks.map((t, i) => (
            <List.Item
              key={i}
              style={{ paddingLeft: "18px", paddingRight: "18px" }}
              className="hover-1"
              onClick={() => setActiveTask(i)}
            >
              <div className="w-full">
                <Row gutter={6} align="middle" type="flex" className="mb-2">
                  <Col span={2}>
                    <Checkbox
                      checked={t.complete}
                      onChange={(e) => {
                        updateTask(i, { complete: e.target.checked });
                        setState(State.SAVING);
                      }}
                    ></Checkbox>
                  </Col>
                  <Col span={19}>
                    <Input
                      placeholder="Title"
                      onChange={(v) => updateTask(i, { title: v })}
                      value={t.title}
                      onBlur={() => setState(State.SAVING)}
                    ></Input>
                  </Col>
                  <Col span={3}>
                    <Popover
                      content={
                        <div className="p-2 popover-theme">
                          <div className="mb-2 font-semibold">
                            Set priority:
                          </div>
                          <RadioGroup
                            onChange={(e) => {
                              updateTask(i, { priority: e.target.value });
                              setState(State.SAVING);
                            }}
                            value={t.priority}
                            direction="vertical"
                          >
                            <Radio value={Priority.NONE}>
                              <Tag color={priorityColor(Priority.NONE)}>
                                {priorityLabel(Priority.NONE)}
                              </Tag>
                            </Radio>
                            <Radio value={Priority.LOW}>
                              <Tag color={priorityColor(Priority.LOW)}>
                                {priorityLabel(Priority.LOW)}
                              </Tag>
                            </Radio>
                            <Radio value={Priority.MEDIUM}>
                              <Tag color={priorityColor(Priority.MEDIUM)}>
                                {priorityLabel(Priority.MEDIUM)}
                              </Tag>
                            </Radio>
                            <Radio value={Priority.HIGH}>
                              <Tag color={priorityColor(Priority.HIGH)}>
                                {priorityLabel(Priority.HIGH)}
                              </Tag>
                            </Radio>
                          </RadioGroup>
                          <Button
                            icon={<IconDeleteStroked />}
                            type="danger"
                            block
                            style={{ marginTop: "12px" }}
                            onClick={() => {
                              setTasks((prev) =>
                                prev.filter((task, j) => i !== j)
                              );
                              setState(State.SAVING);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      }
                      trigger="click"
                      showArrow
                      className="w-[180px]"
                    >
                      <Button icon={<IconMore />} type="tertiary"></Button>
                    </Popover>
                  </Col>
                </Row>
                {activeTask === i && (
                  <Row className="mb-2">
                    <Col span={2}></Col>
                    <Col span={22}>
                      <TextArea
                        placeholder="Details"
                        onChange={(v) => updateTask(i, { details: v })}
                        value={t.details}
                        onBlur={() => setState(State.SAVING)}
                      ></TextArea>
                    </Col>
                  </Row>
                )}
                <Row>
                  <Col span={2}></Col>
                  <Col span={22}>
                    Priority:{" "}
                    <Tag color={priorityColor(t.priority)}>
                      {priorityLabel(t.priority)}
                    </Tag>
                  </Col>
                </Row>
              </div>
            </List.Item>
          ))}
        </List>
      ) : (
        <div className="m-5 sidesheet-theme">
          You have no tasks yet. Add your to-dos and keep track of your
          progress.
        </div>
      )}
    </>
  );
}
