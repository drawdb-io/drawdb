import { Button, Spin } from "@douyinfe/semi-ui";
import { IconShareStroked } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { Octokit } from "octokit";
import { MODAL } from "../../data/constants";
import { useContext, useState } from "react";
import { IdContext } from "../Workspace";

export default function ShareButton({ setModal }) {
  const { t } = useTranslation();
  const { gistId, setGistId } = useContext(IdContext);
  const [loading, setLoading] = useState(false);

  const updateGist = async () => {
    setLoading(true);
    const userToken = localStorage.getItem("github_token");

    const octokit = new Octokit({
      auth: userToken ?? import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
    });

    try {
      const res = await octokit.request(`PATCH /gists/${gistId}`, {
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
      console.log(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateLink = async () => {
    setLoading(true);
    const userToken = localStorage.getItem("github_token");

    const octokit = new Octokit({
      auth: userToken ?? import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
    });

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
  };

  const onShare = async () => {
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

  return (
    <Button
      type="primary"
      className="text-base me-2 pe-6 ps-5 py-[18px] rounded-md"
      size="default"
      icon={loading ? <Spin /> : <IconShareStroked />}
      onClick={onShare}
    >
      {t("share")}
    </Button>
  );
}
