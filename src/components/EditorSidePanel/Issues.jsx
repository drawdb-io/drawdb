import { useMemo } from "react";
import { Collapse, Badge } from "@douyinfe/semi-ui";
import { getIssues } from "../../utils/issues";
import { useEnums, useSettings, useDiagram, useTypes } from "../../hooks";
import { useTranslation } from "react-i18next";

export default function Issues({ dbmlProblems = [] }) {
  const { types } = useTypes();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { enums } = useEnums();
  const { tables, relationships, database } = useDiagram();
  const issues = useMemo(
    () =>
      getIssues({
        tables: tables,
        relationships: relationships,
        types: types,
        database: database,
        enums: enums,
      }),
    [tables, relationships, types, database, enums],
  );

  const badgeCount = settings.strictMode
    ? dbmlProblems.length || null
    : issues.length + dbmlProblems.length;

  return (
    <Collapse lazyRender keepDOM={false} style={{ width: "100%" }}>
      <Collapse.Panel
        header={
          <Badge
            type={badgeCount > 0 ? "danger" : "primary"}
            count={badgeCount}
            overflowCount={99}
            className="mt-1"
          >
            <div className="pe-3 select-none">
              <i className="fa-solid fa-triangle-exclamation me-2 text-yellow-500" />
              {t("issues")}
            </div>
          </Badge>
        }
        itemKey="1"
      >
        <div className="max-h-[160px] overflow-y-auto">
          {dbmlProblems.map((problem, i) => (
            <div key={`dbml-${i}`} className="py-2 text-red-500">
              {t("dbml_problem", {
                line: problem.startLine,
                column: problem.startColumn,
                message: problem.message,
              })}
            </div>
          ))}
          {settings.strictMode ? (
            <div className="mb-1">{t("strict_mode_is_on_no_issues")}</div>
          ) : issues.length > 0 ? (
            issues.map((e, i) => (
              <div key={i} className="py-2">
                {e}
              </div>
            ))
          ) : (
            !dbmlProblems.length && <div>{t("no_issues")}</div>
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}
