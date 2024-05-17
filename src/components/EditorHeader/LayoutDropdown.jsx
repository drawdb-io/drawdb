import {
  IconCaretdown,
  IconCheckboxTick,
  IconRowsStroked,
} from "@douyinfe/semi-icons";
import { Dropdown } from "@douyinfe/semi-ui";
import { useLayout } from "../../hooks";
import { enterFullscreen, exitFullscreen } from "../../utils/fullscreen";
import { useTranslation } from "react-i18next";

export default function LayoutDropdown() {
  const { layout, setLayout } = useLayout();
  const { t } = useTranslation();

  const invertLayout = (component) =>
    setLayout((prev) => ({ ...prev, [component]: !prev[component] }));

  return (
    <Dropdown
      position="bottomLeft"
      style={{ width: "180px" }}
      render={
        <Dropdown.Menu>
          <Dropdown.Item
            icon={
              layout.header ? <IconCheckboxTick /> : <div className="px-2" />
            }
            onClick={() => invertLayout("header")}
          >
            {t("header")}
          </Dropdown.Item>
          <Dropdown.Item
            icon={
              layout.sidebar ? <IconCheckboxTick /> : <div className="px-2" />
            }
            onClick={() => invertLayout("sidebar")}
          >
            {t("sidebar")}
          </Dropdown.Item>
          <Dropdown.Item
            icon={
              layout.issues ? <IconCheckboxTick /> : <div className="px-2" />
            }
            onClick={() => invertLayout("issues")}
          >
            {t("issues")}
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item
            icon={<div className="px-2" />}
            onClick={() => {
              if (layout.fullscreen) {
                exitFullscreen();
              } else {
                enterFullscreen();
              }
              invertLayout("fullscreen");
            }}
          >
            {t("fullscreen")}
          </Dropdown.Item>
        </Dropdown.Menu>
      }
      trigger="click"
    >
      <div className="py-1 px-2 hover-2 rounded flex items-center justify-center">
        <IconRowsStroked size="extra-large" />
        <div>
          <IconCaretdown />
        </div>
      </div>
    </Dropdown>
  );
}
