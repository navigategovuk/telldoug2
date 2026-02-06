import { afterEach, describe, expect, it, vi } from "vitest";
import superjson from "superjson";
import { successEnvelope } from "../_shared/envelope";
import { postCreateApplication } from "../../endpoints/applications/create_POST.schema";
import { postUpdateApplication } from "../../endpoints/applications/update_POST.schema";
import { postCreateUploadUrl } from "../../endpoints/documents/create-upload-url_POST.schema";
import { postAttachDocument } from "../../endpoints/documents/attach_POST.schema";
import { postSubmitApplication } from "../../endpoints/applications/submit_POST.schema";
import { getCaseQueue } from "../../endpoints/cases/queue_GET.schema";
import { postUpdateCaseStatus } from "../../endpoints/cases/update-status_POST.schema";
import { getModerationQueue } from "../../endpoints/moderation/queue_GET.schema";
import { postModerationDecision } from "../../endpoints/moderation/decision_POST.schema";

function json(data: unknown, status = 200) {
  return new Response(superjson.stringify(successEnvelope(data)), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("e2e workflow wrappers", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("applicant completes draft, uploads document, and submits", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        json({ application: { id: 101, title: "Housing Need", status: "draft" } })
      )
      .mockResolvedValueOnce(json({ ok: true }))
      .mockResolvedValueOnce(
        json({
          uploadUrl: "/uploads/abc",
          storageKey: "abc",
          expiresInSeconds: 900,
        })
      )
      .mockResolvedValueOnce(json({ documentId: 5001, moderationDecision: "pending_review" }))
      .mockResolvedValueOnce(
        json({ applicationId: 101, status: "submitted", moderationDecision: "approved" })
      );

    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const created = await postCreateApplication({ title: "Housing Need" });
    expect(created.application.id).toBe(101);

    const updated = await postUpdateApplication({
      applicationId: 101,
      title: "Housing Need",
      householdMembers: [{ fullName: "Alex Doe", relationship: "self" }],
      incomeRecords: [{ incomeType: "salary", amount: 1200, frequency: "monthly" }],
    });
    expect(updated.ok).toBe(true);

    const upload = await postCreateUploadUrl({
      applicationId: 101,
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      fileSize: 1024,
    });
    expect(upload.storageKey).toBe("abc");

    const attached = await postAttachDocument({
      applicationId: 101,
      fileName: "proof.pdf",
      mimeType: "application/pdf",
      storageKey: upload.storageKey,
      fileSize: 1024,
    });
    expect(attached.documentId).toBe(5001);

    const submitted = await postSubmitApplication({ applicationId: 101 });
    expect(submitted.status).toBe("submitted");

    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("caseworker reviews queue and updates case", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        json({
          cases: [
            {
              id: 301,
              applicationId: 101,
              status: "in_review",
              priority: "medium",
              slaDueAt: null,
              applicantName: "Alex Doe",
              assignedCaseworkerUserId: 77,
            },
          ],
        })
      )
      .mockResolvedValueOnce(json({ ok: true }));

    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const queue = await getCaseQueue();
    expect(queue.cases[0]?.id).toBe(301);

    const updated = await postUpdateCaseStatus({
      caseFileId: 301,
      status: "needs_info",
      priority: "high",
    });
    expect(updated.ok).toBe(true);
  });

  it("caseworker processes moderation override flow", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        json({
          items: [
            {
              id: 901,
              targetType: "message",
              targetId: "44",
              decision: "pending_review",
              riskScore: 0.77,
              createdAt: new Date().toISOString(),
            },
          ],
        })
      )
      .mockResolvedValueOnce(json({ ok: true }));

    globalThis.fetch = fetchMock as unknown as typeof globalThis.fetch;

    const moderationQueue = await getModerationQueue();
    expect(moderationQueue.items.length).toBe(1);

    const decision = await postModerationDecision({
      moderationItemId: 901,
      decision: "approved",
      reason: "Evidence reviewed",
    });
    expect(decision.ok).toBe(true);
  });
});
