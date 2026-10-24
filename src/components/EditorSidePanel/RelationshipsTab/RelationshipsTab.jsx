import { memo } from "react";
import { Collapse } from "@douyinfe/semi-ui";
import { useSelect, useDiagram, useSaveState, useLayout } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import RelationshipInfo from "./RelationshipInfo";
import { ObjectType, State } from "../../../data/constants";
import { useTranslation } from "react-i18next";
import { SortableList } from "../../SortableList/SortableList";
import { DragHandle } from "../../SortableList/DragHandle";

export default function RelationshipsTab() {
  const { relationships, setRelationships } = useDiagram();
  const { selectedElement, setSelectedElement } = useSelect();
  const { setSaveState } = useSaveState();
  const { t } = useTranslation();

  return (
    <>
      <SearchBar />
      {relationships.length <= 0 ? (
        <Empty
          title={t("no_relationships")}
          text={t("no_relationships_text")}
        />
      ) : (
        <Collapse
          activeKey={
            selectedElement.open &&
            selectedElement.element === ObjectType.RELATIONSHIP
              ? `${selectedElement.id}`
              : ""
          }
          keepDOM={false}
          lazyRender
          onChange={(k) => {
            setSelectedElement((prev) => ({
              ...prev,
              open: true,
              id: k[0],
              element: ObjectType.RELATIONSHIP,
            }));
          }}
          accordion
        >
          <SortableList
            keyPrefix="relationships-tab"
            items={relationships}
            onChange={(newRelationships) => setRelationships(newRelationships)}
            afterChange={() => setSaveState(State.SAVING)}
            renderItem={renderRelationshipListItem}
          />
        </Collapse>
      )}
    </>
  );
}

const renderRelationshipListItem = (relationship) => (
  <RelationshipListItem relationship={relationship} />
);

const RelationshipListItem = memo(function RelationshipListItem({
  relationship,
}) {
  const { layout } = useLayout();

  return (
    <div id={`scroll_ref_${relationship.id}`}>
      <Collapse.Panel
        className="relative"
        header={
          <div className="w-full flex items-center gap-2">
            <DragHandle readOnly={layout.readOnly} id={relationship.id} />
            <div className="overflow-hidden text-ellipsis whitespace-nowrap">
              {relationship.name}
            </div>
          </div>
        }
        itemKey={`${relationship.id}`}
      >
        <RelationshipInfo data={relationship} />
      </Collapse.Panel>
    </div>
  );
});
