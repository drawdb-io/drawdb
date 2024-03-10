import { Divider, Tooltip } from "@douyinfe/semi-ui";
import { exitFullscreen } from "../utils";
import useTransform from "../hooks/useTransform";
import useLayout from "../hooks/useLayout";

export default function Controls() {
  const { transform, setTransform } = useTransform();
  const { setLayout } = useLayout();

  return (
    <div className="flex gap-2">
      <div className="popover-theme flex rounded-lg items-center">
        <button
          className="px-3 py-2"
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              zoom: prev.zoom / 1.2,
            }))
          }
        >
          <i className="bi bi-dash-lg"></i>
        </button>
        <Divider align="center" layout="vertical" />
        <div className="px-3 py-2">{parseInt(transform.zoom * 100)}%</div>
        <Divider align="center" layout="vertical" />
        <button
          className="px-3 py-2"
          onClick={() =>
            setTransform((prev) => ({
              ...prev,
              zoom: prev.zoom * 1.2,
            }))
          }
        >
          <i className="bi bi-plus-lg"></i>
        </button>
      </div>
      <Tooltip content="Exit">
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
        >
          <i className="bi bi-fullscreen-exit"></i>
        </button>
      </Tooltip>
    </div>
  );
}
