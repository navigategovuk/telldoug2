import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const mocks = vi.hoisted(() => ({
  useCurrentApplication: vi.fn(),
  useCreateApplication: vi.fn(),
  useUpdateApplication: vi.fn(),
  useSubmitApplication: vi.fn(),
  useEligibilityPrecheck: vi.fn(),
  useApplicantProfile: vi.fn(),
  useUpdateApplicantProfile: vi.fn(),
  useDocuments: vi.fn(),
  useCreateUploadUrl: vi.fn(),
  useAttachDocument: vi.fn(),
  useRequestDocumentRecheck: vi.fn(),
  useMessageThread: vi.fn(),
  useSendMessage: vi.fn(),
  useAssistant: vi.fn(),
}));

vi.mock("../../helpers/useApplications", () => ({
  useCurrentApplication: mocks.useCurrentApplication,
  useCreateApplication: mocks.useCreateApplication,
  useUpdateApplication: mocks.useUpdateApplication,
  useSubmitApplication: mocks.useSubmitApplication,
  useEligibilityPrecheck: mocks.useEligibilityPrecheck,
}));

vi.mock("../../helpers/useApplicantProfile", () => ({
  useApplicantProfile: mocks.useApplicantProfile,
  useUpdateApplicantProfile: mocks.useUpdateApplicantProfile,
}));

vi.mock("../../helpers/useDocuments", () => ({
  useDocuments: mocks.useDocuments,
  useCreateUploadUrl: mocks.useCreateUploadUrl,
  useAttachDocument: mocks.useAttachDocument,
  useRequestDocumentRecheck: mocks.useRequestDocumentRecheck,
}));

vi.mock("../../helpers/useMessages", () => ({
  useMessageThread: mocks.useMessageThread,
  useSendMessage: mocks.useSendMessage,
}));

vi.mock("../../helpers/useAssistant", () => ({
  useAssistant: mocks.useAssistant,
}));

import ApplicantApplicationPage from "../../pages/applicant.application";
import ApplicantDocumentsPage from "../../pages/applicant.documents";
import ApplicantMessagesPage from "../../pages/applicant.messages";
import ApplicantAssistantPage from "../../pages/applicant.assistant";
import ApplicantStatusPage from "../../pages/applicant.status";

describe("applicant UX accessibility and trust markers", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.useCurrentApplication.mockReturnValue({
      data: {
        application: {
          id: 101,
          status: "in_review",
          submittedAt: new Date().toISOString(),
        },
        incomeRecords: [{ amount: 1200 }],
        needs: { supportNeeds: "Wheelchair access" },
      },
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    mocks.useCreateApplication.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ application: { id: 101 } }),
      isPending: false,
    });
    mocks.useUpdateApplication.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
    });
    mocks.useSubmitApplication.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        applicationId: 101,
        status: "submitted",
        moderationDecision: "pending_review",
      }),
      isPending: false,
    });
    mocks.useEligibilityPrecheck.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue(undefined),
      isPending: false,
      data: {
        provisionalOutcome: "uncertain",
        confidence: 0.6,
        missingEvidence: ["bank statement"],
        nextSteps: ["upload supporting evidence"],
        label: "AI-assisted precheck, not final authority decision.",
      },
    });

    mocks.useApplicantProfile.mockReturnValue({
      data: { profile: { legalFullName: "Alex Doe", postcode: "SE1 9AA" } },
    });
    mocks.useUpdateApplicantProfile.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ ok: true }),
    });

    mocks.useDocuments.mockReturnValue({
      data: {
        documents: [
          {
            id: 7,
            fileName: "proof.pdf",
            moderationDecision: "pending_review",
            verificationStatus: "needs_recheck",
          },
        ],
      },
    });
    mocks.useCreateUploadUrl.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({ storageKey: "abc" }),
      isPending: false,
    });
    mocks.useAttachDocument.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        documentId: 7,
        moderationDecision: "pending_review",
      }),
      isPending: false,
    });
    mocks.useRequestDocumentRecheck.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    });

    mocks.useMessageThread.mockReturnValue({
      data: {
        messages: [
          {
            id: 1,
            createdAt: new Date().toISOString(),
            body: "Need update",
            moderationDecision: "pending_review",
          },
        ],
      },
    });
    mocks.useSendMessage.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        messageId: 1,
        moderationDecision: "pending_review",
        visibility: "hidden",
      }),
      isPending: false,
    });

    mocks.useAssistant.mockReturnValue({
      content:
        "I cannot provide a final eligibility decision. Please wait for caseworker review. [Policy: Local Allocations Policy]",
      error: null,
      isLoading: false,
      askAssistant: vi.fn().mockResolvedValue(undefined),
    });
  });

  it("renders trust labels and labeled controls in application page", () => {
    const html = renderToStaticMarkup(<ApplicantApplicationPage />);
    expect(html).toContain("AI-assisted precheck is advisory only");
    expect(html).toContain("id=\"application-title\"");
    expect(html).toContain("id=\"application-full-name\"");
    expect(html).toContain("id=\"application-postcode\"");
    expect(html).toContain("id=\"application-income\"");
    expect(html).toContain("id=\"application-support-needs\"");
  });

  it("renders moderation guidance and accessible controls for documents/messages", () => {
    const docsHtml = renderToStaticMarkup(<ApplicantDocumentsPage />);
    expect(docsHtml).toContain("New documents are moderated before caseworker use");
    expect(docsHtml).toContain("id=\"document-file-name\"");
    expect(docsHtml).toContain("Request Recheck");

    const messagesHtml = renderToStaticMarkup(<ApplicantMessagesPage />);
    expect(messagesHtml).toContain("pre-publish moderated before caseworker visibility");
    expect(messagesHtml).toContain("id=\"message-body\"");
  });

  it("renders assistant citation and refusal policy messaging", () => {
    const html = renderToStaticMarkup(<ApplicantAssistantPage />);
    expect(html).toContain("AI-assisted guidance only");
    expect(html).toContain("This response includes a refusal");
    expect(html).toContain("Citations");
    expect(html).toContain("Local Allocations Policy");
  });

  it("renders status tracker moderation decision guide", () => {
    const html = renderToStaticMarkup(<ApplicantStatusPage />);
    expect(html).toContain("Moderation Decision Guide");
    expect(html).toContain("Pending document moderation");
    expect(html).toContain("Pending message moderation");
  });
});
