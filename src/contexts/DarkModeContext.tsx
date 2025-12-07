"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface DarkModeContextType {
  isDark: boolean;
  toggle: () => void;
  setIsDark: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

export function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // On mount, read the initial value from the DOM (set by inline script)
  useEffect(() => {
    setMounted(true);
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  // Sync changes to DOM and localStorage
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("quiz0r-dark-mode", String(isDark));
  }, [isDark, mounted]);

  const toggle = () => setIsDark((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ isDark, toggle, setIsDark }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("useDarkMode must be used within a DarkModeProvider");
  }
  return context;
}
