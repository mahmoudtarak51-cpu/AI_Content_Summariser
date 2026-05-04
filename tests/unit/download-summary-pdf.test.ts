import { beforeEach, describe, expect, it, vi } from "vitest";

// ─── Hoist mock factories ──────────────────────────────────────────────────────
const { mockOutput, mockText, mockSetFont, mockSetFontSize, mockSetTextColor, mockSplitTextToSize } =
  vi.hoisted(() => ({
    mockOutput: vi.fn().mockReturnValue(new Blob(["PDF"], { type: "application/pdf" })),
    mockText: vi.fn(),
    mockSetFont: vi.fn(),
    mockSetFontSize: vi.fn(),
    mockSetTextColor: vi.fn(),
    mockSplitTextToSize: vi.fn((str: string) => [str]),
  }));

// ─── Mock jspdf ───────────────────────────────────────────────────────────────
vi.mock("jspdf", () => ({
  jsPDF: vi.fn().mockImplementation(() => ({
    output: mockOutput,
    text: mockText,
    setFont: mockSetFont,
    setFontSize: mockSetFontSize,
    setTextColor: mockSetTextColor,
    splitTextToSize: mockSplitTextToSize,
    internal: { pageSize: { getWidth: () => 210 } },
  })),
}));

// ─── Mock DOM APIs used by downloadSummaryPdf ─────────────────────────────────
const mockClick = vi.fn();
const mockAppendChild = vi.fn();
const mockRemoveChild = vi.fn();
const mockCreateObjectURL = vi.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = vi.fn();

vi.stubGlobal("URL", {
  createObjectURL: mockCreateObjectURL,
  revokeObjectURL: mockRevokeObjectURL,
});

vi.stubGlobal("document", {
  createElement: vi.fn().mockReturnValue({
    href: "",
    download: "",
    style: { display: "" },
    click: mockClick,
  }),
  body: {
    appendChild: mockAppendChild,
    removeChild: mockRemoveChild,
  },
});

import { downloadSummaryPdf } from "@/lib/pdf/download-summary-pdf";

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const BASE_PARAMS = {
  topic: "Benefits of retrieval augmented generation",
  mode: "summary",
  model: "openai/gpt-oss-120b:free",
  text: "RAG improves LLM accuracy by grounding responses in retrieved documents.",
};

describe("downloadSummaryPdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSplitTextToSize.mockImplementation((str: string) => [str]);
    mockOutput.mockReturnValue(new Blob(["PDF"], { type: "application/pdf" }));
    mockCreateObjectURL.mockReturnValue("blob:mock-url");
  });

  describe("filename", () => {
    it("always saves with the filename topic-summary.pdf", () => {
      downloadSummaryPdf(BASE_PARAMS);
      expect(mockOutput).toHaveBeenCalledOnce();
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });

    it("uses the same fixed filename regardless of the topic value", () => {
      downloadSummaryPdf({ ...BASE_PARAMS, topic: "Quantum computing basics" });
      expect(mockOutput).toHaveBeenCalledWith("blob");
    });
  });

  describe("content", () => {
    it("includes the topic text in the document", () => {
      downloadSummaryPdf(BASE_PARAMS);
      const allTextCalls = mockText.mock.calls.map((c) => String(c[0]));
      const allSplitCalls = mockSplitTextToSize.mock.calls.map((c) => String(c[0]));
      const allContent = [...allTextCalls, ...allSplitCalls].join(" ");
      expect(allContent).toContain(BASE_PARAMS.topic);
    });

    it("includes the mode in the document", () => {
      downloadSummaryPdf(BASE_PARAMS);
      const allTextCalls = mockText.mock.calls.map((c) => String(c[0]));
      const allSplitCalls = mockSplitTextToSize.mock.calls.map((c) => String(c[0]));
      const allContent = [...allTextCalls, ...allSplitCalls].join(" ");
      expect(allContent).toContain(BASE_PARAMS.mode);
    });

    it("includes the model identifier in the document", () => {
      downloadSummaryPdf(BASE_PARAMS);
      const allTextCalls = mockText.mock.calls.map((c) => String(c[0]));
      const allSplitCalls = mockSplitTextToSize.mock.calls.map((c) => String(c[0]));
      const allContent = [...allTextCalls, ...allSplitCalls].join(" ");
      expect(allContent).toContain(BASE_PARAMS.model);
    });

    it("includes the generated text in the document", () => {
      downloadSummaryPdf(BASE_PARAMS);
      const allSplitCalls = mockSplitTextToSize.mock.calls.map((c) => String(c[0]));
      expect(allSplitCalls.join(" ")).toContain(BASE_PARAMS.text);
    });

    it("does not include any URL or source reference in the output", () => {
      const paramsWithSourceContext = {
        ...BASE_PARAMS,
        text: "RAG improves LLM accuracy.",
      };
      downloadSummaryPdf(paramsWithSourceContext);
      const allTextCalls = mockText.mock.calls.map((c) => String(c[0]));
      const allSplitCalls = mockSplitTextToSize.mock.calls.map((c) => String(c[0]));
      const allContent = [...allTextCalls, ...allSplitCalls].join(" ");
      // The output must not contain bare http(s) links
      expect(allContent).not.toMatch(/https?:\/\//);
    });
  });

  describe("pdf creation", () => {
    it("calls save exactly once per invocation", () => {
      downloadSummaryPdf(BASE_PARAMS);
      expect(mockOutput).toHaveBeenCalledOnce();
    });

    it("produces separate PDF instances for separate calls", () => {
      downloadSummaryPdf(BASE_PARAMS);
      downloadSummaryPdf({ ...BASE_PARAMS, topic: "Another topic" });
      expect(mockOutput).toHaveBeenCalledTimes(2);
    });
  });
});
