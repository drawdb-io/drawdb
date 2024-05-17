import { Collapse, Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useSelect, useTables } from "../../../hooks";
import { ObjectType } from "../../../data/constants";
import SearchBar from "./SearchBar";
import Empty from "../Empty";
import TableInfo from "./TableInfo";
import { useTranslation } from "react-i18next";

export default function TablesTab() {
  const { tables, addTable } = useTables();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-2">
        <SearchBar tables={tables} />
        <div>
          <Button icon={<IconPlus />} block onClick={() => addTable()}>
            {t("add_table")}
          </Button>
        </div>
      </div>
      {tables.length === 0 ? (
        <Empty title={t("no_tables")} text={t("no_tables_text")} />
      ) : (
        <Collapse
          activeKey={
            selectedElement.open && selectedElement.element === ObjectType.TABLE
              ? `${selectedElement.id}`
              : ""
          }
          keepDOM
          lazyRender
          onChange={(k) =>
            setSelectedElement((prev) => ({
              ...prev,
              open: true,
              id: parseInt(k),
              element: ObjectType.TABLE,
            }))
          }
          accordion
        >
          {tables.map((t) => (
            <div id={`scroll_table_${t.id}`} key={t.id}>
              <Collapse.Panel
                header={
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {t.name}
                  </div>
                }
                itemKey={`${t.id}`}
              >
                <TableInfo data={t} />
              </Collapse.Panel>
            </div>
          ))}
        </Collapse>
      )}
    </>
  );
}
