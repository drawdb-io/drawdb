import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Cardinality,
  ObjectType,
  Tab,
  darkBgTheme,
} from "../../data/constants";
import { relationshipHoverLabel } from "./RelationshipHoverLabel";
import { calcPath, calcCompositePath } from "../../utils/calcPath";
import { useSettings, useLayout, useSelect, useDiagram } from "../../hooks";
import { SelectActionsContext } from "../../context/SelectContext";
import { useTranslation } from "react-i18next";
import { SideSheet } from "@douyinfe/semi-ui";
import RelationshipInfo from "../EditorSidePanel/RelationshipsTab/RelationshipInfo";
import {
  getVisibleFieldEntries,
  getRelationshipFields,
  getTableWidth,
} from "../../utils/utils";

const labelFontSize = 16;
const cardinalityOffset = 28;

export default memo(function Relationship({
  data,
  startTable,
  endTable,
  startRelatedFieldKeys,
  endRelatedFieldKeys,
  shortLabel,
}) {
  const { layout } = useLayout();
  const { setSelectedElement } = useContext(SelectActionsContext);

  const edit = useCallback(() => {
    setSelectedElement((prev) => ({
      ...prev,
      ...(layout.sidebar && { currentTab: Tab.RELATIONSHIPS }),
      element: ObjectType.RELATIONSHIP,
      id: data.id,
      open: true,
    }));
    if (layout.sidebar) {
      document
        .getElementById(`scroll_ref_${data.id}`)
        ?.scrollIntoView({ behavior: "smooth" });
    }
  }, [data.id, layout.sidebar, setSelectedElement]);

  return (
    <RelationshipPath
      data={data}
      startTable={startTable}
      endTable={endTable}
      startRelatedFieldKeys={startRelatedFieldKeys}
      endRelatedFieldKeys={endRelatedFieldKeys}
      shortLabel={shortLabel}
      onEdit={edit}
    />
  );
});

export function RelationshipEditSheet() {
  const { layout } = useLayout();
  const { selectedElement, setSelectedElement } = useSelect();
  const { relationships } = useDiagram();
  const { t } = useTranslation();

  const data =
    selectedElement.element === ObjectType.RELATIONSHIP &&
    selectedElement.open &&
    !layout.sidebar
      ? relationships.find((r) => r.id === selectedElement.id)
      : null;

  return (
    <SideSheet
      title={t("edit")}
      size="small"
      visible={Boolean(data)}
      onCancel={() => {
        setSelectedElement((prev) => ({
          ...prev,
          open: false,
        }));
      }}
      style={{ paddingBottom: "16px" }}
    >
      <div className="sidesheet-theme">
        {data && <RelationshipInfo data={data} />}
      </div>
    </SideSheet>
  );
}

const RelationshipPath = memo(function RelationshipPath({
  data,
  startTable,
  endTable,
  startRelatedFieldKeys,
  endRelatedFieldKeys,
  shortLabel,
  onEdit,
}) {
  const { settings } = useSettings();
  const labelText =
    settings.shortRelationshipLabels && shortLabel ? shortLabel : data.name;
  const { t } = useTranslation();

  const pathValues = useMemo(() => {
    if (!startTable || !endTable || startTable.hidden || endTable.hidden)
      return null;

    const startEntries = getVisibleFieldEntries(
      startTable,
      startRelatedFieldKeys,
    );
    const endEntries = getVisibleFieldEntries(endTable, endRelatedFieldKeys);
    const indexOf = (entries, fieldId) =>
      entries.findIndex(
        ({ field, originalIndex }) =>
          field.id === fieldId || originalIndex === fieldId,
      );

    const pairs = getRelationshipFields(data);

    return {
      startFieldIndex: indexOf(startEntries, data.startFieldId),
      endFieldIndex: indexOf(endEntries, data.endFieldId),
      startFieldIndices: pairs.map((p) =>
        indexOf(startEntries, p.startFieldId),
      ),
      endFieldIndices: pairs.map((p) => indexOf(endEntries, p.endFieldId)),
      startTable: {
        x: startTable.x,
        y: startTable.y,
        width: getTableWidth(startTable),
        comment: startTable.comment,
        fields: startEntries.map(({ field }) => field),
      },
      endTable: {
        x: endTable.x,
        y: endTable.y,
        width: getTableWidth(endTable),
        comment: endTable.comment,
        fields: endEntries.map(({ field }) => field),
      },
    };
  }, [startTable, endTable, startRelatedFieldKeys, endRelatedFieldKeys, data]);

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
      1,
      settings.showComments,
    );
  }, [pathValues, isComposite, settings.showComments]);

  const d = useMemo(() => {
    if (!pathValues) return null;
    if (composite) return composite.path;
    return calcPath(pathValues, 1, settings.showComments);
  }, [pathValues, composite, settings.showComments]);

  const pathRef = useRef();
  const labelRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [anchors, setAnchors] = useState(null);

  useLayoutEffect(() => {
    if (!d || !pathRef.current) {
      setAnchors(null);
      return;
    }

    const labelBox = labelRef.current?.getBBox();
    const labelWidth = labelBox?.width ?? 0;
    const labelHeight = labelBox?.height ?? 0;

    let labelPoint, startPoint, endPoint;
    if (composite) {
      labelPoint = composite.labelPoint;
      startPoint = composite.startCardinality;
      endPoint = composite.endCardinality;
    } else {
      const path = pathRef.current;
      const pathLength = path.getTotalLength();
      labelPoint = path.getPointAtLength(pathLength / 2);
      startPoint = path.getPointAtLength(cardinalityOffset);
      endPoint = path.getPointAtLength(pathLength - cardinalityOffset);
    }

    setAnchors({
      center: { x: labelPoint.x, y: labelPoint.y },
      label: {
        x: labelPoint.x - labelWidth / 2,
        y: labelPoint.y + labelHeight / 2,
      },
      start: { x: startPoint.x, y: startPoint.y },
      end: { x: endPoint.x, y: endPoint.y },
    });
  }, [d, composite, labelText, settings.showRelationshipLabels]);

  const showFullName = () => {
    setHovered(true);
    if (anchors && data.name) {
      relationshipHoverLabel.show({
        id: data.id,
        text: data.name,
        x: anchors.center.x,
        y: anchors.center.y - 28,
      });
    }
  };
  const hideFullName = () => {
    setHovered(false);
    relationshipHoverLabel.hide(data.id);
  };
  useEffect(() => () => relationshipHoverLabel.hide(data.id), [data.id]);

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

  if (!d) return null;

  return (
    <g
      className="select-none group"
      onDoubleClick={onEdit}
      onPointerEnter={showFullName}
      onPointerLeave={hideFullName}
    >
      {/* invisible wider path for better hover ux */}
      <path
        d={d}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        cursor="pointer"
      />
      <path
        ref={pathRef}
        d={d}
        className="relationship-path"
        style={{ stroke: hovered ? undefined : data.color }}
        fill="none"
        cursor="pointer"
      />
      {settings.showRelationshipLabels && (
        <text
          x={anchors?.label.x ?? 0}
          y={anchors?.label.y ?? 0}
          fill={data.color ?? (settings.mode === "dark" ? "lightgrey" : "#333")}
          fontSize={labelFontSize}
          fontWeight={500}
          stroke={settings.mode === "dark" ? darkBgTheme : "white"}
          strokeWidth={4}
          strokeLinejoin="round"
          paintOrder="stroke"
          ref={labelRef}
          className="group-hover:fill-sky-600"
        >
          {labelText}
        </text>
      )}
      {anchors && settings.showCardinality && (
        <>
          <CardinalityLabel
            x={anchors.start.x}
            y={anchors.start.y}
            text={cardinalityStart}
            color={data.color}
          />
          <CardinalityLabel
            x={anchors.end.x}
            y={anchors.end.y}
            text={cardinalityEnd}
            color={data.color}
          />
        </>
      )}
    </g>
  );
});

function CardinalityLabel({ x, y, text, color, r = 12, padding = 14 }) {
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
        fill={color ?? "grey"}
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
