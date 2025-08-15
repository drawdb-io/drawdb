import { useRef, useMemo } from "react";
import {
  RelationshipType,
  RelationshipCardinalities,
  ParentCardinality,
  darkBgTheme,
  Notation,
  ObjectType,
  Tab,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
  SubtypeRestriction,
} from "../../data/constants";
import { calcPath } from "../../utils/calcPath";
import { useDiagram, useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import {
  CrowParentLines,
  CrowParentDiamond,
  CrowsFootChild,
  IDEFZM,
  DefaultNotation,
  subDT,
  subDP,
  subOT,
  subOP
} from "./RelationshipFormat";

const labelFontSize = 16;

export default function Relationship({ data, onConnectSubtypePoint }) {
  const { settings } = useSettings();
  const { tables } = useDiagram();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const theme = localStorage.getItem("theme");

  const pathRef = useRef();
  const labelRef = useRef();

  // Define edit function early so it can be used in event handlers
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

  // Define table references early for use throughout the component
  const startTable = tables[data.startTableId];
  // Helper function to get the effective end table for both single and multi-child relationships
  const getEffectiveEndTable = () => {
    if (data.endTableId !== undefined) {
      return tables[data.endTableId];
    } else if (data.endTableIds && data.endTableIds.length > 0) {
      return tables[data.endTableIds[0]];
    }
    return null;
  };
  const endTable = getEffectiveEndTable();

  try {
  if (data.subtype && settings.notation === Notation.DEFAULT) {
    return null;
  }
  // Memoize expensive calculations for multi-child subtypes (must be outside conditional)
  const subtypeGeometry = useMemo(() => {
    // Only calculate if this is a multi-child subtype
    if (!data.subtype || !data.endTableIds || data.endTableIds.length <= 1) {
      return null;
    }
    const startTable = tables[data.startTableId];
    if (!startTable) {
      console.error("Start table not found for multi-child subtype", { startTableId: data.startTableId, availableTables: Object.keys(tables) });
      return null;
    }
    // Get all child tables
    const childTables = data.endTableIds.map(id => {
      const table = tables[id];
      if (!table) {
        console.warn("Child table not found", { childId: id, availableTables: Object.keys(tables) });
      }
      return table;
    }).filter(Boolean);
    if (childTables.length === 0) {
      console.error("No valid child tables found for multi-child subtype", {
        endTableIds: data.endTableIds,
        availableTables: Object.keys(tables)
      });
      return null;
    }
    // Validate table coordinates with default fallbacks
    const validateTable = (table, tableName) => {
      const x = typeof table.x === 'number' ? table.x : 0;
      const y = typeof table.y === 'number' ? table.y : 0;
      const width = typeof table.width === 'number' ? table.width : 200;
      const height = typeof table.height === 'number' ? table.height : 100;
      if (table.x === undefined || table.y === undefined) {
        console.warn(`${tableName} has undefined coordinates, using defaults`, table);
      }
      return { ...table, x, y, width, height };
    };
    const validStartTable = validateTable(startTable, 'Start table');
    const validChildTables = childTables.map((table, index) =>
      validateTable(table, `Child table ${index}`)
    );
    // Calculate center point for subtype notation
    const parentCenter = {
      x: validStartTable.x + validStartTable.width / 2,
      y: validStartTable.y + validStartTable.height / 2
    };
    const childrenCenter = {
      x: validChildTables.reduce((sum, table) => sum + table.x + table.width / 2, 0) / validChildTables.length,
      y: validChildTables.reduce((sum, table) => sum + table.y + table.height / 2, 0) / validChildTables.length
    };
    // Subtype notation point (midway between parent and children center)
    const subtypePoint = {
      x: (parentCenter.x + childrenCenter.x) / 2,
      y: (parentCenter.y + childrenCenter.y) / 2
    };
    // Final validation
    if (isNaN(subtypePoint.x) || isNaN(subtypePoint.y)) {
      console.error("Calculated subtype point is NaN", {
        parentCenter,
        childrenCenter,
        subtypePoint,
        validStartTable,
        validChildTables
      });
      return null;
    }

    // Determine relationship orientation
    const deltaX = Math.abs(childrenCenter.x - parentCenter.x);
    const deltaY = Math.abs(childrenCenter.y - parentCenter.y);
    const isHorizontal = deltaX > deltaY;
    return {
      startTable: validStartTable,
      childTables: validChildTables,
      parentCenter,
      childrenCenter,
      subtypePoint,
      isHorizontal
    };
  }, [data.startTableId, data.endTableIds, data.subtype, tables]); // Dependencies for memoization

  // For subtype relationships with multiple children, render centralized subtype
  if (data.subtype && data.endTableIds && data.endTableIds.length > 1) {
    if (!subtypeGeometry) {
      return null;
    }
    const { startTable, childTables, parentCenter, subtypePoint, isHorizontal } = subtypeGeometry;
    return (
      <g>
        {/* Single line from parent to subtype point */}
        <line
          x1={parentCenter.x}
          y1={parentCenter.y}
          x2={subtypePoint.x}
          y2={subtypePoint.y}
          stroke={theme === darkBgTheme ? "#e5e7eb" : "#374151"}
          strokeWidth="1.5"
          onDoubleClick={edit}
          cursor="pointer"
          className="hover:stroke-sky-700"
        />
        {/* Invisible line for larger hit area */}
        <line
          x1={parentCenter.x}
          y1={parentCenter.y}
          x2={subtypePoint.x}
          y2={subtypePoint.y}
          stroke="transparent"
          strokeWidth="10"
          onDoubleClick={edit}
          cursor="pointer"
        />
        {/* Subtype notation at the central point */}
        {data.subtype_restriction === SubtypeRestriction.DISJOINT_TOTAL && subDT(
          subtypePoint,
          0, // angle
          settings.notation,
          SubtypeRestriction.DISJOINT_TOTAL,
          1, // direction
          "", // cardinalityStart
          "", // cardinalityEnd
          onConnectSubtypePoint,
          data.id,
          startTable, // parentTable
          childTables[0], // Use first child table as reference for direction
          settings.tableWidth
        )}
        {data.subtype_restriction === SubtypeRestriction.DISJOINT_PARTIAL && subDP(
          subtypePoint,
          0,
          settings.notation,
          SubtypeRestriction.DISJOINT_PARTIAL,
          1,
          "",
          "",
          onConnectSubtypePoint,
          data.id,
          startTable,
          childTables[0],
          settings.tableWidth
        )}
        {data.subtype_restriction === SubtypeRestriction.OVERLAPPING_TOTAL && subOT(
          subtypePoint,
          0,
          settings.notation,
          SubtypeRestriction.OVERLAPPING_TOTAL,
          1,
          "",
          "",
          onConnectSubtypePoint,
          data.id,
          startTable,
          childTables[0],
          settings.tableWidth
        )}
        {data.subtype_restriction === SubtypeRestriction.OVERLAPPING_PARTIAL && subOP(
          subtypePoint,
          0,
          settings.notation,
          SubtypeRestriction.OVERLAPPING_PARTIAL,
          1,
          "",
          "",
          onConnectSubtypePoint,
          data.id,
          startTable,
          childTables[0],
          settings.tableWidth
        )}
        {/* Lines from subtype horizontal line to each child */}
        {childTables.map((childTable, index) => {
          const childCenter = {
            x: childTable.x + childTable.width / 2,
            y: childTable.y + childTable.height / 2
          };
          // Calculate the connection point based on relationship orientation
          let connectionPointX, connectionPointY;
          if (isHorizontal) {
            // For horizontal relationships: connect from the right side of the notation
            if (data.subtype_restriction === SubtypeRestriction.DISJOINT_TOTAL) {
              connectionPointX = subtypePoint.x + (index % 2 === 0 ? 20 : 25);
            } else {
              connectionPointX = subtypePoint.x + 20;
            }
            connectionPointY = subtypePoint.y;
          } else {
            // For vertical relationships: connect from the bottom of the notation
            connectionPointX = subtypePoint.x;
            connectionPointY = subtypePoint.y + 20;
          }
          return (
            <g key={`child-group-${data.id}-${index}`}>
              <line
                x1={connectionPointX}
                y1={connectionPointY}
                x2={childCenter.x}
                y2={childCenter.y}
                stroke={theme === darkBgTheme ? "#e5e7eb" : "#374151"}
                strokeWidth="1.5"
                onDoubleClick={edit}
                cursor="pointer"
                className="hover:stroke-sky-700"
              />
              {/* Invisible line for larger hit area */}
              <line
                x1={connectionPointX}
                y1={connectionPointY}
                x2={childCenter.x}
                y2={childCenter.y}
                stroke="transparent"
                strokeWidth="10"
                onDoubleClick={edit}
                cursor="pointer"
              />
            </g>
          );
        })}
      </g>
    );
  }

  // For regular subtype relationships (single child), add validation
  if (data.subtype) {
    // Validate that we have proper table references
    if (!startTable || !endTable) {
      console.warn("Missing table data for subtype relationship", {
        startTableId: data.startTableId,
        endTableId: data.endTableId,
        startTable: !!startTable,
        endTable: !!endTable
      });
      return null;
    }
  }

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
  // Helper function to get the effective end field ID
  const getEffectiveEndFieldId = () => {
    if (data.endFieldId !== undefined) {
      return data.endFieldId;
    } else if (data.endFieldIds && data.endFieldIds.length > 0) {
      return data.endFieldIds[0];
    }
    return undefined;
  };
  const effectiveEndFieldId = getEffectiveEndFieldId();

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

  if (endTable && endTable.fields && effectiveEndFieldId !== undefined) {
    const sortedEndFields = getSortedFields(endTable.fields);
    const endFieldIndex = sortedEndFields.findIndex(f => f.id === effectiveEndFieldId);
    if (endFieldIndex !== -1) {
      endFieldYOffset = totalHeaderHeightForFields + (endFieldIndex * tableFieldHeight) + (tableFieldHeight / 2);
    } else {
      // Fallback, similar to startFieldYOffset
      endFieldYOffset = tableHeaderHeight / 2;
    }
  }

  // This part for strokeDasharray remains the same
  let determinedRelationshipType = null;
  if (endTable && endTable.fields && effectiveEndFieldId !== undefined) {
    const foreignKeyField = endTable.fields.find(field => field.id === effectiveEndFieldId);
    if (foreignKeyField) {
      if (foreignKeyField.primary === true) {
        determinedRelationshipType = "0";
      } else {
        determinedRelationshipType = "5.5";
      }
    }
  }
  const relationshipType = determinedRelationshipType !== null ? determinedRelationshipType : (data.lineType || "0");

  const getForeignKeyFields = () => {
    if(!endTable || !endTable.fields) return [];

    // Handle both old format (single) and new format (array)
    if (data.endFieldIds && Array.isArray(data.endFieldIds)) {
      return endTable.fields.filter(f => data.endFieldIds.includes(f.id));
    } else if (data.endFieldId !== undefined) {
      return endTable.fields.filter(f => f.id === data.endFieldId);
    } else if (effectiveEndFieldId !== undefined) {
      return endTable.fields.filter(f => f.id === effectiveEndFieldId);
    }
    return [];
  };

  let direction = 1;
  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  const isCrowOrIDEF = settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X;
  const isDefault = settings.notation === Notation.DEFAULT;
  const fkFields = getForeignKeyFields();

  // Skip cardinality calculation for subtype relationships
  if (!data.subtype && data.relationshipType !== RelationshipType.SUBTYPE) {
    if (isCrowOrIDEF) {
      const allNullable = fkFields.length > 0 && fkFields.every(field => !field.notNull);
      cardinalityStart = allNullable
        ? ParentCardinality.NULLEABLE.label
        : ParentCardinality.DEFAULT.label;
      if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
        cardinalityEnd =
          data.cardinality ||
          RelationshipCardinalities[RelationshipType.ONE_TO_ONE][0].label;
      } else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
        cardinalityEnd =
          data.cardinality ||
          RelationshipCardinalities[RelationshipType.ONE_TO_MANY][0].label;
      }
    } else if (isDefault) {
      cardinalityStart = "1";
      cardinalityEnd = data.relationshipType === RelationshipType.ONE_TO_MANY ? "n" : "1";
    }
  }
  const formats = {
    notation: {
      default:  {
        one_to_one: DefaultNotation,
        one_to_many: DefaultNotation,
      },
      crows_foot: {
        child: CrowsFootChild,
        parent_lines: CrowParentLines,
        parent_diamond: CrowParentDiamond,
      },
      idef1x: {
        one_to_one: IDEFZM,
        one_to_many: IDEFZM,
        parent_diamond: CrowParentDiamond,
      },
    }
  }

  // For subtype relationships, force specific notation regardless of global setting
  const effectiveNotationKey = data.subtype ?
    'default' :
    (settings.notation &&
    Object.prototype.hasOwnProperty.call(
      formats.notation,
      settings.notation,
    )
      ? settings.notation
      : Notation.DEFAULT);

    const currentNotation = formats.notation[effectiveNotationKey];

  let parentFormat = null;
  // Skip parent/child notation logic for subtype relationships
  if (!data.subtype && data.relationshipType !== RelationshipType.SUBTYPE) {
    if (settings.notation === Notation.CROWS_FOOT) {
      if (cardinalityStart === "(1,1)") {
        parentFormat = currentNotation.parent_lines;
      } else if (cardinalityStart === "(0,1)") {
        parentFormat = currentNotation.parent_diamond;
      }
    } else if (settings.notation === Notation.IDEF1X) {
      if (cardinalityStart === "(0,1)") {
        parentFormat = currentNotation.parent_diamond;
      }
    }
  }

  let childFormat;
  // Skip child notation logic for subtype relationships
  if (!data.subtype && data.relationshipType !== RelationshipType.SUBTYPE) {
    if (settings.notation === Notation.CROWS_FOOT) {
      childFormat = currentNotation.child;
    } else if (settings.notation === Notation.IDEF1X) {
        if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
          childFormat = currentNotation.one_to_one;
        } else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
          childFormat = currentNotation.one_to_many;
        }
    } else {
      if (data.relationshipType === RelationshipType.ONE_TO_ONE) {
        childFormat = currentNotation.one_to_one;
      } else if (data.relationshipType === RelationshipType.ONE_TO_MANY) {
        childFormat = currentNotation.one_to_many;
      }
    }
  }

  let cardinalityStartX = 0;
  let cardinalityEndX = 0;
  let cardinalityStartY = 0;
  let cardinalityEndY = 0;
  let labelX = 0;
  let labelY = 0;

  // Vector information for proper notation orientation
  let vectorInfo = null;

  let labelWidth = labelRef.current?.getBBox().width ?? 0;
  let labelHeight = labelRef.current?.getBBox().height ?? 0;

  const cardinalityStartOffset = 30;
  const cardinalityEndOffset = 37;


  if (pathRef.current) {
    const totalPathLength = pathRef.current.getTotalLength();
    const effectivePathLength = totalPathLength - cardinalityStartOffset - cardinalityEndOffset;

    const labelPoint = pathRef.current.getPointAtLength(totalPathLength / 2);
    labelX = labelPoint.x - (labelWidth ?? 0) / 2;
    labelY = labelPoint.y + (labelHeight ?? 0) / 2;

    const point1 = pathRef.current.getPointAtLength(cardinalityStartOffset);
    cardinalityStartX = point1.x;
    cardinalityStartY = point1.y;

    const point2 = pathRef.current.getPointAtLength(
      totalPathLength - cardinalityEndOffset,
    );
    cardinalityEndX = point2.x;
    cardinalityEndY = point2.y;

    // Calculate vector direction at the end point for proper notation orientation
    const vectorSampleDistance = 20; // Distance to sample back from end point
    const endPointPosition = totalPathLength - cardinalityEndOffset;
    const vectorStartPoint = pathRef.current.getPointAtLength(
      Math.max(0, endPointPosition - vectorSampleDistance)
    );
    vectorInfo = {
      dx: cardinalityEndX - vectorStartPoint.x,
      dy: cardinalityEndY - vectorStartPoint.y,
      angle: Math.atan2(cardinalityEndY - vectorStartPoint.y, cardinalityEndX - vectorStartPoint.x) * 180 / Math.PI
    };
  }

  if ((settings.notation === Notation.CROWS_FOOT || settings.notation === Notation.IDEF1X) && cardinalityEndX < cardinalityStartX){
    direction = -1;
  }

  // Determine if relationship is vertical based on table positions
  // Use the actual table positions without field offsets for this calculation
  const isVertical = startTable && endTable ?
    Math.abs((startTable.x + settings.tableWidth/2) - (endTable.x + settings.tableWidth/2)) <
    Math.abs((startTable.y + 30) - (endTable.y + 30)) : false;

  const pathData = {
    ...data,
    startTable: {
      x: startTable ? startTable.x : 0,
      y: startTable ? startTable.y : 0, // Use basic table position - calcPath will handle connection points
    },
    endTable: {
      x: endTable ? endTable.x : 0,
      y: endTable ? endTable.y : 0, // Use basic table position - calcPath will handle connection points
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
        {/* Only show parent/child notations for non-subtype relationships */}
        {!data.subtype && parentFormat && parentFormat(
          cardinalityStartX,
          cardinalityStartY,
          direction,
          isVertical,
          vectorInfo, // Pass vector information
          cardinalityStart // Add cardinality text
        )}
        {!data.subtype && settings.notation === 'default' && settings.showCardinality && childFormat && childFormat(
          pathRef,
          cardinalityEndX,
          cardinalityEndY,
          cardinalityStartX,
          cardinalityStartY,
          direction,
          cardinalityStart,
          cardinalityEnd,
          settings.showCardinality,
          isVertical,
          vectorInfo, // Pass vector information
        )}
        {!data.subtype && settings.notation !== 'default' && childFormat && childFormat(
          pathRef,
          cardinalityEndX,
          cardinalityEndY,
          cardinalityStartX,
          cardinalityStartY,
          direction,
          cardinalityStart,
          cardinalityEnd,
          settings.showCardinality,
          isVertical,
          vectorInfo, // Pass vector information
        )}

        {/* Render subtype notations if this is a subtype relationship */}
        {data.subtype && (
          <>
            {data.subtype_restriction === SubtypeRestriction.DISJOINT_TOTAL && subDT(
              pathRef.current ? pathRef.current.getPointAtLength(pathRef.current.getTotalLength() / 2) : null,
              0, // angle
              settings.notation,
              SubtypeRestriction.DISJOINT_TOTAL,
              direction,
              cardinalityStart,
              cardinalityEnd,
              onConnectSubtypePoint,
              data.id,
              startTable, // parentTable
              endTable, // childTable
              settings.tableWidth // tableWidth
            )}
            {data.subtype_restriction === SubtypeRestriction.DISJOINT_PARTIAL && subDP(
              pathRef.current ? pathRef.current.getPointAtLength(pathRef.current.getTotalLength() / 2) : null,
              0, // angle
              settings.notation,
              SubtypeRestriction.DISJOINT_PARTIAL,
              direction,
              cardinalityStart,
              cardinalityEnd,
              onConnectSubtypePoint,
              data.id,
              startTable, // parentTable
              endTable, // childTable
              settings.tableWidth // tableWidth
            )}
            {data.subtype_restriction === SubtypeRestriction.OVERLAPPING_TOTAL && subOT(
              pathRef.current ? pathRef.current.getPointAtLength(pathRef.current.getTotalLength() / 2) : null,
              0, // angle
              settings.notation,
              SubtypeRestriction.OVERLAPPING_TOTAL,
              direction,
              cardinalityStart,
              cardinalityEnd,
              onConnectSubtypePoint,
              data.id,
              startTable, // parentTable
              endTable, // childTable
              settings.tableWidth // tableWidth
            )}
            {data.subtype_restriction === SubtypeRestriction.OVERLAPPING_PARTIAL && subOP(
              pathRef.current ? pathRef.current.getPointAtLength(pathRef.current.getTotalLength() / 2) : null,
              0, // angle
              settings.notation,
              SubtypeRestriction.OVERLAPPING_PARTIAL,
              direction,
              cardinalityStart,
              cardinalityEnd,
              onConnectSubtypePoint,
              data.id,
              startTable, // parentTable
              endTable, // childTable
              settings.tableWidth // tableWidth
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
  } catch (error) {
    console.error("Relationship render error:", error, {
      id: data.id,
      subtype: data.subtype,
      relationshipType: data.relationshipType,
      endTableId: data.endTableId,
      endTableIds: data.endTableIds
    });
    // Return a minimal fallback to prevent crash
    return <g></g>;
  }
}