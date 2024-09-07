import { Collapse } from "@douyinfe/semi-ui";
import { useSelect, useDiagram } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import RelationshipInfo from "./RelationshipInfo";
import { ObjectType } from "../../../data/constants";
import { useTranslation } from "react-i18next";

export default function RelationshipsTab() {
  const { relationships } = useDiagram();
  const { selectedElement, setSelectedElement } = useSelect();
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
          {relationships.map((r) => (
            <div id={`scroll_ref_${r.id}`} key={"relationship_" + r.id}>
              <Collapse.Panel
                header={
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap">
                    {r.name}
                  </div>
                }
                itemKey={`${r.id}`}
              >
                <RelationshipInfo data={r} />
              </Collapse.Panel>
            </div>
          ))}
        </Collapse>
      )}
    </>
  );
}
