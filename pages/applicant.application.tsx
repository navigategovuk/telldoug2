import React, { useEffect, useState } from "react";
import {
  useCreateApplication,
  useCurrentApplication,
  useEligibilityPrecheck,
  useSubmitApplication,
  useUpdateApplication,
} from "../helpers/useApplications";
import { useApplicantProfile, useUpdateApplicantProfile } from "../helpers/useApplicantProfile";
import { moderationPresentation, moderationToneColor } from "../helpers/moderationPresentation";

export default function ApplicantApplicationPage() {
  const { data: applicationData, refetch } = useCurrentApplication();
  const { data: profileData } = useApplicantProfile();

  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const submitApplication = useSubmitApplication();
  const runPrecheck = useEligibilityPrecheck();
  const updateProfile = useUpdateApplicantProfile();

  const applicationId = applicationData?.application?.id;

  const [title, setTitle] = useState("Housing Support Application");
  const [fullName, setFullName] = useState("");
  const [postcode, setPostcode] = useState("");
  const [supportNeeds, setSupportNeeds] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("0");
  const [initialized, setInitialized] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [lastSubmissionDecision, setLastSubmissionDecision] = useState<
    "approved" | "pending_review" | "blocked" | null
  >(null);

  useEffect(() => {
    const profile = profileData?.profile;
    const app = applicationData?.application;
    const income = applicationData?.incomeRecords?.[0];
    const needs = applicationData?.needs;

    if (!initialized && (profile || app)) {
      setTitle(app?.title ?? "Housing Support Application");
      setFullName(profile?.legalFullName ?? "");
      setPostcode(profile?.postcode ?? "");
      setSupportNeeds(needs?.supportNeeds ?? "");
      setIncomeAmount(income?.amount ? String(income.amount) : "0");
      setInitialized(true);
    }
  }, [applicationData, initialized, profileData]);

  const hasDraft = Boolean(applicationData?.application);

  const saveDraft = async () => {
    if (!applicationId) return;

    await updateProfile.mutateAsync({
      legalFullName: fullName,
      postcode,
      consentAccepted: true,
    });

    await updateApplication.mutateAsync({
      applicationId,
      title,
      householdMembers: fullName
        ? [
            {
              fullName,
              relationship: "Applicant",
              employmentStatus: "Unknown",
            },
          ]
        : [],
      incomeRecords: [
        {
          incomeType: "Household income",
          amount: incomeAmount,
          frequency: "monthly",
        },
      ],
      needs: {
        supportNeeds,
      },
    });

    setLastSavedAt(new Date());
  };

  useEffect(() => {
    if (!initialized || !applicationId) return;

    const timeoutId = setTimeout(() => {
      void saveDraft();
    }, 1200);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, fullName, postcode, supportNeeds, incomeAmount, initialized, applicationId]);

  const createDraft = async () => {
    const created = await createApplication.mutateAsync({ title });
    await refetch();
    return created.application.id;
  };

  const handleRunPrecheck = async () => {
    let appId = applicationId;
    if (!appId) {
      appId = await createDraft();
    }
    await saveDraft();
    await runPrecheck.mutateAsync({ applicationId: appId });
    await refetch();
  };

  const handleSubmit = async () => {
    let appId = applicationId;
    if (!appId) {
      appId = await createDraft();
    }
    await saveDraft();
    const submitted = await submitApplication.mutateAsync({ applicationId: appId });
    setLastSubmissionDecision(submitted.moderationDecision);
    await refetch();
  };

  const precheck = runPrecheck.data;
  const submissionPresentation = lastSubmissionDecision
    ? moderationPresentation(lastSubmissionDecision, "Submission")
    : null;

  return (
    <div style={{ maxWidth: 920 }}>
      <h1>Application Form</h1>
      <p>Drafts autosave while you edit. Submission is gated by moderation and required evidence.</p>
      <p>
        AI-assisted precheck is advisory only and never a final authority decision.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
        <label htmlFor="application-title">
          Application Title
          <input
            id="application-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label htmlFor="application-full-name">
          Full Name
          <input
            id="application-full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label htmlFor="application-postcode">
          Postcode
          <input
            id="application-postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label htmlFor="application-income">
          Monthly Income (GBP)
          <input
            id="application-income"
            value={incomeAmount}
            onChange={(e) => setIncomeAmount(e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label htmlFor="application-support-needs">
          Support Needs
          <textarea
            id="application-support-needs"
            value={supportNeeds}
            onChange={(e) => setSupportNeeds(e.target.value)}
            rows={4}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 16 }}>
        {!hasDraft ? (
          <button onClick={() => void createDraft()} disabled={createApplication.isPending}>
            Create Draft
          </button>
        ) : null}
        <button onClick={() => void handleRunPrecheck()} disabled={runPrecheck.isPending}>
          Run AI Eligibility Precheck
        </button>
        <button onClick={() => void handleSubmit()} disabled={submitApplication.isPending}>
          Submit Application
        </button>
      </div>

      <p style={{ marginTop: 12 }}>
        Status: <strong>{applicationData?.application?.status ?? "draft not created"}</strong>
      </p>

      <div aria-live="polite" aria-atomic="true">
        {lastSavedAt ? <p>Last autosave: {lastSavedAt.toLocaleTimeString()}</p> : null}
        {submissionPresentation ? (
          <p style={{ color: moderationToneColor(submissionPresentation.tone) }}>
            <strong>{submissionPresentation.label}:</strong> {submissionPresentation.nextStep}
          </p>
        ) : null}
      </div>

      {precheck ? (
        <div style={{ marginTop: 16, padding: 12, border: "1px solid #ccc" }}>
          <h3>AI Precheck Result</h3>
          <p>
            Outcome: <strong>{precheck.provisionalOutcome}</strong> ({Math.round(precheck.confidence * 100)}%)
          </p>
          <p>{precheck.label}</p>
          <p>Missing evidence: {precheck.missingEvidence.join(", ") || "None listed"}</p>
          <p>Next steps: {precheck.nextSteps.join(", ") || "None listed"}</p>
        </div>
      ) : null}
    </div>
  );
}
