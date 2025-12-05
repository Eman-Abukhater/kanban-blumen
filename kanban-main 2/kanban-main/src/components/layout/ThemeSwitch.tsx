// src/components/layout/ThemeSwitch.tsx
import { useEffect } from "react";
import useLocalStorage from "../../hooks/useLocalStorage";

type ThemeSwitchProps = {
  buttonClass?: string;
};

export default function ThemeSwitch({ buttonClass }: ThemeSwitchProps) {
  // 🔴 was "light" → now default "dark"
  const [theme, setTheme] = useLocalStorage<"dark" | "light">("theme", "dark");

  const handleToggle = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label="toggle dark mode"
      onClick={handleToggle}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        isDark ? "bg-ink" : "bg-slate500_20"
      } ${buttonClass ?? ""}`}
    >
      <span className="sr-only">Toggle dark mode</span>
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow-soft transform transition-transform ${
          isDark ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
