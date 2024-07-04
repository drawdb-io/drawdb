import { Button, Collapse } from "@douyinfe/semi-ui";
import { useEnums } from "../../../hooks";
import { IconPlus } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import SearchBar from "./SearchBar";
import EnumDetails from "./EnumDetails";
import Empty from "../Empty";

export default function EnumsTab() {
  const { enums, addEnum } = useEnums();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <SearchBar />
        <div>
          <Button icon={<IconPlus />} block onClick={() => addEnum()}>
            {t("add_enum")}
          </Button>
        </div>
      </div>
      {enums.length <= 0 ? (
        <Empty title={t("no_enums")} text={t("no_enums_text")} />
      ) : (
        <Collapse accordion>
          {enums.map((e, i) => (
            <Collapse.Panel
              key={`enum_${i}`}
              id={`scroll_enum_${i}`}
              header={
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {e.name}
                </div>
              }
              itemKey={`${i}`}
            >
              <EnumDetails data={e} i={i} />
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
}
