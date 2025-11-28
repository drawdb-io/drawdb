import { createContext, useContext, useEffect, useState } from "react";

// Create context
export const ThemeContext = createContext();

// Theme provider component
export default function ThemeProvider({ children }) {
  // Check for system preference and stored preference
  const getInitialTheme = () => {
    // Check if we're in the browser
    if (typeof window !== "undefined") {
      // Check localStorage first
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        return storedTheme;
      }

      // Check system preference
      const userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return userPrefersDark ? "dark" : "light";
    }

    // Default to light if not in browser
    return "light";
  };

  const [theme, setTheme] = useState(getInitialTheme);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === "light" ? "dark" : "light");
  };

  // Update localStorage and apply theme class to html element
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("theme", theme);

    // Apply class to html element
    const htmlElement = document.documentElement;
    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }

    // Also update the theme-mode attribute for semi-ui components
    document.body.setAttribute("theme-mode", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      // Only update if user hasn't manually set a preference
      if (!localStorage.getItem("theme")) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    // Add listener
    mediaQuery.addEventListener("change", handleChange);

    // Clean up
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Provide theme context to children
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook for using theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
