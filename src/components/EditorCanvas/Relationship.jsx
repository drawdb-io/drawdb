import { useRef } from "react";
import {
  Cardinality,
  darkBgTheme,
  Notation,
  ObjectType,
  Tab,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
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

  // Helper function to sort fields (same logic as in Table.jsx)
  const getSortedFields = (fields) => {
    if (!fields) return [];
    return [...fields].sort((a, b) => {
      const aIsPK = a.primary;
      const bIsPK = b.primary;
      const aIsFK = a.foreignK === true;
      const bIsFK = b.foreignK === true;

      let groupA;
      if (aIsPK) groupA = 1;
      else if (!aIsFK) groupA = 2;
      else groupA = 3;

      let groupB;
      if (bIsPK) groupB = 1;
      else if (!bIsFK) groupB = 2;
      else groupB = 3;

      if (groupA !== groupB) return groupA - groupB;
      return 0;
    });
  };

  const startTable = tables[data.startTableId];
  const endTable = tables[data.endTableId];

  let startFieldYOffset = 0;
  let endFieldYOffset = 0;
  const effectiveColorStripHeight = settings.notation === Notation.DEFAULT ? tableColorStripHeight : 0;
  const totalHeaderHeightForFields = tableHeaderHeight + effectiveColorStripHeight;

  if (startTable && startTable.fields && data.startFieldId !== undefined) {
    const sortedStartFields = getSortedFields(startTable.fields);
    const startFieldIndex = sortedStartFields.findIndex(f => f.id === data.startFieldId);
    if (startFieldIndex !== -1) {
      startFieldYOffset = totalHeaderHeightForFields + (startFieldIndex * tableFieldHeight) + (tableFieldHeight / 2);
    } else {
      // Fallback if field not found, point to middle of table header or top
      startFieldYOffset = tableHeaderHeight / 2;
    }
  }

  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const sortedEndFields = getSortedFields(endTable.fields);
    const endFieldIndex = sortedEndFields.findIndex(f => f.id === data.endFieldId);
    if (endFieldIndex !== -1) {
      endFieldYOffset = totalHeaderHeightForFields + (endFieldIndex * tableFieldHeight) + (tableFieldHeight / 2);
    } else {
      // Fallback, similar to startFieldYOffset
      endFieldYOffset = tableHeaderHeight / 2;
    }
  }

  // This part for strokeDasharray remains the same
  let determinedRelationshipType = null;
  if (endTable && endTable.fields && data.endFieldId !== undefined) {
    const foreignKeyField = endTable.fields.find(field => field.id === data.endFieldId);
    if (foreignKeyField) {
      if (foreignKeyField.primary === true) {
        determinedRelationshipType = "0";
      } else {
        determinedRelationshipType = "5.5"; // Assuming "5.5" is a valid dasharray string like "5,5"
      }
    }
  }
  const relationshipType = determinedRelationshipType !== null ? determinedRelationshipType : (data.lineType || "0");

  let direction = 1;
  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  const formats = {
    notation: {
      default:  {
        one_to_one: DefaultNotation,
        one_to_many: DefaultNotation,
        zero_to_many: DefaultNotation,
      },
      crows_foot: {
        one_to_one: CrowOO,
        one_to_many: CrowOM,
        zero_to_many: CrowZM,
      },
      idef1x: {
        one_to_one: IDEFZM,
        one_to_many: IDEFZM,
        zero_to_many: IDEFZM,
      },
    }
  }

  const effectiveNotationKey =
    settings.notation &&
    Object.prototype.hasOwnProperty.call(
      formats.notation,
      settings.notation,
    )
      ? settings.notation
      : Notation.DEFAULT;

    const currentNotation = formats.notation[effectiveNotationKey];

  let format;
  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      if (effectiveNotationKey === Notation.DEFAULT) {
        cardinalityStart = "1";
        cardinalityEnd = "n";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,*)";
      }
      format = currentNotation.one_to_many;
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      if (effectiveNotationKey === Notation.DEFAULT) {
        cardinalityStart = "1";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,1)";
      }
      format = currentNotation.one_to_one;
      break;
    case t(Cardinality.ZERO_TO_MANY):
    case Cardinality.ZERO_TO_MANY:
      if (effectiveNotationKey === Notation.DEFAULT) {
        cardinalityStart = "0";
        cardinalityEnd = "n";
      } else {
        cardinalityStart = "(0,1)";
        cardinalityEnd = "(0,*)";
      }
      format = currentNotation.zero_to_many;
      break;
    default:
      if (effectiveNotationKey === Notation.DEFAULT) {
        cardinalityStart = "1";
        cardinalityEnd = "1";
      } else {
        cardinalityStart = "(1,1)";
        cardinalityEnd = "(1,1)";
      }
      format = currentNotation.one_to_one;
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

  if ((settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X) && cardinalityEndX < cardinalityStartX){
    direction = -1;
  }

  const pathData = {
    ...data,
    startTable: {
      x: startTable ? startTable.x : 0,
      y: startTable ? startTable.y + startFieldYOffset : 0,
    },
    endTable: {
      x: endTable ? endTable.x : 0,
      y: endTable ? endTable.y + endFieldYOffset : 0,
    },
  };

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        {/* Invisible path for larger hit area */}
        <path
          d={calcPath(
            pathData,
            settings.tableWidth,
          )}
          stroke="transparent"
          fill="none"
          strokeWidth={15}
          strokeDasharray={"0"}
          cursor="pointer"
        />
        {/* Visible path */}
        <path
          ref={pathRef}
          d={calcPath(
            pathData,
            settings.tableWidth,
          )}
          stroke="gray"
          className="group-hover:stroke-sky-700"
          fill="none"
          strokeDasharray={relationshipType}
          strokeWidth={2}
        />
        {settings.showCardinality && (
          <>
            {format(
              pathRef,
              cardinalityEndX,
              cardinalityEndY,
              cardinalityStartX,
              cardinalityStartY,
              direction,
              cardinalityStart,
              cardinalityEnd,
            )}
          </>
        )}
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
