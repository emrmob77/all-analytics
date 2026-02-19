import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { pathnameMock } = vi.hoisted(() => ({
  pathnameMock: vi.fn()
}));

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock()
}));

import usePageTitle from "@/hooks/usePageTitle";

describe("usePageTitle", () => {
  beforeEach(() => {
    pathnameMock.mockReset();
    document.title = "";
  });

  it("returns route title and updates document title", async () => {
    pathnameMock.mockReturnValue("/performance");

    const { result } = renderHook(() => usePageTitle());

    expect(result.current).toBe("Performance");
    await waitFor(() => {
      expect(document.title).toBe("Allanalytics - Performance");
    });
  });

  it("maps root path to overview title", async () => {
    pathnameMock.mockReturnValue("/");

    const { result } = renderHook(() => usePageTitle());

    expect(result.current).toBe("Overview Dashboard");
    await waitFor(() => {
      expect(document.title).toBe("Allanalytics - Overview Dashboard");
    });
  });
});
