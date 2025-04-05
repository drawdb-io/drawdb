import { useContext, useEffect, useState } from "react";
import { IdContext } from "../../Workspace";
import { useTranslation } from "react-i18next";
import { Button, Spin } from "@douyinfe/semi-ui";
import { IconPlus } from "@douyinfe/semi-icons";

export default function Revisions() {
  const { gistId } = useContext(IdContext);
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  if (gistId && isLoading) {
    return (
      <div className="text-blue-500 text-center">
        <Spin size="middle" />
        <div>{t("loading")}</div>
      </div>
    );
  }

  return (
    <div className="mx-5">
      <Button icon={<IconPlus />} block onClick={() => {}}>
        {t("record_version")}
      </Button>
      {!gistId && <div className="my-3">{t("no_saved_revisions")}</div>}
    </div>
  );
}
