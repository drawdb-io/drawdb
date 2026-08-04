import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Action, ObjectType } from "../../data/constants";
import { useDiagram, useEnums, useLayout, useUndoRedo } from "../../hooks";
import { applyDiagramPlan } from "../../utils/dbml/applyPlan";
import { diffDiagram } from "../../utils/dbml/diff";
import { parseDbml } from "../../utils/dbml/parse";
import { reconcileDbml } from "../../utils/dbml/reconcile";
import { toDBML } from "../../utils/exportAs/dbml";
import CodeEditor from "../CodeEditor";

const APPLY_DELAY_MS = 500;
const MARKER_OWNER = "dbml";

function toProblems(error) {
  const diags = Array.isArray(error?.diags) ? error.diags : [];

  if (!diags.length) {
    return [
      {
        message: error?.message ?? "Invalid DBML",
        startLine: 1,
        startColumn: 1,
        endLine: 1,
        endColumn: 2,
      },
    ];
  }

  return diags.map((diag) => {
    const start = diag.location?.start ?? { line: 1, column: 1 };
    const end = diag.location?.end ?? {
      line: start.line,
      column: start.column + 1,
    };
    return {
      message: diag.message,
      startLine: start.line,
      startColumn: start.column,
      endLine: end.line,
      endColumn: end.column,
    };
  });
}

export default function DBMLEditor({ onProblemsChange }) {
  const diagram = useDiagram();
  const { enums, setEnums } = useEnums();
  const { layout } = useLayout();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { t } = useTranslation();

  const { tables, relationships, database } = diagram;
  const readOnly = layout.readOnly;

  const [focused, setFocused] = useState(false);

  const liveRef = useRef(null);
  liveRef.current = { database, tables, relationships, enums };

  const readOnlyRef = useRef(readOnly);
  readOnlyRef.current = readOnly;

  const onProblemsChangeRef = useRef(onProblemsChange);
  onProblemsChangeRef.current = onProblemsChange;

  const planContextRef = useRef(null);
  planContextRef.current = {
    addTable: diagram.addTable,
    updateTable: diagram.updateTable,
    updateField: diagram.updateField,
    deleteTable: diagram.deleteTable,
    addRelationship: diagram.addRelationship,
    updateRelationship: diagram.updateRelationship,
    deleteRelationship: diagram.deleteRelationship,
    setEnums,
  };

  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const draftRef = useRef(null);
  const timerRef = useRef(null);
  const baseRef = useRef(null);
  const printedRef = useRef(null);
  const reportedRef = useRef([]);
  const initialValueRef = useRef(null);

  if (initialValueRef.current === null) {
    initialValueRef.current = toDBML(liveRef.current);
    baseRef.current = liveRef.current;
    printedRef.current = initialValueRef.current;
  }

  const cancelPendingApply = () => {
    if (timerRef.current === null) return;
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const reportProblems = useCallback((found) => {
    if (!reportedRef.current.length && !found.length) return;
    reportedRef.current = found;

    const monaco = monacoRef.current;
    const model = editorRef.current?.getModel();
    if (monaco && model && !model.isDisposed()) {
      monaco.editor.setModelMarkers(
        model,
        MARKER_OWNER,
        found.map((problem) => ({
          severity: monaco.MarkerSeverity.Error,
          message: problem.message,
          startLineNumber: problem.startLine,
          startColumn: problem.startColumn,
          endLineNumber: problem.endLine,
          endColumn: problem.endColumn,
        })),
      );
    }

    onProblemsChangeRef.current?.(found);
  }, []);

  const applyDraft = useCallback(() => {
    cancelPendingApply();
    const draft = draftRef.current;
    if (draft === null || readOnlyRef.current) return;

    const base = baseRef.current;
    let next;
    let plan;
    try {
      const parsed = parseDbml(draft);
      next = reconcileDbml(parsed, base, base.database);
      plan = diffDiagram(base, next);
    } catch (error) {
      reportProblems(toProblems(error));
      return;
    }

    if (plan.length) {
      const live = liveRef.current;
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.DBML,
          data: {
            snapshot: {
              tables: live.tables,
              relationships: live.relationships,
              enums: live.enums,
            },
          },
          message: t("edit_dbml"),
        },
      ]);
      setRedoStack([]);
      applyDiagramPlan(plan, planContextRef.current);
    }

    baseRef.current = { ...base, ...next };
    printedRef.current = toDBML({ ...next, database: base.database });
    draftRef.current = null;
    reportProblems([]);
  }, [reportProblems, setRedoStack, setUndoStack, t]);

  const applyDraftRef = useRef(applyDraft);
  applyDraftRef.current = applyDraft;

  const reprint = useCallback(
    (text) => {
      cancelPendingApply();
      baseRef.current = liveRef.current;
      printedRef.current = text;
      draftRef.current = null;
      reportProblems([]);

      const model = editorRef.current?.getModel();
      if (model && !model.isDisposed() && model.getValue() !== text) {
        model.setValue(text);
      }
    },
    [reportProblems],
  );

  useEffect(() => {
    const generated = toDBML(liveRef.current);
    if (generated === printedRef.current) return;

    if (focused || draftRef.current !== null) return;

    reprint(generated);
  }, [database, tables, relationships, enums, focused, reprint]);

  useEffect(
    () => () => {
      applyDraftRef.current();
      onProblemsChangeRef.current?.([]);
    },
    [],
  );

  const handleChange = (value) => {
    if (readOnlyRef.current) return;

    if (value === printedRef.current) {
      cancelPendingApply();
      draftRef.current = null;
      reportProblems([]);
      return;
    }

    draftRef.current = value;
    cancelPendingApply();
    timerRef.current = setTimeout(
      () => applyDraftRef.current(),
      APPLY_DELAY_MS,
    );
  };

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.onDidFocusEditorText(() => setFocused(true));
    editor.onDidBlurEditorText(() => {
      setFocused(false);
      applyDraftRef.current();
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () =>
      applyDraftRef.current(),
    );
  };

  return (
    <CodeEditor
      showCopyButton
      defaultValue={initialValueRef.current}
      language="dbml"
      height="100%"
      formatOnMount={false}
      onChange={handleChange}
      onEditorMount={handleMount}
      options={{
        readOnly,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        acceptSuggestionOnEnter: "off",
      }}
    />
  );
}
