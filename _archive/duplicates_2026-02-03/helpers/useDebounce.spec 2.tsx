import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./useDebounce";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("hello", 500));
    expect(result.current).toBe("hello");
  });

  it("should not update value before delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 500 } }
    );

    rerender({ value: "world", delay: 500 });

    // Before delay, value should still be the old one
    expect(result.current).toBe("hello");
  });

  it("should update value after delay", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "hello", delay: 500 } }
    );

    rerender({ value: "world", delay: 500 });

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe("world");
  });

  it("should reset timer on rapid value changes", () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: "a", delay: 500 } }
    );

    // Rapid changes
    rerender({ value: "b", delay: 500 });
    act(() => vi.advanceTimersByTime(200));
    
    rerender({ value: "c", delay: 500 });
    act(() => vi.advanceTimersByTime(200));
    
    rerender({ value: "d", delay: 500 });
    act(() => vi.advanceTimersByTime(200));

    // Should still be "a" because timer keeps resetting
    expect(result.current).toBe("a");

    // Now wait full delay
    act(() => vi.advanceTimersByTime(500));
    
    expect(result.current).toBe("d");
  });
});
