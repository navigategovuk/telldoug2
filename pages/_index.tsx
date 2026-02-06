import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../helpers/useAuth";

export default function HomePage() {
  const { authState } = useAuth();

  const dashboardLink =
    authState.type === "authenticated"
      ? authState.context.user.role === "applicant"
        ? "/applicant/dashboard"
        : "/caseworker/queue"
      : "/login";

  return (
    <main style={{ maxWidth: 920, margin: "0 auto", padding: "2rem" }}>
      <h1>AI-Moderated UK Affordable Housing Portal</h1>
      <p>
        Multi-authority housing application and case management, with strict AI moderation and
        policy governance.
      </p>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
        <Link to={dashboardLink}>Go to dashboard</Link>
        <Link to="/apply/start">Start application</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/accessibility">Accessibility</Link>
        <Link to="/support">Support</Link>
      </div>
    </main>
  );
}
