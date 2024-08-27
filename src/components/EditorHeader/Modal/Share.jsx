import { Banner, Button, Spin } from "@douyinfe/semi-ui";
import { IconLink } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { Octokit } from "octokit";
import { useState } from "react";
import { MODAL } from "../../../data/constants";

export default function Share({ setModal }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const generateLink = async () => {
    setLoading(true);
    const userToken = localStorage.getItem("github_token");

    const octokit = new Octokit({
      auth:
        userToken ?? import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
    });

    try {
      const res = await octokit.request("POST /gists", {
        description: "Hello world",
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
      console.log(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="share" className="space-y-4">
      <Banner
        fullMode={false}
        type="info"
        icon={null}
        closeIcon={null}
        description={
          <ul className="list-disc ms-4">
            <li>
              Generating a link will create a gist with the JSON representation
              of the diagram.
            </li>
            <li>
              You can create the gist from your account by providing your token
              <button
                onClick={() => setModal(MODAL.GITHUB_TOKEN)}
                className="ms-1 text-sky-500 hover:underline font-semibold"
              >
                here
              </button>
              .
            </li>
            <li>
              Sharing will not create a live real-time collaboration session.
            </li>
          </ul>
        }
      />
      <div className="text-center">
        <Button
          type="primary"
          theme="solid"
          className="text-base me-2 pe-6 ps-5 py-[18px] rounded-md"
          size="default"
          icon={loading ? <Spin /> : <IconLink />}
          onClick={generateLink}
        >
          {t("generate_link")}
        </Button>
      </div>
    </div>
  );
}
