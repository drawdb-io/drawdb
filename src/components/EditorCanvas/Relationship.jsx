import { useRef } from "react";
import { Cardinality, ObjectType, Tab } from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import { CrowOM, CrowOO, CrowZM, IDEFZM, DefaultNotation, sub01 } from "./RelationshipFormat";


export default function Relationship({ data }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();
  const pathRef = useRef();
  const type = settings.notation === 'default' ? 0 : 10;
  const relationshipType=(0,0);

  let direction = 1;
  let cardinalityStart = "1";
  let cardinalityEnd = "1";
  let cardinalityvar;

  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.ZERO_TO_MANY):
    case Cardinality.ZERO_TO_MANY:
      if (settings.notation === 'default') {
        cardinalityStart = "n";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,*)";
        cardinalityEnd = "(1,1)";
        cardinalityvar="1";
      }
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      if (settings.notation === 'default') {
        cardinalityStart = "1";
        cardinalityEnd = "n";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,*)";
        cardinalityvar="2";
      }
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      if (settings.notation === 'default') {
        cardinalityStart = "1";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,1)";
        cardinalityvar="3";
      }
      break;
    default:
      break;
  }

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;

  const cardinalityOffset = 28;


  if (pathRef.current) {
    const pathLength = settings.notation === 'default' ?
      pathRef.current.getTotalLength() - cardinalityOffset:
      pathRef.current.getTotalLength();

    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;

    const point2 = pathRef.current.getPointAtLength(
      pathLength,
    );
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;
  }

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.RELATIONSHIPS,
        element: ObjectType.RELATIONSHIP,
        id: data.id,
        open: true,
      }));
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        .scrollIntoView({ behavior: "smooth" });
    }
  };

  if ((settings.notation === 'crows_foot' || settings.notation === 'idef1x') && cardinalityEndX < cardinalityStartX){
    direction = -1;
  }

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        <path
          ref={pathRef}
          d={calcPath(
            {
              ...data,
              startTable: {
                x: tables[data.startTableId].x,
                y: tables[data.startTableId].y,
              },
              endTable: {
                x: tables[data.endTableId].x,
                y: tables[data.endTableId].y,
              },
            },
            settings.tableWidth,
          )}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeDasharray={relationshipType}
          strokeWidth={2}
          cursor="pointer"
        />

        {CrowOM(pathRef.current,settings.notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd)}
        {CrowOO(pathRef.current,settings.notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd)}
        {CrowZM(pathRef.current,settings.notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd)}
        {DefaultNotation(pathRef.current,settings.notation, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  cardinalityStart, cardinalityEnd)}
        {IDEFZM(pathRef.current,settings.notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd)}
        {sub01(pathRef.current,settings.notation, cardinalityvar, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY,  direction, cardinalityStart, cardinalityEnd)}
      </g>

      <SideSheet
        title={t("edit")}
        size="small"
        visible={
          selectedElement.element === ObjectType.RELATIONSHIP &&
          selectedElement.id === data.id &&
          selectedElement.open &&
          !layout.sidebar
        }
        onCancel={() => {
          setSelectedElement((prev) => ({
            ...prev,
            open: false,
          }));
        }}
        style={{ paddingBottom: "16px" }}
      >
        <div className="sidesheet-theme">
          <RelationshipInfo data={data} />
        </div>
      </SideSheet>
    </>
  );
}
