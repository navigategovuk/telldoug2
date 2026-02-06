import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "./Input";
import { Button } from "./Button";
import { Spinner } from "./Spinner";
import { postRegister } from "../endpoints/auth/register_POST.schema";
import { useAuth } from "../helpers/useAuth";
import styles from "./PasswordRegisterForm.module.css";

export const PasswordRegisterForm: React.FC<{ className?: string }> = ({ className }) => {
  const navigate = useNavigate();
  const { onLogin } = useAuth();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const context = await postRegister({
        displayName,
        email,
        password,
      });
      onLogin(context);
      navigate("/applicant/dashboard", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`${styles.form} ${className ?? ""}`}>
      {error ? <div className={styles.errorMessage}>{error}</div> : null}

      <label className={styles.label}>
        Full Name
        <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} disabled={isLoading} />
      </label>

      <label className={styles.label}>
        Email
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
      </label>

      <label className={styles.label}>
        Password
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
      </label>

      <Button type="submit" disabled={isLoading} className={styles.submitButton}>
        {isLoading ? (
          <span className={styles.loadingText}>
            <Spinner size="sm" /> Creating account
          </span>
        ) : (
          "Create account"
        )}
      </Button>
    </form>
  );
};
