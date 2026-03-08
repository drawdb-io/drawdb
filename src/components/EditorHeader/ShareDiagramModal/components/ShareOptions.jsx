import { Button } from "@douyinfe/semi-ui";
import { IconLink, IconPlay } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { OPTIONS } from "../constants";

export default function ShareOptions({ setOption }) {
  const { t } = useTranslation();

  return (
    <div className="text-center space-y-6">
      <div>
        <div className="font-semibold text-lg">{t("live_collaboration")}</div>
        <div className="px-12 opacity-80 my-3">
          Start a real-time collaboration session and invite others to edit the
          diagram with you.
        </div>
        <Button
          className="mt-4"
          size="large"
          icon={<IconPlay />}
          theme="solid"
          onClick={() => setOption(OPTIONS.LIVE)}
        >
          {t("start_session")}
        </Button>
      </div>

      <div className="flex items-center gap-3 my-4">
        <hr className="flex-1 border-neutral-500" />
        <span className="text-neutral-500 text-sm">{t("or")}</span>
        <hr className="flex-1 border-neutral-500" />
      </div>

      <div>
        <div className="font-semibold text-lg">{t("sharable_link")}</div>
        <div className="px-12 opacity-80 my-3">
          Generate a link that you can send to others. Anyone with the link can
          view the diagram.
        </div>
        <Button
          className="mt-4"
          size="large"
          icon={<IconLink />}
          theme="solid"
          onClick={() => setOption(OPTIONS.LINK)}
        >
          {t("generate_link")}
        </Button>
      </div>
    </div>
  );
}
