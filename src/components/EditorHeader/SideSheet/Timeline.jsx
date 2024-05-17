import { useTranslation } from "react-i18next";
import { useUndoRedo } from "../../../hooks";
import { List } from "@douyinfe/semi-ui";

export default function Timeline() {
  const { undoStack } = useUndoRedo();
  const { t } = useTranslation();

  if (undoStack.length > 0) {
    return (
      <List className="sidesheet-theme">
        {[...undoStack].reverse().map((e, i) => (
          <List.Item
            key={i}
            style={{ padding: "4px 18px 4px 18px" }}
            className="hover-1"
          >
            <div className="flex items-center py-1 w-full">
              <i className="block fa-regular fa-circle fa-xs" />
              <div className="ms-2">{e.message}</div>
            </div>
          </List.Item>
        ))}
      </List>
    );
  } else {
    return <div className="m-5 sidesheet-theme">{t("no_activity")}</div>;
  }
}
