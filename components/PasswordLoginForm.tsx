import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { useAuth } from "../helpers/useAuth";
import { postLogin } from "../endpoints/auth/login_with_password_POST.schema";
import { postVerifyMfa } from "../endpoints/auth/mfa/verify_POST.schema";
import styles from "./PasswordLoginForm.module.css";

export const PasswordLoginForm: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  const { onLogin } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const navigatePostAuth = (role: "applicant" | "caseworker" | "platform_admin") => {
    if (role === "applicant") {
      navigate("/applicant/dashboard", { replace: true });
      return;
    }
    navigate("/caseworker/queue", { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mfaRequired) {
        const context = await postVerifyMfa({ code: mfaCode });
        onLogin(context);
        navigatePostAuth(context.user.role);
        return;
      }

      const loginResult = await postLogin({ email, password });
      if (loginResult.mfaRequired) {
        setMfaRequired(true);
        return;
      }

      if (!loginResult.context) {
        throw new Error("Invalid login response");
      }

      onLogin(loginResult.context);
      navigatePostAuth(loginResult.context.user.role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} ${className ?? ""}`}>
      {error ? <div className={styles.errorMessage}>{error}</div> : null}

      {!mfaRequired ? (
        <>
          <label className={styles.label}>
            Email
            <Input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isLoading}
              placeholder="you@example.com"
            />
          </label>

          <label className={styles.label}>
            Password
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              placeholder="••••••••"
            />
          </label>
        </>
      ) : (
        <label className={styles.label}>
          MFA Code
          <Input
            type="text"
            autoComplete="one-time-code"
            value={mfaCode}
            onChange={(event) => setMfaCode(event.target.value)}
            disabled={isLoading}
            placeholder="Enter your code"
          />
        </label>
      )}

      <Button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? (
          <span className={styles.loadingText}>
            <Spinner className={styles.spinner} size="sm" />
            {mfaRequired ? "Verifying" : "Signing in"}
          </span>
        ) : mfaRequired ? (
          "Verify MFA"
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
};
