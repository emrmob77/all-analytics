import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { orderMock, pathnameMock } = vi.hoisted(() => ({
  orderMock: vi.fn(),
  pathnameMock: vi.fn()
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

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock()
}));

import App from "@/App";
import { BrandProvider } from "@/contexts/BrandContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { queryClient } from "@/lib/queryClient";
import ModulePlaceholderRenderer from "@/modules/ModulePlaceholderRenderer";

function renderOverviewApp() {
  return render(
    <ThemeProvider>
      <BrandProvider>
        <App>
          <ModulePlaceholderRenderer moduleKey="overview" />
        </App>
      </BrandProvider>
    </ThemeProvider>
  );
}

describe("Overview integration", () => {
  beforeEach(() => {
    pathnameMock.mockReturnValue("/");
    orderMock.mockReset();
    orderMock.mockResolvedValue({
      data: [
        { id: "brand-1", name: "Growth Hacking Inc.", avatar: "GH", active_admins: 3 },
        { id: "brand-2", name: "Nova Retail Group", avatar: "NR", active_admins: 2 }
      ],
      error: null
    });
    window.localStorage.clear();
    window.sessionStorage.clear();
    queryClient.clear();
  });

  it("renders overview modules with mocked api data", async () => {
    renderOverviewApp();

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Active Campaigns/i })).toBeInTheDocument();
    });

    expect(screen.getByRole("heading", { name: /Connected Channels/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Available Integrations/i })).toBeInTheDocument();
  });

  it("supports brand selection flow", async () => {
    const user = userEvent.setup();
    renderOverviewApp();

    const activeBrandTrigger = await screen.findByRole("button", { name: /Growth Hacking Inc\./i });
    await user.click(activeBrandTrigger);
    await user.click(screen.getByRole("menuitemradio", { name: /Nova Retail Group/i }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Nova Retail Group/i })).toBeInTheDocument();
    });
  });
});
