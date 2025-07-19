import { useCallback, useContext, useEffect, useState } from "react";
import { IdContext } from "../../Workspace";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Spin, Steps, Tag, Toast } from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
} from "@douyinfe/semi-icons";
import { getCommits, getVersion } from "../../../api/gists";
import { DateTime } from "luxon";
import { useAreas, useDiagram, useLayout } from "../../../hooks";

export default function Revisions({ open }) {
  const { gistId, setVersion } = useContext(IdContext);
  const { setAreas } = useAreas();
  const { setLayout } = useLayout();
  const { setTables, setRelationships } = useDiagram();
  const { t, i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [revisions, setRevisions] = useState([]);

  const loadVersion = useCallback(
    async (sha) => {
      try {
        const version = await getVersion(gistId, sha);
        setVersion(sha);
        setLayout((prev) => ({ ...prev, readOnly: true }));

        const content = version.data.files["share.json"].content;

        const parsedDiagram = JSON.parse(content);

        setTables(parsedDiagram.tables);
        setRelationships(parsedDiagram.relationships);
        setAreas(parsedDiagram.subjectAreas);
      } catch (e) {
        console.log(e);
        Toast.error("failed_to_load_diagram");
      }
    },
    [gistId, setTables, setRelationships, setAreas, setVersion, setLayout],
  );

  useEffect(() => {
    const getRevisions = async (gistId) => {
      try {
        setIsLoading(true);
        const { data } = await getCommits(gistId);
        setRevisions(
          data.filter((version) => version.change_status.total !== 0),
        );
      } catch (e) {
        console.log(e);
        Toast.error(t("oops_smth_went_wrong"));
      } finally {
        setIsLoading(false);
      }
    };

    if (gistId && open) {
      getRevisions(gistId);
    }
  }, [gistId, t, open]);

  if (gistId && isLoading) {
    return (
      <div className="text-blue-500 text-center">
        <Spin size="middle" />
        <div>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="mx-5 relative h-full">
      <div className="sticky top-0 z-10 sidesheet-theme pb-2 flex gap-2">
        <IconButton icon={<IconChevronLeft />} title="Previous" />
        <Button icon={<IconPlus />} block onClick={() => {}}>
          {t("record_version")}
        </Button>
        <IconButton icon={<IconChevronRight />} title="Next" />
      </div>
      {!gistId && <div className="my-3">{t("no_saved_revisions")}</div>}
      {gistId && (
        <div className="my-3 overflow-y-auto">
          <Steps direction="vertical" type="basic">
            {revisions.map((r, i) => (
              <Steps.Step
                key={r.version}
                onClick={() => loadVersion(r.version)}
                title={
                  <div className="flex justify-between items-center w-full">
                    <span>{`${t("version")} ${revisions.length - i}`}</span>
                    <Tag>{r.version.substring(0, 7)}</Tag>
                  </div>
                }
                description={`${t("commited_at")} ${DateTime.fromISO(
                  r.committed_at,
                )
                  .setLocale(i18n.language)
                  .toLocaleString(DateTime.DATETIME_MED)}`}
                icon={<i className="text-sm fa-solid fa-asterisk" />}
              />
            ))}
          </Steps>
        </div>
      )}
    </div>
  );
}
