import { useEffect } from "react";
import { Collapse, Badge } from "@douyinfe/semi-ui";
import { arrayIsEqual } from "../../utils/utils";
import { getIssues } from "../../utils/issues";
import {
  useEnums,
  useSettings,
  useDiagram,
  useTypes,
  useLayout,
} from "../../hooks";
import { useTranslation } from "react-i18next";

export default function Issues({ issues, setIssues }) {
  const { types } = useTypes();
  const { t } = useTranslation();
  const { settings } = useSettings();
  const { enums } = useEnums();
  const { tables, relationships, database } = useDiagram();
  const { layout } = useLayout();

  useEffect(() => {
    const findIssues = async () => {
      const newIssues = getIssues({
        tables: tables,
        relationships: relationships,
        types: types,
        database: database,
        enums: enums,
      });

      if (!arrayIsEqual(newIssues, issues.diagram)) {
        setIssues((prev) => ({ ...prev, diagram: newIssues }));
      }
    };

    findIssues();
  }, [tables, relationships, issues, types, database, enums, setIssues]);

  return (
    <Collapse lazyRender keepDOM={false} style={{ width: "100%" }}>
      <Collapse.Panel
        header={
          <Badge
            type={
              issues.dbml.length > 0 || issues.diagram.length > 0
                ? "danger"
                : "primary"
            }
            count={
              settings.strictMode
                ? null
                : issues.dbml.length + issues.diagram.length
            }
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
          {settings.strictMode ? (
            <div className="mb-1">{t("strict_mode_is_on_no_issues")}</div>
          ) : issues.dbml.length > 0 || issues.diagram.length > 0 ? (
            <>
              {!layout.dbmlEditor &&
                issues.dbml.map((e, i) => (
                  <div key={i} className="py-1 flex gap-2">
                    <i className="opacity-60 bi bi-braces" />
                    <div>{e}</div>
                  </div>
                ))}
              {issues.diagram.map((e, i) => (
                <div key={i} className="py-1 flex gap-2">
                  <i className="opacity-60 bi bi-diagram-2" />
                  <div>{e}</div>
                </div>
              ))}
            </>
          ) : (
            <div>{t("no_issues")}</div>
          )}
        </div>
      </Collapse.Panel>
    </Collapse>
  );
}
