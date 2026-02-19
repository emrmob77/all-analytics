import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import NavigationMenu from "@/components/navigation/NavigationMenu";
import type { NavigationSection } from "@/types/navigation";

const sections: NavigationSection[] = [
  {
    title: "Analytics",
    items: [
      { label: "Overview Dashboard", icon: "dashboard", path: "/" },
      { label: "Google Ads", icon: "brand:google-ads", path: "/google-ads" }
    ]
  },
  {
    title: "System",
    items: [{ label: "Settings", icon: "settings", path: "/settings" }]
  }
];

describe("NavigationMenu", () => {
  it("renders menu items and marks active route", () => {
    render(<NavigationMenu activePath="/google-ads" sections={sections} />);

    const activeLink = screen.getByRole("menuitem", { name: /Google Ads/i });

    expect(activeLink).toBeInTheDocument();
    expect(activeLink).toHaveAttribute("aria-current", "page");
  });

  it("supports section toggle and item click callback", async () => {
    const onItemClick = vi.fn();
    const user = userEvent.setup();

    render(<NavigationMenu activePath="/" onItemClick={onItemClick} sections={sections} />);

    await user.click(screen.getByRole("button", { name: /Analytics/i }));
    expect(screen.queryByRole("menuitem", { name: /Overview Dashboard/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Analytics/i }));
    await user.click(screen.getByRole("menuitem", { name: /Overview Dashboard/i }));

    expect(onItemClick).toHaveBeenCalledTimes(1);
  });
});
