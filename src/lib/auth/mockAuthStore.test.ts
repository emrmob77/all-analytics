import { describe, expect, it } from "vitest";

import { createPasswordResetToken, loginUser, registerUser, resetPassword } from "@/lib/auth/mockAuthStore";

describe("mockAuthStore", () => {
  it("registers and logs in a user", () => {
    const email = `user_${Date.now()}@allanalytics.app`;
    const registration = registerUser({
      email,
      password: "StrongPassword123!",
      fullName: "Test User"
    });

    expect("user" in registration).toBe(true);

    const login = loginUser({
      email,
      password: "StrongPassword123!"
    });

    expect("session" in login).toBe(true);
  });

  it("handles reset password flow", () => {
    const email = `reset_${Date.now()}@allanalytics.app`;

    registerUser({
      email,
      password: "BeforeReset123!",
      fullName: "Reset User"
    });

    const token = createPasswordResetToken(email);

    expect(token).toBeTruthy();

    const resetResult = resetPassword({
      token: token as string,
      nextPassword: "AfterReset123!"
    });

    expect("user" in resetResult).toBe(true);

    const login = loginUser({
      email,
      password: "AfterReset123!"
    });

    expect("session" in login).toBe(true);
  });
});
