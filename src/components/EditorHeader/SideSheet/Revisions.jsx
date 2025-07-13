import { useContext, useEffect, useState } from "react";
import { IdContext } from "../../Workspace";
import { useTranslation } from "react-i18next";
import { Button, IconButton, Spin, Steps, Tag, Toast } from "@douyinfe/semi-ui";
import {
  IconPlus,
  IconChevronRight,
  IconChevronLeft,
} from "@douyinfe/semi-icons";
import { getCommits } from "../../../api/gists";
import moment from "moment";

export default function Revisions({ open }) {
  const { gistId } = useContext(IdContext);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [revisions, setRevisions] = useState([]);

  useEffect(() => {
    const getRevisions = async (gistId) => {
      setIsLoading(true);
      try {
        const { data } = await getCommits(gistId);
        setRevisions(data);
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
        <IconButton icon={<IconChevronLeft />} />
        <Button icon={<IconPlus />} block onClick={() => {}}>
          {t("record_version")}
        </Button>
        <IconButton icon={<IconChevronRight />} />
      </div>
      {!gistId && <div className="my-3">{t("no_saved_revisions")}</div>}
      {gistId && (
        <div className="my-3 overflow-y-auto">
          <Steps
            direction="vertical"
            type="basic"
            onChange={(i) => console.log(i)}
          >
            {revisions.map((r, i) => (
              <Steps.Step
                key={r.version}
                title={
                  <div className="flex justify-between items-center w-full">
                    <span>{`${t("version")} ${revisions.length - i}`}</span>
                    <Tag>{r.version.substring(0, 7)}</Tag>
                  </div>
                }
                description={
                  <div>
                    <div>{`Commited on ${moment(
                      new Date(r.committed_at),
                    ).format("MMMM Do YYYY, h:mm")}`}</div>
                  </div>
                }
                icon={<i className="text-sm fa-solid fa-asterisk" />}
              />
            ))}
          </Steps>
        </div>
      )}
    </div>
  );
}
