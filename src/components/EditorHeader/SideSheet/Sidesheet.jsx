import { SideSheet as SemiUISideSheet } from "@douyinfe/semi-ui";
import { SIDESHEET } from "../../../data/constants";
import Timeline from "./Timeline";
import Todo from "./Todo";
import Versions from "./Versions";
import { useTranslation } from "react-i18next";

export default function Sidesheet({ type, title, setTitle, onClose }) {
  const { t } = useTranslation();

  function getTitle(type) {
    switch (type) {
      case SIDESHEET.TIMELINE:
        return t("timeline");
      case SIDESHEET.TODO:
        return t("to_do");
      case SIDESHEET.VERSIONS:
        return t("versions");
      default:
        break;
    }
  }

  function getContent(type) {
    switch (type) {
      case SIDESHEET.TIMELINE:
        return <Timeline />;
      case SIDESHEET.TODO:
        return <Todo />;
      case SIDESHEET.VERSIONS:
        return (
          <Versions
            open={type !== SIDESHEET.NONE}
            title={title}
            setTitle={setTitle}
          />
        );
      default:
        break;
    }
  }

  return (
    <SemiUISideSheet
      visible={type !== SIDESHEET.NONE}
      onCancel={onClose}
      width={420}
      title={<div className="text-lg">{getTitle(type)}</div>}
      style={{ paddingBottom: "16px" }}
      bodyStyle={{ padding: "0px" }}
    >
      <div className="sidesheet-theme">{getContent(type)}</div>
    </SemiUISideSheet>
  );
}
