import { Input } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useLayout } from "../../../hooks";

export default function Rename({ title, setTitle }) {
  const { t } = useTranslation();
  const { layout } = useLayout();

  return (
    <Input
      placeholder={t("name")}
      defaultValue={title}
      onChange={(v) => setTitle(v)}
      readonly={layout.readOnly}
    />
  );
}
