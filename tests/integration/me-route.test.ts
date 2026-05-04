import { beforeEach, describe, expect, it, vi } from "vitest";

const { createSupabaseServerClientMock } = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

import { GET } from "@/app/api/me/route";

describe("GET /api/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns authenticated user payload when session exists", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "dev@example.com" } },
          error: null,
        }),
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      authenticated: true,
      user: { id: "user-123", email: "dev@example.com" },
    });
  });

  it("returns unauthenticated state when session is missing", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Auth session missing!" },
        }),
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ authenticated: false, user: null });
  });

  it("returns 500 when Supabase getUser returns unexpected error", async () => {
    createSupabaseServerClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: { message: "Unexpected auth failure" },
        }),
      },
    });

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      code: "unknown_error",
      message: "Session check failed",
    });
  });

  it("returns 500 on unexpected thrown exceptions", async () => {
    createSupabaseServerClientMock.mockRejectedValue(new Error("boom"));

    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body).toEqual({
      code: "unknown_error",
      message: "Internal server error",
    });
  });
});
