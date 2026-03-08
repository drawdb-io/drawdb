import { useState } from "react";
import { Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { OPTIONS } from "./constants";
import GenerateLink from "./components/GenerateLink";
import LiveCollaboration from "./components/LiveCollaboration";
import ShareOptions from "./components/ShareOptions";
import { useCollab } from "../../../hooks";

export default function ShareDiagramModal({
  visible,
  onClose,
  diagramId,
  title,
  setTitle,
}) {
  const { t } = useTranslation();
  const [option, setOption] = useState(null);
  const { inSession } = useCollab();

  const handleClose = () => {
    setOption(null);
    onClose();
  };

  const body = () => {
    if (inSession) {
      return <LiveCollaboration setTitle={setTitle}/>;
    }

    if (!option) {
      return <ShareOptions setOption={setOption} />;
    }

    if (option === OPTIONS.LINK) {
      return <GenerateLink diagramId={diagramId} title={title} />;
    }

    if (option === OPTIONS.LIVE) {
      return <LiveCollaboration setTitle={setTitle} />;
    }
  };

  return (
    <Modal
      visible={visible}
      onCancel={handleClose}
      footer={<></>}
      centered
      width={540}
      title={t("share")}
    >
      {body()}
    </Modal>
  );
}
