// src/components/layout/ThemeSwitch.tsx
import { useEffect, useState } from "react";

type ThemeSwitchProps = {
  buttonClass?: string;
};

export default function ThemeSwitch({ buttonClass }: ThemeSwitchProps) {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  // On mount: read localStorage + sync <html> class
  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const html = document.documentElement;
    const stored = localStorage.getItem("theme");

    if (stored === "light") {
      html.classList.remove("dark");
      setIsDark(false);
    } else {
      // stored === "dark" or null → default dark
      html.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (typeof window === "undefined") return;

    setIsDark((prev) => {
      const next = !prev;
      const html = document.documentElement;

      if (next) {
        html.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        html.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }

      return next;
    });
  };

  // While hydrating, show neutral shell to avoid flicker
  if (!mounted) {
    return (
      <button
        type="button"
        className={`relative inline-flex h-6 w-11 items-center rounded-full bg-slate500_20 ${buttonClass ?? ""}`}
      >
        <span className="inline-block h-5 w-5 rounded-full bg-white shadow-soft" />
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label="toggle dark mode"
      onClick={toggleTheme}
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
