import { useRegisterSW } from "virtual:pwa-register/react";
import { Typography, Toast } from "@douyinfe/semi-ui";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
const { Text } = Typography;

export function PwaUpdatePrompt() {
  const { t } = useTranslation();
  const {
    needRefresh: [isRefreshNeeded],
    updateServiceWorker,
  } = useRegisterSW();

  useEffect(() => {
    if (!isRefreshNeeded) return;

    Toast.info({
      duration: 0, // indefinite
      content: (
        <div>
          <h5>{t("update_available")}</h5>
          <p className="text-xs">{t("reload_page_to_update")}</p>
          <div className="mt-2">
            <Text link onClick={updateServiceWorker}>
              {t("reload_now")}
            </Text>
          </div>
        </div>
      ),
    });
  }, [isRefreshNeeded, updateServiceWorker, t]);

  return <></>;
}
