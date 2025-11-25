import { useState, createContext } from "react";
import ControlPanel from "./EditorHeader/ControlPanel";
import Canvas from "./EditorCanvas/Canvas";
import { CanvasContextProvider } from "../context/CanvasContext";
import SidePanel from "./EditorSidePanel/SidePanel";
import {
  useLayout,
  useSettings,
  useSaveState,
  useDiagramIO,
} from "../hooks";
import FloatingControls from "./FloatingControls";
import { Button, Modal, Tag } from "@douyinfe/semi-ui";
import { IconAlertTriangle } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";

export const IdContext = createContext({
  gistId: "",
  setGistId: () => { },
  version: "",
  setVersion: () => { },
});

const SIDEPANEL_MIN_WIDTH = 384;

export default function WorkSpace() {
  const {
    id,
    setId,
    gistId,
    setGistId,
    version,
    setVersion,
    title,
    setTitle,
    lastSaved,
    setLastSaved,
    showSelectDbModal,
    setShowSelectDbModal,
    selectedDb,
    setSelectedDb,
    returnToCurrentDiagram,
    setDatabase,
  } = useDiagramIO();

  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(SIDEPANEL_MIN_WIDTH);
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const { layout, setLayout } = useLayout();
  const { settings } = useSettings();
  const { saveState, setSaveState } = useSaveState();
  const { t, i18n } = useTranslation();

  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > SIDEPANEL_MIN_WIDTH) setWidth(w);
  };

  return (
    <div className="h-full flex flex-col overflow-hidden theme">
      <IdContext.Provider value={{ gistId, setGistId, version, setVersion }}>
        <ControlPanel
          diagramId={id}
          setDiagramId={setId}
          title={title}
          setTitle={setTitle}
          lastSaved={lastSaved}
          setLastSaved={setLastSaved}
        />
      </IdContext.Provider>
      <div
        className="flex h-full overflow-y-auto"
        onPointerUp={(e) => e.isPrimary && setResize(false)}
        onPointerLeave={(e) => e.isPrimary && setResize(false)}
        onPointerMove={(e) => e.isPrimary && handleResize(e)}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        {layout.sidebar && (
          <SidePanel resize={resize} setResize={setResize} width={width} />
        )}
        <div className="relative w-full h-full overflow-hidden">
          <CanvasContextProvider className="h-full w-full">
            <Canvas saveState={saveState} setSaveState={setSaveState} />
          </CanvasContextProvider>
          {version && (
            <div className="absolute right-8 top-2 space-x-2">
              <Button
                icon={<i className="fa-solid fa-rotate-right mt-0.5"></i>}
                onClick={() => setShowRestoreModal(true)}
              >
                {t("restore_version")}
              </Button>
              <Button
                type="tertiary"
                onClick={returnToCurrentDiagram}
                icon={<i className="bi bi-arrow-return-right mt-1"></i>}
              >
                {t("return_to_current")}
              </Button>
            </div>
          )}
          {!(layout.sidebar || layout.toolbar || layout.header) && (
            <div className="fixed right-5 bottom-4">
              <FloatingControls />
            </div>
          )}
        </div>
      </div>
      <Modal
        centered
        size="medium"
        closable={false}
        hasCancel={false}
        title={t("pick_db")}
        okText={t("confirm")}
        visible={showSelectDbModal}
        onOk={() => {
          if (selectedDb === "") return;
          setDatabase(selectedDb);
          setShowSelectDbModal(false);
        }}
        okButtonProps={{ disabled: selectedDb === "" }}
      >
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {Object.values(databases).map((x) => (
            <div
              key={x.name}
              onClick={() => setSelectedDb(x.label)}
              className={`space-y-3 p-3 rounded-md border-2 select-none ${settings.mode === "dark"
                ? "bg-zinc-700 hover:bg-zinc-600"
                : "bg-zinc-100 hover:bg-zinc-200"
                } ${selectedDb === x.label ? "border-zinc-400" : "border-transparent"}`}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold">{x.name}</div>
                {x.beta && (
                  <Tag size="small" color="light-blue">
                    Beta
                  </Tag>
                )}
              </div>
              {x.image && (
                <img
                  src={x.image}
                  className="h-8"
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
      <Modal
        visible={showRestoreModal}
        centered
        closable
        onCancel={() => setShowRestoreModal(false)}
        title={
          <span className="flex items-center gap-2">
            <IconAlertTriangle className="text-amber-400" size="extra-large" />{" "}
            {t("restore_version")}
          </span>
        }
        okText={t("continue")}
        cancelText={t("cancel")}
        onOk={() => {
          setLayout((prev) => ({ ...prev, readOnly: false }));
          setShowRestoreModal(false);
          setVersion(null);
        }}
      >
        {t("restore_warning")}
      </Modal>
    </div>
  );
}
