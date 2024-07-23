import { Input } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";

export default function Rename({ title, setTitle }) {
  const { t } = useTranslation();

  return (
    <Input
      placeholder={t("name")}
      defaultValue={title}
      onChange={(v) => setTitle(v)}
    />
  );
}
