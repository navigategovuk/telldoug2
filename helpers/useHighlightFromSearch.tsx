import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./useHighlightFromSearch.module.css";

interface UseHighlightFromSearchResult {
  /**
   * The ID currently being highlighted, if any.
   * This is derived from the 'id' URL query parameter.
   */
  highlightedId: string | null;

  /**
   * Clears the highlight state and removes the 'id' query parameter from the URL.
   */
  clearHighlight: () => void;

  /**
   * Scrolls the given element into view with a smooth animation.
   * Useful to pass to a ref callback.
   */
  scrollToElement: (element: HTMLElement | null) => void;

  /**
   * The CSS class name to apply to the highlighted element.
   * Contains the animation styles.
   */
  highlightClassName: string;
}

/**
 * A hook to handle highlighting and scrolling to an item when navigating from a search result.
 * It reads the `id` query parameter, provides a highlight state, and auto-clears it after a delay.
 */
export function useHighlightFromSearch(
  autoClearDelay = 3000
): UseHighlightFromSearchResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const paramId = searchParams.get("id");
  const [highlightedId, setHighlightedId] = useState<string | null>(paramId);

  // Sync local state with URL param when it changes (e.g. navigation from search)
  useEffect(() => {
    if (paramId) {
      setHighlightedId(paramId);
    }
  }, [paramId]);

  const clearHighlight = useCallback(() => {
    setHighlightedId(null);
    setSearchParams(
      (prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("id");
        return newParams;
      },
      { replace: true }
    );
  }, [setSearchParams]);

  // Auto-clear the highlight after the specified delay
  useEffect(() => {
    if (highlightedId) {
      const timer = setTimeout(() => {
        clearHighlight();
      }, autoClearDelay);

      return () => clearTimeout(timer);
    }
  }, [highlightedId, autoClearDelay, clearHighlight]);

  const scrollToElement = useCallback((element: HTMLElement | null) => {
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  return {
    highlightedId,
    clearHighlight,
    scrollToElement,
    highlightClassName: styles.highlighted,
  };
}