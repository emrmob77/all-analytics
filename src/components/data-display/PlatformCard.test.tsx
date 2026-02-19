import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import PlatformCard from "@/components/data-display/PlatformCard";

describe("PlatformCard", () => {
  it("renders channel cards", () => {
    render(<PlatformCard />);

    expect(screen.getByRole("heading", { name: /Connected Channels/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Google Ads/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /LinkedIn Ads/i })).toBeInTheDocument();
  });

  it("toggles a platform connection state", async () => {
    const user = userEvent.setup();
    render(<PlatformCard />);

    const linkedInCard = screen.getByRole("heading", { name: /LinkedIn Ads/i }).closest("article");
    expect(linkedInCard).not.toBeNull();

    if (!linkedInCard) {
      throw new Error("LinkedIn card not found");
    }

    expect(within(linkedInCard).getByText("Inactive")).toBeInTheDocument();

    await user.click(screen.getByLabelText(/Toggle LinkedIn Ads connection/i));

    expect(within(linkedInCard).getByText("Connected")).toBeInTheDocument();
  });
});
