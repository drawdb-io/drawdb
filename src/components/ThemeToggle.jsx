import { useTheme } from "../context/ThemeContext";
import { IconSun, IconMoon } from "@douyinfe/semi-icons";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle Theme"
        >
            {theme === "dark" ? (
                <IconSun className="text-yellow-400" size="extra-large" />
            ) : (
                <IconMoon className="text-gray-600" size="extra-large" />
            )}
        </button>
    );
}
