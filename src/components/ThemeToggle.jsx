import { useTheme } from "../context/ThemeContext";

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`p-2 rounded-full transition-colors duration-300 ${
        theme === "dark" 
          ? "bg-gray-700 hover:bg-gray-600 text-yellow-300" 
          : "bg-gray-200 hover:bg-gray-300 text-gray-700"
      } ${className}`}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "dark" ? (
        <i className="bi bi-sun-fill text-xl"></i>
      ) : (
        <i className="bi bi-moon-fill text-xl"></i>
      )}
    </button>
  );
}
