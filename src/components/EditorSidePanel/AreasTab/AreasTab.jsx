import { Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import Empty from "../Empty";
import { useAreas } from "../../../hooks";
import SearchBar from "./SearchBar";
import AreaInfo from "./AreaDetails";
import { useTranslation } from "react-i18next";

export default function AreasTab() {
  const { areas, addArea } = useAreas();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <SearchBar />
        <div>
          <Button icon={<IconPlus />} block onClick={() => addArea()}>
            {t("add_area")}
          </Button>
        </div>
      </div>
      {areas.length <= 0 ? (
        <Empty
          title={t("no_subject_areas")}
          text={t("no_subject_areas_text")}
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
