import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "read_mode_enabled";

interface ReadModeContextType {
  isReadMode: boolean;
  toggleReadMode: () => void;
}

const ReadModeContext = createContext<ReadModeContextType>({
  isReadMode: false,
  toggleReadMode: () => {},
});

export function ReadModeProvider({ children }: { children: React.ReactNode }) {
  const [isReadMode, setIsReadMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "1") setIsReadMode(true);
    } catch {
      // ignore
    }
  }, []);

  const toggleReadMode = useCallback(() => {
    setIsReadMode((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        } catch {
          // ignore
        }
      }
      return next;
    });
  }, []);

  return (
    <ReadModeContext.Provider value={{ isReadMode, toggleReadMode }}>
      {children}
    </ReadModeContext.Provider>
  );
}

export function useReadMode() {
  return useContext(ReadModeContext);
}
