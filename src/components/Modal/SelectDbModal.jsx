import { memo, useState } from "react";
import { Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { useSettings } from "../../hooks";
import { databases } from "../../data/databases";

export default memo(function SelectDbModal(props) {
  const { showSelectDbModal, onOk } = props;
  const { t } = useTranslation();
  const { settings } = useSettings();
  const [selectedDb, setSelectedDb] = useState("");
  if (!showSelectDbModal) return null;
  return (
    <Modal
      centered
      size="medium"
      closable={false}
      hasCancel={false}
      title={t("pick_db")}
      okText={t("confirm")}
      visible={showSelectDbModal}
      onOk={() => {
        setSelectedDb(selectedDb);
        onOk(selectedDb);
      }}
      okButtonProps={{ disabled: selectedDb === "" }}
    >
      <div className="grid grid-cols-3 gap-4 place-content-center">
        {Object.values(databases).map((x) => (
          <div
            key={x.name}
            onClick={() => setSelectedDb(x.label)}
            className={`space-y-3 py-3 px-4 rounded-md border-2 select-none ${
              settings.mode === "dark"
                ? "bg-zinc-700 hover:bg-zinc-600"
                : "bg-zinc-100 hover:bg-zinc-200"
            } ${selectedDb === x.label ? "border-zinc-400" : "border-transparent"}`}
          >
            <div className="font-semibold">{x.name}</div>
            {x.image && (
              <img
                src={x.image}
                className="h-10"
                style={{
                  filter:
                    "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                }}
              />
            )}
            <div className="text-xs">{x.description}</div>
          </div>
        ))}
      </div>
    </Modal>
  );
});
