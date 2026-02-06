import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { useAddCaseNote, useAssignCase, useCaseDetail, useUpdateCaseStatus } from "../helpers/useCases";

export default function CaseworkerCaseDetailPage() {
  const params = useParams();
  const caseId = Number(params.caseId);

  const { data } = useCaseDetail(caseId);
  const assignCase = useAssignCase();
  const updateStatus = useUpdateCaseStatus(caseId);
  const addNote = useAddCaseNote(caseId);

  const [status, setStatus] = useState("in_review");
  const [priority, setPriority] = useState("medium");
  const [note, setNote] = useState("");

  if (!Number.isFinite(caseId)) {
    return <p>Invalid case ID</p>;
  }

  return (
    <div>
      <h1>Case #{caseId}</h1>
      <p>Application status: {data?.application?.status ?? "-"}</p>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button onClick={() => assignCase.mutate({ caseFileId: caseId })}>Assign to me</button>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="in_review">in_review</option>
          <option value="pending_moderation">pending_moderation</option>
          <option value="needs_info">needs_info</option>
          <option value="closed">closed</option>
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">low</option>
          <option value="medium">medium</option>
          <option value="high">high</option>
          <option value="urgent">urgent</option>
        </select>

        <button
          onClick={() =>
            updateStatus.mutate({
              caseFileId: caseId,
              status,
              priority: priority as any,
            })
          }
        >
          Update Status
        </button>
      </div>

      <h3 style={{ marginTop: 20 }}>Case Notes</h3>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} style={{ width: "100%" }} />
      <button
        onClick={() => {
          addNote.mutate({ caseFileId: caseId, body: note });
          setNote("");
        }}
      >
        Add Note
      </button>

      <ul style={{ marginTop: 16 }}>
        {data?.notes?.map((item) => (
          <li key={item.id}>{item.body}</li>
        ))}
      </ul>

      <h3>Documents</h3>
      <ul>
        {data?.documents?.map((doc) => (
          <li key={doc.id}>{doc.fileName} - {doc.moderationDecision}</li>
        ))}
      </ul>

      <h3>Messages</h3>
      <ul>
        {data?.messages?.map((msg) => (
          <li key={msg.id}>{msg.body} ({msg.moderationDecision})</li>
        ))}
      </ul>
    </div>
  );
}
