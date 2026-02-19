import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { orderMock } = vi.hoisted(() => ({
  orderMock: vi.fn()
}));

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: orderMock
      }))
    }))
  }
}));

import { BrandProvider, useBrand } from "@/contexts/BrandContext";

function Wrapper({ children }: { children: ReactNode }) {
  return <BrandProvider>{children}</BrandProvider>;
}

describe("useBrand", () => {
  beforeEach(() => {
    orderMock.mockReset();
    window.sessionStorage.clear();
  });

  it("loads brands from supabase and allows changing active brand", async () => {
    orderMock.mockResolvedValue({
      data: [
        { id: "brand-a", name: "Alpha Commerce", avatar: "AC", active_admins: 2 },
        { id: "brand-b", name: "Beta Studio", avatar: null, active_admins: 4 }
      ],
      error: null
    });

    const { result } = renderHook(() => useBrand(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.brands).toHaveLength(2);
    expect(result.current.activeBrand?.id).toBe("brand-a");

    act(() => {
      result.current.selectBrand(result.current.brands[1]);
    });

    expect(result.current.activeBrand?.id).toBe("brand-b");
    expect(window.sessionStorage.getItem("allanalytics-active-brand-id")).toBe("brand-b");
  });
});
