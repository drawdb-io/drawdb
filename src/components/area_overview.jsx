import React, { useContext, useState } from "react";
import {
  Empty,
  Row,
  Col,
  AutoComplete,
  Button,
  Input,
  Popover,
  Toast,
} from "@douyinfe/semi-ui";
import {
  IllustrationNoContent,
  IllustrationNoContentDark,
} from "@douyinfe/semi-illustrations";
import {
  IconPlus,
  IconSearch,
  IconCheckboxTick,
  IconDeleteStroked,
} from "@douyinfe/semi-icons";
import { defaultTableTheme, tableThemes } from "../data/data";
import { AreaContext } from "../pages/editor";

export default function AreaOverview(props) {
  const { areas, setAreas, addArea, deleteArea } = useContext(AreaContext);

  const [value, setValue] = useState("");
  const [filteredResult, setFilteredResult] = useState(
    areas.map((t) => {
      return t.name;
    })
  );

  const handleStringSearch = (value) => {
    setFilteredResult(
      areas
        .map((t) => {
          return t.name;
        })
        .filter((i) => i.includes(value))
    );
  };

  const updateArea = (aid, updatedValues) => {
    setAreas((prev) =>
      prev.map((a, i) => {
        if (aid === i) {
          return {
            ...a,
            ...updatedValues,
          };
        }
        return a;
      })
    );
  };

  return (
    <div>
      <Row gutter={6}>
        <Col span={16}>
          <AutoComplete
            data={filteredResult}
            value={value}
            showClear
            prefix={<IconSearch />}
            placeholder="Search..."
            emptyContent={<div className="p-3">No areas found</div>}
            onSearch={(v) => handleStringSearch(v)}
            onChange={(v) => setValue(v)}
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
          <Button icon={<IconPlus />} block onClick={() => addArea()}>
            Add area
          </Button>
        </Col>
      </Row>
      {areas.length <= 0 ? (
        <div className="select-none">
          <Empty
            image={
              <IllustrationNoContent style={{ width: 160, height: 160 }} />
            }
            darkModeImage={
              <IllustrationNoContentDark style={{ width: 160, height: 160 }} />
            }
            title="No subject areas"
            description="Add subject areas to compartmentalize tables!"
          />
        </div>
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
                  onChange={(value, e) => updateArea(a.id, { name: value })}
                  field="name"
                />
              </Col>
              <Col span={3}>
                <Popover
                  content={
                    <div>
                      <div className="flex justify-between items-center p-2">
                        <div className="font-medium">Theme</div>
                        <Button
                          type="tertiary"
                          size="small"
                          onClick={() =>
                            updateArea(i, { color: defaultTableTheme })
                          }
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
                                onClick={() => updateArea(i, { color: c })}
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
                                onClick={() => updateArea(i, { color: c })}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    Toast.success(`Area deleted!`);
                    deleteArea(i, true);
                  }}
                ></Button>
              </Col>
            </Row>
          ))}
        </div>
      )}
    </div>
  );
}
