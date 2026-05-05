import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type Lang = "ru" | "en";

type Prefs = {
  theme: Theme;
  lang: Lang;
  setTheme: (t: Theme) => void;
  setLang: (l: Lang) => void;
};

const PrefsContext = createContext<Prefs | null>(null);

function getInitialTheme(): Theme {
  const saved = localStorage.getItem("mdkp_theme");
  if (saved === "dark" || saved === "light") return saved;
  return "light";
}

function getInitialLang(): Lang {
  const saved = localStorage.getItem("mdkp_lang");
  if (saved === "ru" || saved === "en") return saved;
  return "ru";
}

export function PrefsProvider(props: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [lang, setLangState] = useState<Lang>(() => getInitialLang());

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem("mdkp_theme", t);
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem("mdkp_lang", l);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("theme-dark", theme === "dark");
  }, [theme]);

  const value = useMemo(() => ({ theme, lang, setTheme, setLang }), [theme, lang, setTheme, setLang]);
  return <PrefsContext.Provider value={value}>{props.children}</PrefsContext.Provider>;
}

export function usePrefs() {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used within PrefsProvider");
  return ctx;
}

