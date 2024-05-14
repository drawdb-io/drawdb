import { Collapse, Row, Col, Button } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";
import { useSelect, useTables } from "../../../hooks";
import { ObjectType } from "../../../data/constants";
import SearchBar from "./SearchBar";
import Empty from "../Empty";
import TableInfo from "./TableInfo";

export default function TablesTab() {
  const { tables, addTable } = useTables();
  const { selectedElement, setSelectedElement } = useSelect();

  return (
    <>
      <Row gutter={6}>
        <Col span={16}>
          <SearchBar tables={tables} />
        </Col>
        <Col span={8}>
          <Button icon={<IconPlus />} block onClick={() => addTable()}>
            Add table
          </Button>
        </Col>
      </Row>
      {tables.length === 0 ? (
        <Empty title="No tables" text="Start building your diagram!" />
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
