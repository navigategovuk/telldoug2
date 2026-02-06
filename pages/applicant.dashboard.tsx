import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";
import { useCurrentApplication } from "../helpers/useApplications";

export default function ApplicantDashboardPage() {
  const { authState } = useAuth();
  const { data } = useCurrentApplication();

  if (authState.type !== "authenticated") {
    return null;
  }

  return (
    <div>
      <h1>Applicant Dashboard</h1>
      <p>Welcome, {authState.context.user.displayName}.</p>
      <p>AI features on this portal are assistive only and never final authority decisions.</p>
      <p>
        Active organization: <strong>{authState.context.activeOrganizationId}</strong>
      </p>
      <p>
        Current application status: <strong>{data?.application?.status ?? "No draft yet"}</strong>
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        <Link to="/applicant/application">Application form</Link>
        <Link to="/applicant/documents">Documents</Link>
        <Link to="/applicant/messages">Messages</Link>
        <Link to="/applicant/assistant">AI assistant</Link>
        <Link to="/applicant/status">Status tracker</Link>
      </div>
    </div>
  );
}
