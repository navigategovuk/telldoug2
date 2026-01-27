import React from "react";
import { Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { useAuth } from "../helpers/useAuth";
import { OAuthButtonGroup } from "../components/OAuthButtonGroup";
import { AuthLoadingState } from "../components/AuthLoadingState";
import styles from "./login.module.css";

export default function LoginPage() {
  const { authState } = useAuth();

  // Handle loading state while checking session
  if (authState.type === "loading") {
    return <AuthLoadingState title="Checking session..." />;
  }

  // Redirect to dashboard if already authenticated
  if (authState.type === "authenticated") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Sign In | TellDoug</title>
        <meta name="description" content="Sign in to your TellDoug account" />
      </Helmet>

      <main className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <div className={styles.logoIcon} />
          </div>
          <h1 className={styles.title}>TellDoug</h1>
          <p className={styles.tagline}>Your career management operating system</p>
        </div>

        <div className={styles.content}>
          <div className={styles.divider}>
            <span className={styles.dividerText}>Sign in with your account</span>
          </div>
          
          <OAuthButtonGroup className={styles.oauthButtons} />
          
          <p className={styles.footerText}>
            By signing in, you agree to our terms of service and privacy policy.
            TellDoug is private by default.
          </p>
        </div>
      </main>

      <div className={styles.backgroundDecoration}>
        <div className={styles.grid} />
      </div>
    </div>
  );
}
