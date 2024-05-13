import { Collapse } from "@douyinfe/semi-ui";
import { useSelect, useTables } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import RelationshipInfo from "./RelationshipInfo";
import { ObjectType } from "../../../data/constants";

export default function RelationshipsTab() {
  const { relationships } = useTables();
  const { selectedElement, setSelectedElement } = useSelect();

  return (
    <>
      <SearchBar />
      <Collapse
        activeKey={
          selectedElement.open &&
          selectedElement.element === ObjectType.RELATIONSHIP
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
            element: ObjectType.RELATIONSHIP,
          }))
        }
        accordion
      >
        {relationships.length <= 0 ? (
          <Empty
            title="No relationships"
            text="Drag to connect fields and form relationships!"
          />
        ) : (
          relationships.map((r) => <RelationshipInfo key={r.id} data={r} />)
        )}
      </Collapse>
    </>
  );
}
