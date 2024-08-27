import { Button, Input } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export default function GithubToken({ token, setToken }) {
  const { t } = useTranslation();

  const clearToken = () => {
    localStorage.removeItem("github_token");
    setToken("");
  };

  return (
    <div>
      <div className="mb-3">
        Set your{" "}
        <a
          href="https://github.com/settings/tokens"
          className="text-blue-500 hover:underline font-semibold"
        >
          personal access token
        </a>{" "}
        here if you wish to save diagrams to your gists.
      </div>
      <div className="flex gap-2">
        <Input
          className="w-full"
          placeholder={t("github_token")}
          value={token}
          onChange={(v) => setToken(v)}
        />
        <Button
          icon={<i className="fa-solid fa-xmark" />}
          type="danger"
          title={t("clear")}
          onClick={clearToken}
        />
      </div>
      <div className="mt-1 text-xs">
        *This will be stored in the local storage
      </div>
    </div>
  );
}
