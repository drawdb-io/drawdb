import { IconSun, IconMoon } from "@douyinfe/semi-icons";
import { Button } from "@douyinfe/semi-ui";
import { useSettings } from "../hooks";

export default function ThemeToggle() {
  const { settings, setSettings } = useSettings();

  const toggleTheme = () => {
    setSettings(prev => ({
      ...prev,
      mode: prev.mode === "light" ? "dark" : "light"
    }));
  };

  return (
    <Button
      icon={settings.mode === "light" ? <IconMoon /> : <IconSun />}
      onClick={toggleTheme}
      theme="borderless"
      size="large"
      className="hover:opacity-60 transition-all duration-300"
      title={`Switch to ${settings.mode === "light" ? "dark" : "light"} mode`}
    />
  );
}