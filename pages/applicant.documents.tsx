import React, { useState } from "react";
import {
  useAttachDocument,
  useCreateUploadUrl,
  useDocuments,
  useRequestDocumentRecheck,
} from "../helpers/useDocuments";
import { useCurrentApplication } from "../helpers/useApplications";
import { moderationPresentation, moderationToneColor } from "../helpers/moderationPresentation";

export default function ApplicantDocumentsPage() {
  const { data } = useDocuments();
  const { data: applicationData } = useCurrentApplication();
  const createUploadUrl = useCreateUploadUrl();
  const attachDocument = useAttachDocument();
  const requestRecheck = useRequestDocumentRecheck();

  const [fileName, setFileName] = useState("proof-of-income.pdf");
  const [mimeType, setMimeType] = useState("application/pdf");
  const [fileSize, setFileSize] = useState("204800");
  const [extractedText, setExtractedText] = useState("Monthly payslip showing net income.");
  const [lastDecision, setLastDecision] = useState<"approved" | "pending_review" | "blocked" | null>(
    null
  );

  const handleAttach = async () => {
    const upload = await createUploadUrl.mutateAsync({
      applicationId: applicationData?.application?.id,
      fileName,
      mimeType,
      fileSize: Number(fileSize),
    });

    const attached = await attachDocument.mutateAsync({
      applicationId: applicationData?.application?.id,
      fileName,
      mimeType,
      fileSize: Number(fileSize),
      storageKey: upload.storageKey,
      extractedText,
    });
    setLastDecision(attached.moderationDecision);
  };

  const latest = lastDecision ? moderationPresentation(lastDecision, "Your document") : null;

  return (
    <div style={{ maxWidth: 920 }}>
      <h1>Documents</h1>
      <p>Attach evidence files. New documents are moderated before caseworker use.</p>

      <form
        style={{ display: "grid", gap: 8, maxWidth: 560 }}
        onSubmit={(event) => {
          event.preventDefault();
          void handleAttach();
        }}
      >
        <label htmlFor="document-file-name">
          File Name
          <input
            id="document-file-name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label htmlFor="document-mime-type">
          MIME Type
          <input
            id="document-mime-type"
            value={mimeType}
            onChange={(e) => setMimeType(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label htmlFor="document-file-size">
          File Size (bytes)
          <input
            id="document-file-size"
            value={fileSize}
            onChange={(e) => setFileSize(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>
        <label htmlFor="document-extracted-text">
          Extracted Text (optional)
          <textarea
            id="document-extracted-text"
            value={extractedText}
            onChange={(e) => setExtractedText(e.target.value)}
            rows={3}
          />
        </label>
        <button type="submit" disabled={createUploadUrl.isPending || attachDocument.isPending}>
          Attach Document
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true" style={{ marginTop: 12 }}>
        {createUploadUrl.isPending || attachDocument.isPending ? <p>Uploading document...</p> : null}
        {latest ? (
          <p style={{ color: moderationToneColor(latest.tone) }}>
            <strong>{latest.label}:</strong> {latest.nextStep}
          </p>
        ) : null}
      </div>

      <h3 style={{ marginTop: 20 }}>Uploaded Documents</h3>
      <ul>
        {data?.documents.map((doc) => (
          <li key={doc.id}>
            {doc.fileName} - moderation:{" "}
            {moderationPresentation(doc.moderationDecision, "Document").label} - verification:{" "}
            {doc.verificationStatus}{" "}
            {doc.moderationDecision !== "approved" ? (
              <button
                style={{ marginLeft: 8 }}
                onClick={() =>
                  requestRecheck.mutate({
                    documentId: doc.id,
                    reason: "Applicant requested manual recheck.",
                  })
                }
              >
                Request Recheck
              </button>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
