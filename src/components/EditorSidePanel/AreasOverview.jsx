import { useState } from "react";
import {
  Row,
  Col,
  AutoComplete,
  Button,
  Input,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconSearch,
  IconCheckboxTick,
  IconDeleteStroked,
} from "@douyinfe/semi-icons";
import {
  defaultBlue,
  tableThemes,
  Action,
  ObjectType,
  State,
} from "../../data/constants";
import useUndoRedo from "../../hooks/useUndoRedo";
import useAreas from "../../hooks/useAreas";
import useSaveState from "../../hooks/useSaveState";
import Empty from "./Empty";

export default function AreasOverview() {
  const { setSaveState } = useSaveState();
  const { areas, addArea, deleteArea, updateArea } = useAreas();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const [editField, setEditField] = useState({});
  const [searchText, setSearchText] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    areas.map((t) => t.name)
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      areas.map((t) => t.name).filter((i) => i.includes(value))
    );
  };

  return (
    <div>
      <Row gutter={6}>
        <Col span={16}>
          <AutoComplete
            data={filteredResult}
            value={searchText}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            emptyContent={
              <div className="p-3 popover-theme">No areas found</div>
            }
            onSearch={(v) => handleStringSearch(v)}
            onChange={(v) => setSearchText(v)}
            onSelect={(v) => {
              const { id } = areas.find((t) => t.name === v);
              document
                .getElementById(`scroll_area_${id}`)
                .scrollIntoView({ behavior: "smooth" });
            }}
            className="w-full"
          />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={addArea}>
            Add area
          </Button>
        </Col>
      </Row>
      {areas.length <= 0 ? (
        <Empty
          title="No subject areas"
          text="Add subject areas to organize tables!"
        />
      ) : (
        <div className="p-2">
          {areas.map((a, i) => (
            <Row
              gutter={6}
              type="flex"
              justify="start"
              align="middle"
              key={i}
              id={`scroll_area_${a.id}`}
              className="my-3"
            >
              <Col span={18}>
                <Input
                  value={a.name}
                  placeholder="Name"
                  onChange={(value) => updateArea(a.id, { name: value })}
                  onFocus={(e) => setEditField({ name: e.target.value })}
                  onBlur={(e) => {
                    if (e.target.value === editField.name) return;
                    setUndoStack((prev) => [
                      ...prev,
                      {
                        action: Action.EDIT,
                        element: ObjectType.AREA,
                        aid: i,
                        undo: editField,
                        redo: { name: e.target.value },
                        message: `Edit area name to ${e.target.value}`,
                      },
                    ]);
                    setRedoStack([]);
                  }}
                />
              </Col>
              <Col span={3}>
                <Popover
                  content={
                    <div className="popover-theme">
                      <div className="flex justify-between items-center p-2">
                        <div className="font-medium">Theme</div>
                        <Button
                          type="tertiary"
                          size="small"
                          onClick={() => {
                            updateArea(i, { color: defaultBlue });
                            setSaveState(State.SAVING);
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                      <hr />
                      <div className="py-3">
                        <div>
                          {tableThemes
                            .slice(0, Math.ceil(tableThemes.length / 2))
                            .map((c) => (
                              <button
                                key={c}
                                style={{ backgroundColor: c }}
                                className="p-3 rounded-full mx-1"
                                onClick={() => {
                                  setUndoStack((prev) => [
                                    ...prev,
                                    {
                                      action: Action.EDIT,
                                      element: ObjectType.AREA,
                                      aid: i,
                                      undo: { color: a.color },
                                      redo: { color: c },
                                      message: `Edit area color to ${c}`,
                                    },
                                  ]);
                                  setRedoStack([]);
                                  updateArea(i, { color: c });
                                }}
                              >
                                {a.color === c ? (
                                  <IconCheckboxTick
                                    style={{ color: "white" }}
                                  />
                                ) : (
                                  <IconCheckboxTick style={{ color: c }} />
                                )}
                              </button>
                            ))}
                        </div>
                        <div className="mt-3">
                          {tableThemes
                            .slice(Math.ceil(tableThemes.length / 2))
                            .map((c) => (
                              <button
                                key={c}
                                style={{ backgroundColor: c }}
                                className="p-3 rounded-full mx-1"
                                onClick={() => {
                                  setUndoStack((prev) => [
                                    ...prev,
                                    {
                                      action: Action.EDIT,
                                      element: ObjectType.AREA,
                                      aid: i,
                                      undo: { color: a.color },
                                      redo: { color: c },
                                      message: `Edit area color to ${c}`,
                                    },
                                  ]);
                                  setRedoStack([]);
                                  updateArea(i, { color: c });
                                }}
                              >
                                <IconCheckboxTick
                                  style={{
                                    color: a.color === c ? "white" : c,
                                  }}
                                />
                              </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  }
                  trigger="click"
                  position="bottomLeft"
                  showArrow
                >
                  <div
                    className="h-[32px] w-[32px] rounded"
                    style={{ backgroundColor: a.color }}
                  />
                </Popover>
              </Col>
              <Col span={3}>
                <Button
                  icon={<IconDeleteStroked />}
                  type="danger"
                  onClick={() => {
                    Toast.success(`Area deleted!`);
                    deleteArea(i, true);
                  }}
                />
              </Col>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}
