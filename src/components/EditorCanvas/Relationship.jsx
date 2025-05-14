import { useRef } from "react";
import {
  Cardinality,
  darkBgTheme,
  ObjectType,
  Tab,
} from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import { CrowOM, CrowOO, CrowZM, IDEFZM, DefaultNotation } from "./RelationshipFormat";


const labelFontSize = 16;

export default function Relationship({ data }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const theme = localStorage.getItem("theme");

  const pathRef = useRef();
  const labelRef = useRef();
  const type = settings.notation === 'default' ? 0 : 10;
  const relationshipType=(5,type);

  let direction = 1;
  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  const formats = {
    notation: {
      default:  {
        one_to_one: DefaultNotation,
        one_to_many: DefaultNotation,
        many_to_one: DefaultNotation,
      },
      crows_foot: {
        one_to_one: CrowOO,
        one_to_many: CrowOM,
        many_to_one: CrowOM,
      },
      idef1x: {
        one_to_one: IDEFZM,
        one_to_many: IDEFZM,
        many_to_one: IDEFZM,
      },
    }
  }

  let format;
  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      if (settings.notation === 'default') {
        cardinalityStart = "n";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,*)";
        cardinalityEnd = "(1,1)";
      }
      format = formats.notation[settings.notation].many_to_one;
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      if (settings.notation === 'default') {
        cardinalityStart = "1";
        cardinalityEnd = "n";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,*)";
      }
      format = formats.notation[settings.notation].one_to_many;
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      if (settings.notation === 'default') {
        cardinalityStart = "1";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,1)";
      }
      format = formats.notation[settings.notation].one_to_one;
      break;
    default:
      format = formats.default.one_to_one;
      break;
  }

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;
  let labelX = 0;
  let labelY = 0;

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityOffset = 28;


  if (pathRef.current) {
    const pathLength = pathRef.current.getTotalLength() - cardinalityOffset;

    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    labelX = labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = labelPoint.y + (labelHeight ?? 0) / 2;

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
            // settings.tableWidth,
            tables[data.startTableId].width,
            tables[data.endTableId].width
          )}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeDasharray={relationshipType}
          strokeWidth={2}
          cursor="pointer"
        />
        {settings.showRelationshipLabels && (
          <>
            <rect
              x={labelX - 2}
              y={labelY - labelFontSize}
              fill={theme === "dark" ? darkBgTheme : "white"}
              width={labelWidth + 4}
              height={labelHeight}
            />
            <text
              x={labelX}
              y={labelY}
              fill={theme === "dark" ? "lightgrey" : "#333"}
              fontSize={labelFontSize}
              fontWeight={500}
              ref={labelRef}
              className="group-hover:fill-sky-700"
            >
              {data.name}
            </text>
          </>
        )}
        {format(pathRef.current, cardinalityEndX, cardinalityEndY, cardinalityStartX, cardinalityStartY, direction, cardinalityStart, cardinalityEnd)}
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
