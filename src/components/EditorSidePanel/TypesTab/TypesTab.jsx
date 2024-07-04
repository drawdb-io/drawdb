import { Collapse, Button, Popover } from "@douyinfe/semi-ui";
import { IconPlus, IconInfoCircle } from "@douyinfe/semi-icons";
import { useSelect, useDiagram, useTypes } from "../../../hooks";
import { DB, ObjectType } from "../../../data/constants";
import Searchbar from "./SearchBar";
import Empty from "../Empty";
import TypeInfo from "./TypeInfo";
import { useTranslation } from "react-i18next";

export default function TypesTab() {
  const { types, addType } = useTypes();
  const { selectedElement, setSelectedElement } = useSelect();
  const { database } = useDiagram();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-2">
        <Searchbar />
        <div>
          <Button icon={<IconPlus />} block onClick={() => addType()}>
            {t("add_type")}
          </Button>
        </div>
        {database === DB.GENERIC && (
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
        )}
      </div>
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
