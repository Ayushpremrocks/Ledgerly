import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const KEY = "ledgerly-theme";

function readPref() {
  try {
    return localStorage.getItem(KEY) || "system";
  } catch {
    return "system";
  }
}

/** preference: "light" | "dark" | "system". The .dark class on <html> drives all colors. */
export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPref);
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolved === "dark");
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", resolved === "dark" ? "#0c0c0b" : "#fafaf9");
  }, [resolved]);

  const setTheme = (pref) => {
    setPreference(pref);
    try {
      localStorage.setItem(KEY, pref);
    } catch {
      // storage blocked: the choice still applies for this visit
    }
  };

  return <ThemeContext.Provider value={{ preference, resolved, setTheme }}>{children}</ThemeContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => useContext(ThemeContext);
