import { memo, useMemo, useRef, useState, useEffect } from "react";
import { Cardinality, ObjectType, Tab } from "../../data/constants";
import { calcPath, calcCompositePath } from "../../utils/calcPath";
import { useSettings, useLayout, useSelect } from "../../hooks";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import {
  getVisibleFieldIndex,
  getVisibleFields,
  getRelationshipFields,
} from "../../utils/utils";
import { openRelationshipEditorSelection } from "../../utils/selection";

const labelFontSize = 16;

function Relationship({
  data,
  startTable,
  endTable,
  startRelationships,
  endRelationships,
}) {
  const { settings } = useSettings();
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { t } = useTranslation();

  const pathValues = useMemo(() => {
    if (!startTable || !endTable || startTable.hidden || endTable.hidden)
      return null;

    const startFields = getVisibleFields(startTable, startRelationships);
    const endFields = getVisibleFields(endTable, endRelationships);

    const pairs = getRelationshipFields(data);

    return {
      startFieldIndex: getVisibleFieldIndex(
        startTable,
        data.startFieldId,
        startRelationships,
      ),
      endFieldIndex: getVisibleFieldIndex(
        endTable,
        data.endFieldId,
        endRelationships,
      ),
      startFieldIndices: pairs.map((p) =>
        getVisibleFieldIndex(startTable, p.startFieldId, startRelationships),
      ),
      endFieldIndices: pairs.map((p) =>
        getVisibleFieldIndex(endTable, p.endFieldId, endRelationships),
      ),
      startTable: {
        x: startTable.x,
        y: startTable.y,
        comment: startTable.comment,
        fields: startFields,
      },
      endTable: {
        x: endTable.x,
        y: endTable.y,
        comment: endTable.comment,
        fields: endFields,
      },
    };
  }, [data, endRelationships, endTable, startRelationships, startTable]);

  const isComposite = (pathValues?.startFieldIndices?.length ?? 0) > 1;

  const composite = useMemo(() => {
    if (!pathValues || !isComposite) return null;
    return calcCompositePath(
      {
        startTable: pathValues.startTable,
        endTable: pathValues.endTable,
        startFieldIndices: pathValues.startFieldIndices,
        endFieldIndices: pathValues.endFieldIndices,
      },
      settings.tableWidth,
      1,
      settings.showComments,
    );
  }, [pathValues, isComposite, settings.tableWidth, settings.showComments]);

  const path = useMemo(() => {
    if (!pathValues) return null;
    return composite
      ? composite.path
      : calcPath(pathValues, settings.tableWidth, 1, settings.showComments);
  }, [composite, pathValues, settings.showComments, settings.tableWidth]);

  const pathRef = useRef();
  const labelRef = useRef();
  const [pathMetrics, setPathMetrics] = useState({ ready: false });

  let cardinalityStart = "1";
  let cardinalityEnd = "1";

  switch (data.cardinality) {
    // the translated values are to ensure backwards compatibility
    case t(Cardinality.MANY_TO_ONE):
    case Cardinality.MANY_TO_ONE:
      cardinalityStart = data.manyLabel || "n";
      cardinalityEnd = "1";
      break;
    case t(Cardinality.ONE_TO_MANY):
    case Cardinality.ONE_TO_MANY:
      cardinalityStart = "1";
      cardinalityEnd = data.manyLabel || "n";
      break;
    case t(Cardinality.ONE_TO_ONE):
    case Cardinality.ONE_TO_ONE:
      cardinalityStart = "1";
      cardinalityEnd = "1";
      break;
    default:
      break;
  }

  const cardinalityOffset = 28;

  useEffect(() => {
    if (!pathValues) {
      setPathMetrics({ ready: false });
      return;
    }

    const labelWidth = labelRef.current?.getBBox().width ?? 0;
    const labelHeight = labelRef.current?.getBBox().height ?? 0;
    if (composite) {
      setPathMetrics({
        ready: true,
        labelX: composite.labelPoint.x - labelWidth / 2,
        labelY: composite.labelPoint.y + labelHeight / 2,
        cardinalityStartX: composite.startCardinality.x,
        cardinalityStartY: composite.startCardinality.y,
        cardinalityEndX: composite.endCardinality.x,
        cardinalityEndY: composite.endCardinality.y,
      });
      return;
    }

    if (!pathRef.current) return;
    const pathLength = pathRef.current.getTotalLength();
    const labelPoint = pathRef.current.getPointAtLength(pathLength / 2);
    const point1 = pathRef.current.getPointAtLength(cardinalityOffset);
    const point2 = pathRef.current.getPointAtLength(
      pathLength - cardinalityOffset,
    );
    setPathMetrics({
      ready: true,
      labelX: labelPoint.x - labelWidth / 2,
      labelY: labelPoint.y + labelHeight / 2,
      cardinalityStartX: point1.x,
      cardinalityStartY: point1.y,
      cardinalityEndX: point2.x,
      cardinalityEndY: point2.y,
    });
  }, [composite, path, pathValues]);

  const edit = () => {
    if (!layout.sidebar) {
      setSelectedElement((prev) =>
        openRelationshipEditorSelection(prev, data.id, false),
      );
    } else {
      setSelectedElement((prev) =>
        openRelationshipEditorSelection(prev, data.id, true),
      );
      if (selectedElement.currentTab !== Tab.RELATIONSHIPS) return;
      document
        .getElementById(`scroll_ref_${data.id}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  if (!pathValues) return null;

  return (
    <>
      <g className="select-none group" onDoubleClick={edit}>
        {/* invisible wider path for better hover ux */}
        <path
          d={path}
          fill="none"
          stroke="transparent"
          strokeWidth={12}
          cursor="pointer"
        />
        <path
          ref={pathRef}
          d={path}
          className="relationship-path"
          fill="none"
          cursor="pointer"
        />
        {settings.showRelationshipLabels && (
          <text
            x={pathMetrics.labelX ?? 0}
            y={pathMetrics.labelY ?? 0}
            fill={settings.mode === "dark" ? "lightgrey" : "#333"}
            fontSize={labelFontSize}
            fontWeight={500}
            ref={labelRef}
            className="group-hover:fill-sky-600"
          >
            {data.name}
          </text>
        )}
        {pathMetrics.ready && settings.showCardinality && (
          <>
            <CardinalityLabel
              x={pathMetrics.cardinalityStartX}
              y={pathMetrics.cardinalityStartY}
              text={cardinalityStart}
            />
            <CardinalityLabel
              x={pathMetrics.cardinalityEndX}
              y={pathMetrics.cardinalityEndY}
              text={cardinalityEnd}
            />
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

export default memo(Relationship);

function CardinalityLabel({ x, y, text, r = 12, padding = 14 }) {
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      const bbox = textRef.current.getBBox();
      setTextWidth(bbox.width);
    }
  }, [text]);

  return (
    <g>
      <rect
        x={x - textWidth / 2 - padding / 2}
        y={y - r}
        rx={r}
        ry={r}
        width={textWidth + padding}
        height={r * 2}
        fill="grey"
        className="group-hover:fill-sky-600"
      />
      <text
        ref={textRef}
        x={x}
        y={y}
        fill="white"
        strokeWidth="0.5"
        textAnchor="middle"
        alignmentBaseline="middle"
      >
        {text}
      </text>
    </g>
  );
}
