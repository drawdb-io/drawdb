import { Collapse } from "@douyinfe/semi-ui";
import { useSelect, useTables } from "../../../hooks";
import Empty from "../Empty";
import SearchBar from "./SearchBar";
import RelationshipInfo from "./RelationshipInfo";
import { ObjectType } from "../../../data/constants";
import {useTranslation} from "react-i18next";

export default function RelationshipsTab() {
  const { t } = useTranslation();
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
            title={t("Page.editor.SidePanel.Relationships.No relationships")}
            text={t("Page.editor.SidePanel.Relationships.Drag to connect fields and form relationships")}
          />
        ) : (
          relationships.map((r) => <RelationshipInfo key={r.id} data={r} />)
        )}
      </Collapse>
    </>
  );
}
