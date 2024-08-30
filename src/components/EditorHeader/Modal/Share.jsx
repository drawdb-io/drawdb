import { Button, Input, Modal, Spin, Toast } from "@douyinfe/semi-ui";
import { MODAL } from "../../../data/constants";
import { useCallback, useContext, useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Octokit } from "octokit";
import { IdContext } from "../../Workspace";
import { IconLink } from "@douyinfe/semi-icons";
import { isRtl } from "../../../i18n/utils/rtl";

export default function Share({ modal, setModal }) {
  const { t, i18n } = useTranslation();
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
        setLoading(false);
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

  return (
    <Modal
      visible={modal === MODAL.SHARE}
      style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      title={t("share")}
      footer={<></>}
      onCancel={() => setModal(MODAL.NONE)}
      centered
      closeOnEsc={true}
      cancelText={t("cancel")}
      width={600}
      bodyStyle={{
        maxHeight: window.innerHeight - 280,
        overflow: "auto",
        direction: "ltr",
      }}
    >
      {loading ? (
        <div className="text-blue-500 text-center">
          <Spin size="middle" />
          <div>{t("loading")}</div>
        </div>
      ) : (
        <div>
          <div className="flex gap-3">
            <Input value={url} size="large" />
            <Button
              size="large"
              theme="solid"
              icon={<IconLink />}
              onClick={copyLink}
            >
              {t("copy_link")}
            </Button>
          </div>
          <hr className="opacity-20 mt-3 mb-1" />
          <div className="text-xs">
            * Sharing this link will not create a live real-time collaboration
            session
          </div>
        </div>
      )}
    </Modal>
  );
}
