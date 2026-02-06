import React from "react";
import { useCurrentApplication } from "../helpers/useApplications";
import { useDocuments } from "../helpers/useDocuments";
import { useMessageThread } from "../helpers/useMessages";
import { moderationPresentation } from "../helpers/moderationPresentation";

export default function ApplicantStatusPage() {
  const { data: applicationData } = useCurrentApplication();
  const { data: documentData } = useDocuments();
  const { data: messageData } = useMessageThread(applicationData?.application?.id);

  const app = applicationData?.application;
  const pendingDocuments =
    documentData?.documents.filter((item) => item.moderationDecision === "pending_review").length ?? 0;
  const pendingMessages =
    messageData?.messages.filter((item) => item.moderationDecision === "pending_review").length ?? 0;

  return (
    <div style={{ maxWidth: 920 }}>
      <h1>Status Tracker</h1>
      <p>Your authority applies a strict moderation gate before evidence and messages become visible.</p>
      <p>
        Application status: <strong>{app?.status ?? "No active application"}</strong>
      </p>
      <p>
        Submitted: {app?.submittedAt ? new Date(app.submittedAt as any).toLocaleString() : "Not submitted"}
      </p>
      <p>Uploaded documents: {documentData?.documents.length ?? 0}</p>
      <p>Pending document moderation: {pendingDocuments}</p>
      <p>Pending message moderation: {pendingMessages}</p>

      {app?.missingEvidence ? (
        <div>
          <h3>Missing Evidence</h3>
          <pre>{JSON.stringify(app.missingEvidence, null, 2)}</pre>
        </div>
      ) : null}

      {app?.nextSteps ? (
        <div>
          <h3>Suggested Next Steps</h3>
          <pre>{JSON.stringify(app.nextSteps, null, 2)}</pre>
        </div>
      ) : null}

      <section style={{ marginTop: 16 }}>
        <h3>Moderation Decision Guide</h3>
        <ul>
          <li>Approved: {moderationPresentation("approved", "Content").nextStep}</li>
          <li>Pending Review: {moderationPresentation("pending_review", "Content").nextStep}</li>
          <li>Blocked: {moderationPresentation("blocked", "Content").nextStep}</li>
        </ul>
      </section>
    </div>
  );
}
