import { Collapse, Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useBaseTables, useLayout } from "../../../hooks";
import { useTranslation } from "react-i18next";
import Empty from "../Empty";
import BaseTableDetails from "./BaseTableDetails";

export default function BaseTablesTab() {
  const { baseTables, addBaseTable } = useBaseTables();
  const { layout } = useLayout();
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex gap-2">
        <div>
          <Button
            block
            icon={<IconPlus />}
            onClick={() => addBaseTable()}
            disabled={layout.readOnly}
          >
            {t("add_base_table")}
          </Button>
        </div>
      </div>
      {baseTables.length <= 0 ? (
        <Empty title={t("no_base_tables")} text={t("no_base_tables_text")} />
      ) : (
        <Collapse accordion>
          {baseTables.map((bt) => (
            <Collapse.Panel
              key={`base_table_${bt.id}`}
              id={`scroll_base_table_${bt.id}`}
              header={
                <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                  {bt.name}
                </div>
              }
              itemKey={bt.id}
            >
              <BaseTableDetails data={bt} />
            </Collapse.Panel>
          ))}
        </Collapse>
      )}
    </div>
  );
}

