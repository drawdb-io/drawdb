import { Collapse, Row, Col, Button, Popover } from "@douyinfe/semi-ui";
import { IconPlus, IconInfoCircle } from "@douyinfe/semi-icons";
import { useSelect, useTypes } from "../../../hooks";
import { ObjectType } from "../../../data/constants";
import Searchbar from "./SearchBar";
import Empty from "../Empty";
import TypeInfo from "./TypeInfo";
import {useTranslation} from "react-i18next";

export default function TypesTab() {
  const { t } = useTranslation();
  const { types, addType } = useTypes();
  const { selectedElement, setSelectedElement } = useSelect();

  return (
    <>
      <Row gutter={6}>
        <Col span={13}>
          <Searchbar />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addType(true)}>
            {t("Page.editor.SidePanel.Types.Add type")}
          </Button>
        </Col>
        <Col span={3}>
          <Popover
            content={
              <div className="w-[240px] text-sm space-y-2 popover-theme">
                <div dangerouslySetInnerHTML={{ __html: t('Page.editor.SidePanel.Types.tip.tip_1')}} />
                <div dangerouslySetInnerHTML={{ __html: t('Page.editor.SidePanel.Types.tip.tip_2')}} />
                <div dangerouslySetInnerHTML={{ __html: t('Page.editor.SidePanel.Types.tip.tip_3')}} />
                <div dangerouslySetInnerHTML={{ __html: t('Page.editor.SidePanel.Types.tip.tip_4')}} />
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
        <Empty title={t("Page.editor.SidePanel.Types.No types")} text={t("Page.editor.SidePanel.Types.Make your own custom data types")} />
      ) : (
        <Collapse
          activeKey={
            selectedElement.open && selectedElement.element === ObjectType.TYPE
              ? `${selectedElement.id}`
              : ""
          }
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
