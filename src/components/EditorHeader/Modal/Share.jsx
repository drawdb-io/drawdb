import { Button, Input, Spin, Toast } from "@douyinfe/semi-ui";
import { MODAL } from "../../../data/constants";
import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Octokit } from "octokit";
import { IdContext } from "../../Workspace";
import { IconLink } from "@douyinfe/semi-icons";

export default function Share({ setModal }) {
  const { t } = useTranslation();
  const { gistId, setGistId } = useContext(IdContext);
  const [loading, setLoading] = useState(false);

  const userToken = localStorage.getItem("github_token");
  const octokit = useMemo(() => {
    return new Octokit({
      auth: userToken ?? import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
    });
  }, [userToken]);
  const url = useMemo(
    () => window.location.href + "?shareId=" + gistId,
    [gistId],
  );

  const updateGist = useCallback(async () => {
    setLoading(true);
    try {
      await octokit.request(`PATCH /gists/${gistId}`, {
        gist_id: gistId,
        description: "drawDB diagram",
        files: {
          "test.json": {
            content: '{"Hello":"SEAMAN"}',
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
  }, [gistId, octokit]);

  const generateLink = useCallback(async () => {
    setLoading(true);
    try {
      const res = await octokit.request("POST /gists", {
        description: "drawDB diagram",
        public: false,
        files: {
          "test.json": {
            content: '{"Hello":"WORLD"}',
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
  }, [octokit, setGistId]);

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
        setModal(MODAL.SHARE);
      }
    };
    updateOrGenerateLink();
  }, [gistId, generateLink, setModal, updateGist]);

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
    <div className="flex gap-3">
      <Input value={url} size="large" />
      <Button size="large" theme="solid" icon={<IconLink />} onClick={copyLink}>
        {t("copy_link")}
      </Button>
    </div>
  );
}
