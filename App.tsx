import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GlobalContextProviders } from "./components/_globalContextProviders";
import { ApplicantRoute, CaseworkerRoute } from "./components/ProtectedRoute";
import { DashboardLayout } from "./components/DashboardLayout";

import HomePage from "./pages/_index";
import LoginPage from "./pages/login";
import ApplyStartPage from "./pages/apply.start";
import PrivacyPage from "./pages/privacy";
import AccessibilityPage from "./pages/accessibility";
import SupportPage from "./pages/support";

import ApplicantDashboardPage from "./pages/applicant.dashboard";
import ApplicantApplicationPage from "./pages/applicant.application";
import ApplicantDocumentsPage from "./pages/applicant.documents";
import ApplicantMessagesPage from "./pages/applicant.messages";
import ApplicantAssistantPage from "./pages/applicant.assistant";
import ApplicantStatusPage from "./pages/applicant.status";

import CaseworkerQueuePage from "./pages/caseworker.queue";
import CaseworkerCaseDetailPage from "./pages/caseworker.case.$caseId";
import CaseworkerModerationPage from "./pages/caseworker.moderation";
import CaseworkerPoliciesPage from "./pages/caseworker.policies";
import CaseworkerReportsPage from "./pages/caseworker.reports";

import "./base.css";

function ApplicantShell({ children }: { children: React.ReactNode }) {
  return (
    <ApplicantRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </ApplicantRoute>
  );
}

function CaseworkerShell({ children }: { children: React.ReactNode }) {
  return (
    <CaseworkerRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </CaseworkerRoute>
  );
}

function NotFound() {
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Not Found</h1>
      <p>The requested page does not exist.</p>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <GlobalContextProviders>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/apply/start" element={<ApplyStartPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/support" element={<SupportPage />} />

          <Route
            path="/applicant/dashboard"
            element={
              <ApplicantShell>
                <ApplicantDashboardPage />
              </ApplicantShell>
            }
          />
          <Route
            path="/applicant/application"
            element={
              <ApplicantShell>
                <ApplicantApplicationPage />
              </ApplicantShell>
            }
          />
          <Route
            path="/applicant/documents"
            element={
              <ApplicantShell>
                <ApplicantDocumentsPage />
              </ApplicantShell>
            }
          />
          <Route
            path="/applicant/messages"
            element={
              <ApplicantShell>
                <ApplicantMessagesPage />
              </ApplicantShell>
            }
          />
          <Route
            path="/applicant/assistant"
            element={
              <ApplicantShell>
                <ApplicantAssistantPage />
              </ApplicantShell>
            }
          />
          <Route
            path="/applicant/status"
            element={
              <ApplicantShell>
                <ApplicantStatusPage />
              </ApplicantShell>
            }
          />

          <Route
            path="/caseworker/queue"
            element={
              <CaseworkerShell>
                <CaseworkerQueuePage />
              </CaseworkerShell>
            }
          />
          <Route
            path="/caseworker/case/:caseId"
            element={
              <CaseworkerShell>
                <CaseworkerCaseDetailPage />
              </CaseworkerShell>
            }
          />
          <Route
            path="/caseworker/moderation"
            element={
              <CaseworkerShell>
                <CaseworkerModerationPage />
              </CaseworkerShell>
            }
          />
          <Route
            path="/caseworker/policies"
            element={
              <CaseworkerShell>
                <CaseworkerPoliciesPage />
              </CaseworkerShell>
            }
          />
          <Route
            path="/caseworker/reports"
            element={
              <CaseworkerShell>
                <CaseworkerReportsPage />
              </CaseworkerShell>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </GlobalContextProviders>
    </BrowserRouter>
  );
}
