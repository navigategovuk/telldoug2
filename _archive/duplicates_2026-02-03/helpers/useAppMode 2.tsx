import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { PenLine, ShieldCheck, Share2, LucideIcon } from "lucide-react";

export type AppMode = "edit" | "review" | "publish";

export interface AppModeConfig {
  mode: AppMode;
  label: string;
  description: string;
  icon: LucideIcon;
  colorVar: string;
  accentColor: string; // Hex fallback or specific tailwind-like color
}

interface AppModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  currentConfig: AppModeConfig;
}

const STORAGE_KEY = "telldoug_app_mode";

const MODE_CONFIGS: Record<AppMode, AppModeConfig> = {
  edit: {
    mode: "edit",
    label: "Edit",
    description: "Modify your profile data",
    icon: PenLine,
    colorVar: "--color-primary",
    accentColor: "#2563eb", // Blue-600
  },
  review: {
    mode: "review",
    label: "Review",
    description: "Quality analysis & provenance",
    icon: ShieldCheck,
    colorVar: "--color-warning",
    accentColor: "#d97706", // Amber-600
  },
  publish: {
    mode: "publish",
    label: "Publish",
    description: "Snapshots & sharing",
    icon: Share2,
    colorVar: "--color-success",
    accentColor: "#059669", // Emerald-600
  },
};

const AppModeContext = createContext<AppModeContextValue | undefined>(
  undefined
);

export function getModeConfig(mode: AppMode): AppModeConfig {
  return MODE_CONFIGS[mode];
}

export function AppModeProvider({ children }: { children: ReactNode }) {
  // Initialize from sessionStorage if available, otherwise default to 'edit'
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      const stored = window.sessionStorage.getItem(STORAGE_KEY);
      if (stored === "edit" || stored === "review" || stored === "publish") {
        return stored;
      }
    }
    return "edit";
  });

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    if (typeof window !== "undefined" && window.sessionStorage) {
      window.sessionStorage.setItem(STORAGE_KEY, newMode);
    }
  }, []);

  // Sync with storage events (e.g. if changed in another tab, though sessionStorage is tab-specific,
  // this is good practice if we switch to localStorage later)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const newMode = e.newValue as AppMode;
        if (["edit", "review", "publish"].includes(newMode)) {
          setModeState(newMode);
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const value = {
    mode,
    setMode,
    currentConfig: MODE_CONFIGS[mode],
  };

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode() {
  const context = useContext(AppModeContext);
  if (context === undefined) {
    throw new Error("useAppMode must be used within an AppModeProvider");
  }
  return context;
}
