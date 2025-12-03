import { Divider, Tooltip } from "@douyinfe/semi-ui";
import { useTransform, useLayout } from "../hooks";
import { exitFullscreen } from "../utils/fullscreen";
import { useTranslation } from "react-i18next";

export default function FloatingControls() {
  const { transform, setTransform } = useTransform();
  const { setLayout } = useLayout();
  const { t } = useTranslation();

  return (
    <div className="flex gap-2">
      <div
        className="popover-theme flex rounded-lg items-center"
        role="group"
        aria-label={t("zoom")}
      >
        <button
          className="px-3 py-2"
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              zoom: prev.zoom / 1.2,
            }))
          }
          aria-label={t("zoom_out")}
          title={t("zoom_out")}
        >
          <i className="bi bi-dash-lg" aria-hidden="true" />
        </button>
        <Divider align="center" layout="vertical" />
        <div
          className="px-3 py-2"
          role="status"
          aria-live="polite"
          aria-label={`${t("zoom")}: ${parseInt(transform.zoom * 100)}%`}
        >
          {parseInt(transform.zoom * 100)}%
        </div>
        <Divider align="center" layout="vertical" />
        <button
          className="px-3 py-2"
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              zoom: prev.zoom * 1.2,
            }))
          }
          aria-label={t("zoom_in")}
          title={t("zoom_in")}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" />
        </button>
      </div>
      <Tooltip content={t("exit")}>
        <button
          className="px-3 py-2 rounded-lg popover-theme"
          onClick={() => {
            setLayout((prev) => ({
              ...prev,
              sidebar: true,
              toolbar: true,
              header: true,
            }));
            exitFullscreen();
          }}
          aria-label={t("fullscreen")}
          title={t("fullscreen")}
        >
          <i className="bi bi-fullscreen-exit" aria-hidden="true" />
        </button>
      </Tooltip>
    </div>
  );
}
