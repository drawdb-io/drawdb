import { Collapse, Row, Col, Button, Popover } from "@douyinfe/semi-ui";
import { IconPlus, IconInfoCircle } from "@douyinfe/semi-icons";
import { useSelect, useTypes } from "../../../hooks";
import { ObjectType } from "../../../data/constants";
import Searchbar from "./SearchBar";
import Empty from "../Empty";
import TypeInfo from "./TypeInfo";
import { useTranslation } from "react-i18next";

export default function TypesTab() {
  const { types, addType } = useTypes();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  return (
    <>
      <Row gutter={6}>
        <Col span={13}>
          <Searchbar />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addType(true)}>
            {t("add_type")}
          </Button>
        </Col>
        <Col span={3}>
          <Popover
            content={
              <div className="w-[240px] text-sm space-y-2 popover-theme">
                {t("types_info")
                  .split("\n")
                  .map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
              </div>
            }
            showArrow
            position="rightTop"
          >
            <Button theme="borderless" icon={<IconInfoCircle />} />
          </Popover>
        </Col>
      </Row>
      {types.length <= 0 ? (
        <Empty title={t("no_types")} text={t("no_types_text")} />
      ) : (
        <Collapse
          activeKey={
            selectedElement.open && selectedElement.element === ObjectType.TYPE
              ? `${selectedElement.id}`
              : ""
          }
          keepDOM
          lazyRender
          onChange={(id) =>
            setSelectedElement((prev) => ({
              ...prev,
              open: true,
              id: parseInt(id),
              element: ObjectType.TYPE,
            }))
          }
          accordion
        >
          {types.map((t, i) => (
            <TypeInfo data={t} key={i} index={i} />
          ))}
        </Collapse>
      )}
    </>
  );
}
