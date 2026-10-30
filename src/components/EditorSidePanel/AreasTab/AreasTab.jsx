import { Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import Empty from "../Empty";
import { useAreas, useLayout, useSaveState } from "../../../hooks";
import { State } from "../../../data/constants";
import { SortableList } from "../../SortableList/SortableList";
import SearchBar from "./SearchBar";
import AreaInfo from "./AreaDetails";
import { useTranslation } from "react-i18next";

export default function AreasTab() {
  const { areas, addArea, setAreas } = useAreas();
  const { layout } = useLayout();
  const { setSaveState } = useSaveState();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <SearchBar />
        <div>
          <Button
            icon={<IconPlus />}
            block
            onClick={() => addArea()}
            disabled={layout.readOnly}
          >
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
          <SortableList
            keyPrefix="areas-tab"
            items={areas}
            onChange={(newAreas) => setAreas(newAreas)}
            afterChange={() => setSaveState(State.SAVING)}
            renderItem={renderAreaListItem}
          />
        </div>
      )}
    </div>
  );
}

const renderAreaListItem = (area) => <AreaInfo data={area} />;
