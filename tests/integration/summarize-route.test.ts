import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Hoist mock factories ─────────────────────────────────────────────────────
const {
  createSupabaseServerClientMock,
  consumeDailyQuotaMock,
  fetchBraveResultsMock,
  normalizeResultsMock,
  isWeakResultSetMock,
  buildSearchContextMock,
  mapLengthToConfigMock,
  buildPromptMock,
  callOpenRouterMock,
} = vi.hoisted(() => ({
  createSupabaseServerClientMock: vi.fn(),
  consumeDailyQuotaMock: vi.fn(),
  fetchBraveResultsMock: vi.fn(),
  normalizeResultsMock: vi.fn(),
  isWeakResultSetMock: vi.fn(),
  buildSearchContextMock: vi.fn(),
  mapLengthToConfigMock: vi.fn(),
  buildPromptMock: vi.fn(),
  callOpenRouterMock: vi.fn(),
}));

vi.mock("@/lib/auth/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));
vi.mock("@/lib/rate-limit/consume-daily-quota", () => ({
  consumeDailyQuota: consumeDailyQuotaMock,
}));
vi.mock("@/lib/brave-search/client", () => ({
  fetchBraveResults: fetchBraveResultsMock,
}));
vi.mock("@/lib/brave-search/normalize-results", () => ({
  normalizeResults: normalizeResultsMock,
  isWeakResultSet: isWeakResultSetMock,
}));
vi.mock("@/lib/summaries/build-context", () => ({
  buildSearchContext: buildSearchContextMock,
}));
vi.mock("@/lib/summaries/map-length", () => ({
  mapLengthToConfig: mapLengthToConfigMock,
}));
vi.mock("@/lib/openrouter/prompt", () => ({
  buildPrompt: buildPromptMock,
}));
vi.mock("@/lib/openrouter/client", () => ({
  callOpenRouter: callOpenRouterMock,
}));

import { POST } from "@/app/api/summarize/route";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_PAYLOAD = {
  topic: "Benefits of retrieval augmented generation",
  model: "openai/gpt-oss-120b:free",
  mode: "summary",
  length: 50,
  language: "en",
};

function makeRequest(body: unknown = VALID_PAYLOAD) {
  return new Request("http://localhost/api/summarize", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function mockAuthenticatedClient() {
  createSupabaseServerClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "user-abc", email: "user@example.com" } },
        error: null,
      }),
    },
  });
}

function mockUnauthenticatedClient() {
  createSupabaseServerClientMock.mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Auth session missing!" },
      }),
    },
  });
}

function mockHappyPath() {
  mockAuthenticatedClient();
  consumeDailyQuotaMock.mockResolvedValue({ allowed: true, requestCount: 1 });
  fetchBraveResultsMock.mockResolvedValue([
    { title: "RAG overview", url: "https://example.com/1", description: "RAG explained.", extra_snippets: [] },
    { title: "RAG benefits", url: "https://example.com/2", description: "Why use RAG.", extra_snippets: [] },
    { title: "RAG use cases", url: "https://example.com/3", description: "RAG in production.", extra_snippets: [] },
  ]);
  normalizeResultsMock.mockReturnValue([
    { rank: 1, title: "RAG overview", snippet: "RAG explained.", url: "https://example.com/1" },
    { rank: 2, title: "RAG benefits", snippet: "Why use RAG.", url: "https://example.com/2" },
    { rank: 3, title: "RAG use cases", snippet: "RAG in production.", url: "https://example.com/3" },
  ]);
  isWeakResultSetMock.mockReturnValue(false);
  buildSearchContextMock.mockReturnValue("[1] RAG overview\nRAG explained.");
  mapLengthToConfigMock.mockReturnValue({
    band: "medium",
    maxTokens: 400,
    description: "medium — two to three paragraphs",
  });
  buildPromptMock.mockReturnValue([
    { role: "system", content: "You are a research assistant." },
    { role: "user", content: "Summarize: Benefits of retrieval augmented generation" },
  ]);
  callOpenRouterMock.mockResolvedValue({ output: "RAG improves accuracy by grounding models in real data." });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/summarize", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exports a POST handler", () => {
    expect(POST).toBeTypeOf("function");
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockUnauthenticatedClient();

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body).toMatchObject({ code: "unauthorized" });
  });

  it("returns 400 with empty_topic code when topic is blank", async () => {
    mockAuthenticatedClient();

    const response = await POST(makeRequest({ ...VALID_PAYLOAD, topic: "  " }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "empty_topic" });
  });

  it("returns 400 with model_not_allowed code for unapproved model", async () => {
    mockAuthenticatedClient();

    const response = await POST(makeRequest({ ...VALID_PAYLOAD, model: "some/unknown-model" }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "model_not_allowed" });
  });

  it("returns 429 when daily quota is exhausted", async () => {
    mockAuthenticatedClient();
    consumeDailyQuotaMock.mockResolvedValue({ allowed: false, requestCount: 10 });

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(429);
    expect(body).toMatchObject({ code: "rate_limited" });
  });

  it("returns 400 with weak_results code when search yields too few usable results", async () => {
    mockAuthenticatedClient();
    consumeDailyQuotaMock.mockResolvedValue({ allowed: true, requestCount: 1 });
    fetchBraveResultsMock.mockResolvedValue([]);
    normalizeResultsMock.mockReturnValue([]);
    isWeakResultSetMock.mockReturnValue(true);

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "weak_results" });
  });

  it("returns a generated output payload for authenticated requests", async () => {
    mockHappyPath();

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(
      expect.objectContaining({ output: expect.any(String) }),
    );
  });

  it("does not persist the output — response contains only { output }", async () => {
    mockHappyPath();

    const response = await POST(makeRequest());
    const body = await response.json();

    // Strict shape check: only output key, no history/id/saved fields.
    expect(Object.keys(body)).toEqual(["output"]);
  });
});

// ─── US2: Output shaping ──────────────────────────────────────────────────────

describe("POST /api/summarize — User Story 2: output shaping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Model allowlist validation ──────────────────────────────────────────────

  it.each([
    "openai/gpt-oss-120b:free",
    "tencent/hy3-preview:free",
    "minimax/minimax-m2.5:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
  ] as const)(
    "accepts allowlisted model '%s' and returns 200",
    async (model) => {
      mockHappyPath();

      const response = await POST(makeRequest({ ...VALID_PAYLOAD, model }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toMatchObject({ output: expect.any(String) });
    },
  );

  it("rejects an unlisted model string with 400 model_not_allowed", async () => {
    mockAuthenticatedClient();

    const response = await POST(
      makeRequest({ ...VALID_PAYLOAD, model: "openai/gpt-4o" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "model_not_allowed" });
  });

  it("rejects an empty model string with 400 model_not_allowed", async () => {
    mockAuthenticatedClient();

    const response = await POST(
      makeRequest({ ...VALID_PAYLOAD, model: "" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "model_not_allowed" });
  });

  // ── Mode-specific prompting ─────────────────────────────────────────────────

  it.each([
    "summary",
    "bullet-list",
    "one-liner",
    "mind-map",
    "meme",
  ] as const)(
    "calls buildPrompt with mode '%s' when that mode is requested",
    async (mode) => {
      mockHappyPath();

      await POST(makeRequest({ ...VALID_PAYLOAD, mode }));

      expect(buildPromptMock).toHaveBeenCalledOnce();
      expect(buildPromptMock).toHaveBeenCalledWith(
        expect.objectContaining({ mode }),
      );
    },
  );

  it("rejects an unknown mode with 400 invalid_request", async () => {
    mockAuthenticatedClient();

    const response = await POST(
      makeRequest({ ...VALID_PAYLOAD, mode: "table" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("invalid_request");
  });

  // ── Length mapping ──────────────────────────────────────────────────────────

  it.each([
    [0, "micro"],
    [10, "micro"],
    [19, "micro"],
    [20, "short"],
    [39, "short"],
    [40, "medium"],
    [59, "medium"],
    [60, "long"],
    [79, "long"],
    [80, "extended"],
    [100, "extended"],
  ] as const)(
    "maps length=%i to band '%s' and passes maxTokens to callOpenRouter",
    async (length, expectedBand) => {
      // Use real mapLengthToConfig so the mapping logic is exercised;
      // restore the spy after so other tests use the mock.
      const { mapLengthToConfig: realMapLength } = await vi.importActual<
        typeof import("@/lib/summaries/map-length")
      >("@/lib/summaries/map-length");

      mapLengthToConfigMock.mockImplementation(realMapLength);
      mockHappyPath();
      // Re-apply the length-specific mock on top of mockHappyPath
      mapLengthToConfigMock.mockImplementation(realMapLength);

      await POST(makeRequest({ ...VALID_PAYLOAD, length }));

      expect(mapLengthToConfigMock).toHaveBeenCalledWith(length);

      const lengthConfig = realMapLength(length);
      expect(lengthConfig.band).toBe(expectedBand);

      expect(callOpenRouterMock).toHaveBeenCalledWith(
        expect.objectContaining({ max_tokens: lengthConfig.maxTokens }),
      );
    },
  );

  it("rejects length values outside 0–100 with 400", async () => {
    mockAuthenticatedClient();

    const tooHigh = await POST(
      makeRequest({ ...VALID_PAYLOAD, length: 101 }),
    );
    expect(tooHigh.status).toBe(400);

    const tooLow = await POST(
      makeRequest({ ...VALID_PAYLOAD, length: -1 }),
    );
    expect(tooLow.status).toBe(400);
  });

  it("rejects a non-integer length with 400", async () => {
    mockAuthenticatedClient();

    const response = await POST(
      makeRequest({ ...VALID_PAYLOAD, length: 50.5 }),
    );
    expect(response.status).toBe(400);
  });

  // ── Language lock ───────────────────────────────────────────────────────────

  it("rejects any language other than 'en' with 400", async () => {
    mockAuthenticatedClient();

    const response = await POST(
      makeRequest({ ...VALID_PAYLOAD, language: "fr" }),
    );
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.code).toBe("invalid_request");
  });

  // ── Weak-result handling (additional coverage) ──────────────────────────────

  it("returns 400 weak_results when normalizeResults produces an empty list from non-empty raw results", async () => {
    mockAuthenticatedClient();
    consumeDailyQuotaMock.mockResolvedValue({ allowed: true, requestCount: 1 });
    fetchBraveResultsMock.mockResolvedValue([
      { title: "Low quality", url: "https://a.com", description: "", extra_snippets: [] },
    ]);
    normalizeResultsMock.mockReturnValue([]);
    isWeakResultSetMock.mockReturnValue(true);

    const response = await POST(makeRequest());
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toMatchObject({ code: "weak_results" });
  });

  it("forwards the selected model identifier to callOpenRouter", async () => {
    const model = "minimax/minimax-m2.5:free";
    mockHappyPath();

    await POST(makeRequest({ ...VALID_PAYLOAD, model }));

    expect(callOpenRouterMock).toHaveBeenCalledWith(
      expect.objectContaining({ model }),
    );
  });

  it("includes the mode-specific prompt in the messages passed to callOpenRouter", async () => {
    mockHappyPath();

    await POST(makeRequest({ ...VALID_PAYLOAD, mode: "bullet-list" }));

    expect(callOpenRouterMock).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: expect.arrayContaining([
          expect.objectContaining({ role: "system" }),
          expect.objectContaining({ role: "user" }),
        ]),
      }),
    );
  });
});
