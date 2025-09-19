import { useEffect, useState } from "react";
import { useDiagram, useEnums, useLayout } from "../../hooks";
import { toDBML } from "../../utils/exportAs/dbml";
import { fromDBML } from "../../utils/importFrom/dbml";
import { Button, Tooltip } from "@douyinfe/semi-ui";
import { IconTemplate } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import CodeEditor from "../CodeEditor";

export default function DBMLEditor() {
  const diagram = useDiagram();
  const {
    tables: currentTables,
    relationships,
    setTables,
    setRelationships,
    database,
    externalIssues,
  } = diagram;
  const { enums, setEnums } = useEnums();
  const [value, setValue] = useState(() => toDBML({ ...diagram, enums }));
  const { setLayout } = useLayout();
  const { setExternalIssues } = diagram;
  const { t } = useTranslation();

  // Translate DBML parse errors to issues and Monaco markers
  const [markers, setMarkers] = useState([]);

  const toggleDBMLEditor = () => {
    setLayout((prev) => ({ ...prev, dbmlEditor: !prev.dbmlEditor }));
  };

  useEffect(() => {
    const normalized = toDBML({
      tables: currentTables,
      enums,
      relationships,
      database,
    });
    setValue(normalized);
  }, [currentTables, enums, relationships, database]);

  useEffect(() => {
    const currentDbml = toDBML({
      tables: currentTables,
      enums,
      relationships,
      database,
    });

    if (value === currentDbml) {
      // If editor content already matches diagram state,
      // ensure any lingering external issues/markers are cleared
      if (externalIssues?.length) setExternalIssues([]);
      if (markers.length) setMarkers([]);
      return;
    }

    const handle = setTimeout(() => {
      try {
        const parsed = fromDBML(value);
        // Preserve coordinates when table names match existing ones
        const nameToExisting = new Map(
          currentTables.map((t) => [t.name, { x: t.x, y: t.y }]),
        );
        parsed.tables = parsed.tables.map((t) => {
          const coords = nameToExisting.get(t.name);
          return coords ? { ...t, ...coords } : t;
        });
        setTables(parsed.tables);
        setRelationships(parsed.relationships);
        setEnums(parsed.enums);
        // Clear any previous external issues on success
        setExternalIssues([]);
        setMarkers([]);
      } catch (err) {
        const { issues: parsedIssues, markers: parsedMarkers } =
          produceDiagnostics(err);
        setExternalIssues(parsedIssues);
        setMarkers(parsedMarkers);
      }
    }, 700);

    return () => clearTimeout(handle);
  }, [
    value,
    currentTables,
    enums,
    relationships,
    database,
    setTables,
    setRelationships,
    setEnums,
    setExternalIssues,
    externalIssues?.length,
    markers.length,
  ]);

  const produceDiagnostics = (err) => {
    // Prefer diagnostics from @dbml/core if present
    if (Array.isArray(err?.diags) && err.diags.length > 0) {
      const issues = err.diags.map((d) => {
        const ln = d?.location?.start?.line;
        const col = d?.location?.start?.column;
        const code = d?.code ? ` [${d.code}]` : "";
        if (ln && col) return `line ${ln}, col ${col}: ${d.message}${code}`;
        return d.message + code;
      });

      const markers = err.diags.map((d) => {
        const start = d?.location?.start || {};
        const end = d?.location?.end || {};
        const startLineNumber = start.line || 1;
        const startColumn = start.column || 1;
        const endLineNumber = end.line || startLineNumber;
        const endColumn = end.column || startColumn + 1;
        return {
          startLineNumber,
          startColumn,
          endLineNumber,
          endColumn,
          message: d.message,
        };
      });
      return { issues, markers };
    }

    // Fallbacks
    const message =
      (typeof err?.message === "string" && err.message) ||
      (typeof err?.description === "string" && err.description) ||
      (() => {
        try {
          return JSON.stringify(err);
        } catch {
          return String(err);
        }
      })();

    // Try to extract line/column from string messages
    const m =
      /line\s+(\d+)\s*,\s*column\s*(\d+)/i.exec(message) ||
      /\((\d+)\s*[:|,]\s*(\d+)\)/.exec(message);
    const ln = m ? parseInt(m[1], 10) : 1;
    const col = m ? parseInt(m[2], 10) : 1;
    return {
      issues: [message],
      markers: [
        {
          startLineNumber: ln,
          startColumn: col,
          endLineNumber: ln,
          endColumn: col + 1,
          message,
        },
      ],
    };
  };

  return (
    <CodeEditor
      showCopyButton
      value={value}
      language="dbml"
      onChange={setValue}
      height="100%"
      markers={markers}
      options={{
        readOnly: false,
        minimap: { enabled: false },
      }}
      extraControls={
        <Tooltip content={t("tab_view")}>
          <Button icon={<IconTemplate />} onClick={toggleDBMLEditor} />
        </Tooltip>
      }
    />
  );
}
