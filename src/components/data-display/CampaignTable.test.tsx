import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import CampaignTable from "@/components/data-display/CampaignTable";

describe("CampaignTable", () => {
  it("renders campaign rows and table headers", () => {
    render(<CampaignTable />);

    expect(screen.getByRole("columnheader", { name: /Campaign Name/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /Platform/i })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: /ROAS/i })).toBeInTheDocument();
    expect(screen.getByText("Summer Sale 2026")).toBeInTheDocument();
    expect(screen.getByText("Retargeting Visitors")).toBeInTheDocument();
  });

  it("allows selecting campaign filter", async () => {
    const user = userEvent.setup();

    render(<CampaignTable />);

    const select = screen.getByRole("combobox", { name: /Filter campaigns by status/i });
    await user.selectOptions(select, "paused");

    expect(select).toHaveValue("paused");
    expect(screen.getAllByRole("button", { name: /Campaign actions/i })).toHaveLength(4);
  });
});
