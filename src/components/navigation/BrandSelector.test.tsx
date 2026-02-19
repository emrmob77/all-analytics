import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import BrandSelector from "@/components/navigation/BrandSelector";
import type { Brand } from "@/types/navigation";

const brands: Brand[] = [
  { id: "brand-1", name: "Growth Hacking Inc.", avatar: "GH", activeAdmins: 3 },
  { id: "brand-2", name: "Nova Retail Group", avatar: "NR", activeAdmins: 2 },
  { id: "brand-3", name: "Momentum Labs", avatar: "ML", activeAdmins: 5 }
];

describe("BrandSelector", () => {
  it("renders active brand information", () => {
    render(<BrandSelector brand={brands[0]} brands={brands} onSelectBrand={vi.fn()} />);

    expect(screen.getByText("Growth Hacking Inc.")).toBeInTheDocument();
    expect(screen.getByText("3 admins active")).toBeInTheDocument();
  });

  it("opens dropdown and selects a different brand", async () => {
    const onSelectBrand = vi.fn();
    const user = userEvent.setup();

    render(<BrandSelector brand={brands[0]} brands={brands} onSelectBrand={onSelectBrand} />);

    await user.click(screen.getByRole("button", { name: /Growth Hacking Inc\./i }));
    await user.click(screen.getByRole("menuitemradio", { name: /Nova Retail Group/i }));

    expect(onSelectBrand).toHaveBeenCalledWith(brands[1]);
    expect(onSelectBrand).toHaveBeenCalledTimes(1);
  });
});
