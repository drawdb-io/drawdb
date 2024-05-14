import { Row, Col, Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import Empty from "../Empty";
import { useAreas } from "../../../hooks";
import SearchBar from "./SearchBar";
import AreaInfo from "./AreaDetails";
import {useTranslation} from "react-i18next";

export default function AreasTab() {
  const { t } = useTranslation();
  const { areas, addArea } = useAreas();

  return (
    <div>
      <Row gutter={6}>
        <Col span={16}>
          <SearchBar />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={addArea}>
            {t("Page.editor.SidePanel.Subject Areas.Add area")}
          </Button>
        </Col>
      </Row>
      {areas.length <= 0 ? (
        <Empty
          title={t("Page.editor.SidePanel.Subject Areas.No subject areas")}
          text={t("Page.editor.SidePanel.Subject Areas.Add subject areas to organize tables")}
        />
      ) : (
        <div className="p-2">
          {areas.map((a, i) => (
            <AreaInfo data={a} key={"area_" + i} i={i} />
          ))}
        </div>
      )}
    </div>
  );
}
