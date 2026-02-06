import React from "react";
import { PasswordRegisterForm } from "../components/PasswordRegisterForm";

export default function ApplyStartPage() {
  return (
    <main style={{ maxWidth: 540, margin: "0 auto", padding: "2rem" }}>
      <h1>Start your housing application</h1>
      <p>Create an account to submit and track your application.</p>
      <PasswordRegisterForm />
    </main>
  );
}
