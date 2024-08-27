import { Button, Banner } from "@douyinfe/semi-ui";
import { IconLink } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { Octokit } from "octokit";

export default function Share() {
  const { t } = useTranslation();

  const generateLink = async () => {
    const octokit = new Octokit({
      auth: import.meta.env.VITE_GITHUB_ACCESS_TOKEN,
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
    }
  };

  return (
    <div className="space-y-4">
      <Banner
        fullMode={false}
        type="info"
        icon={null}
        closeIcon={null}
        description="When you generate a link a gist with the JSON representation of the
        diagram will get created. This will not start a real-time collaboration
        session."
      />
      <Button
        type="primary"
        theme="solid"
        className="text-base me-2 pe-6 ps-5 py-[18px] rounded-md"
        size="default"
        icon={<IconLink />}
        onClick={generateLink}
      >
        {t("generate_link")}
      </Button>
    </div>
  );
}
