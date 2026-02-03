import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  ReactNode,
} from "react";

interface AIChatStateContextValue {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

const AIChatStateContext = createContext<AIChatStateContextValue | null>(null);

/**
 * Provider component that wraps the app (or a portion of it) to provide
 * AI chat panel visibility state.
 */
export function AIChatStateProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggle = () => setIsOpen((prev) => !prev);

  const value = useMemo(
    () => ({
      isOpen,
      setIsOpen,
      toggle,
    }),
    [isOpen],
  );

  return (
    <AIChatStateContext.Provider value={value}>
      {children}
    </AIChatStateContext.Provider>
  );
}

/**
 * Hook to access the AI chat panel state.
 * Throws an error if used outside of AIChatStateProvider.
 */
export function useAIChatState(): AIChatStateContextValue {
  const context = useContext(AIChatStateContext);
  if (!context) {
    throw new Error("useAIChatState must be used within an AIChatStateProvider");
  }
  return context;
}