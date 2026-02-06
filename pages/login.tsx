import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordLoginForm } from "../components/PasswordLoginForm";
import { useAuth } from "../helpers/useAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { authState } = useAuth();

  useEffect(() => {
    if (authState.type !== "authenticated") return;
    if (authState.context.user.role === "applicant") {
      navigate("/applicant/dashboard", { replace: true });
      return;
    }
    navigate("/caseworker/queue", { replace: true });
  }, [authState, navigate]);

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "2rem" }}>
      <h1>Sign in</h1>
      <p>Use your account to access applicant or caseworker tools.</p>
      <PasswordLoginForm />
      <p style={{ marginTop: 16 }}>
        Need an applicant account? <Link to="/apply/start">Create one</Link>
      </p>
    </main>
  );
}
