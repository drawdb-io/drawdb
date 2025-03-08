import { Button, Input, Spin, Toast } from "@douyinfe/semi-ui";
import { useCallback, useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IdContext } from "../../Workspace";
import { IconLink } from "@douyinfe/semi-icons";
import {
  useAreas,
  useDiagram,
  useEnums,
  useNotes,
  useTransform,
  useTypes,
} from "../../../hooks";
import { databases } from "../../../data/databases";
import { octokit } from "../../../data/octokit";
import { MODAL } from "../../../data/constants";

export default function Share({ title, setModal }) {
  const { t } = useTranslation();
  const { gistId, setGistId } = useContext(IdContext);
  const [loading, setLoading] = useState(true);
  const { tables, relationships, database } = useDiagram();
  const { notes } = useNotes();
  const { areas } = useAreas();
  const { types } = useTypes();
  const { enums } = useEnums();
  const { transform } = useTransform();
  const url =
    window.location.origin + window.location.pathname + "?shareId=" + gistId;

  const diagramToString = useCallback(() => {
    return JSON.stringify({
      tables: tables,
      relationships: relationships,
      notes: notes,
      subjectAreas: areas,
      database: database,
      ...(databases[database].hasTypes && { types: types }),
      ...(databases[database].hasEnums && { enums: enums }),
      title: title,
      transform: transform,
    });
  }, [
    areas,
    notes,
    tables,
    relationships,
    database,
    title,
    enums,
    types,
    transform,
  ]);

  const unshare = useCallback(async () => {
    try {
      await octokit.request(`DELETE /gists/${gistId}`, {
        gist_id: gistId,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      setGistId("");
      setModal(MODAL.NONE);
    } catch (e) {
      console.error(e);
    }
  }, [gistId, setGistId, setModal]);

  const updateGist = useCallback(async () => {
    setLoading(true);
    try {
      await octokit.request(`PATCH /gists/${gistId}`, {
        gist_id: gistId,
        description: "drawDB diagram",
        files: {
          "share.json": {
            content: diagramToString(),
          },
        },
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [gistId, diagramToString]);

  const generateLink = useCallback(async () => {
    setLoading(true);
    try {
      const res = await octokit.request("POST /gists", {
        description: "drawDB diagram",
        public: false,
        files: {
          "share.json": {
            content: diagramToString(),
          },
        },
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      });
      setGistId(res.data.id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [setGistId, diagramToString]);

  useEffect(() => {
    const updateOrGenerateLink = async () => {
      try {
        if (!gistId || gistId === "") {
          await generateLink();
        } else {
          await updateGist();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    updateOrGenerateLink();
  }, [gistId, generateLink, updateGist]);

  const copyLink = () => {
    navigator.clipboard
      .writeText(url)
      .then(() => {
        Toast.success(t("copied_to_clipboard"));
      })
      .catch(() => {
        Toast.error(t("oops_smth_went_wrong"));
      });
  };

  if (loading)
    return (
      <div className="text-blue-500 text-center">
        <Spin size="middle" />
        <div>{t("loading")}</div>
      </div>
    );

  return (
    <div>
      <div className="flex gap-3">
        <Input value={url} size="large" />
      </div>
      <div className="text-xs mt-2">{t("share_info")}</div>
      <div className="flex gap-2 mt-3">
        <Button block onClick={unshare}>
          {t("unshare")}
        </Button>
        <Button block theme="solid" icon={<IconLink />} onClick={copyLink}>
          {t("copy_link")}
        </Button>
      </div>
    </div>
  );
}
