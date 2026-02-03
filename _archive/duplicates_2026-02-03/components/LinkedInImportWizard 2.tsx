import { useState, useCallback } from "react";

import { ImportReviewStep } from "./ImportReviewStep";
import { ImportSuccessStep } from "./ImportSuccessStep";
import { ImportUploadStep } from "./ImportUploadStep";
import styles from "./LinkedInImportWizard.module.css";
import { useImportPipeline } from "../helpers/useImportPipeline";

type WizardStep = "upload" | "review" | "success";

interface LinkedInImportWizardProps {
  workspaceId: string;
  onComplete: () => void;
  onClose: () => void;
}

export function LinkedInImportWizard({
  workspaceId,
  onComplete,
  onClose,
}: LinkedInImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");

  const {
    upload: _upload,
    uploadAsync,
    isUploading,
    uploadError,
    uploadResult: _uploadResult,
    sessionId: _sessionId,
    session,
    stagingRecords,
    updateDecisions,
    isUpdating,
    commit: _commit,
    commitAsync,
    isCommitting,
    commitResult,
    reset,
  } = useImportPipeline(workspaceId);

  const handleUpload = useCallback(
    async (file: File, quickImport: boolean) => {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const result = await uploadAsync({
        workspaceId,
        filename: file.name,
        fileData: base64,
        quickImport,
      });

      if (result.success) {
        if (quickImport) {
          // Auto-commit for quick import
          const commitResult = await commitAsync();
          if (commitResult.success) {
            setStep("success");
          }
        } else {
          setStep("review");
        }
      }
    },
    [workspaceId, uploadAsync, commitAsync]
  );

  const handleUpdateDecisions = useCallback(
    (
      updates: Array<{
        stagingRecordId: string;
        userDecision: "create" | "merge" | "skip";
      }>
    ) => {
      updateDecisions({ updates });
    },
    [updateDecisions]
  );

  const handleCommit = useCallback(async () => {
    const result = await commitAsync();
    if (result.success) {
      setStep("success");
    }
  }, [commitAsync]);

  const handleBack = useCallback(() => {
    setStep("upload");
  }, []);

  const handleImportMore = useCallback(() => {
    reset();
    setStep("upload");
  }, [reset]);

  const handleViewImported = useCallback(() => {
    onComplete();
  }, [onComplete]);

  const getStepNumber = (currentStep: WizardStep): number => {
    switch (currentStep) {
      case "upload":
        return 1;
      case "review":
        return 2;
      case "success":
        return 3;
    }
  };

  return (
    <div className={styles.wizard}>
      <div className={styles.header}>
        <h1 className={styles.title}>Import LinkedIn Data</h1>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close import wizard">
          ✕
        </button>
      </div>

      <div className={styles.progress}>
        <div
          className={`${styles.progressStep} ${
            getStepNumber(step) >= 1 ? styles.active : ""
          } ${getStepNumber(step) > 1 ? styles.completed : ""}`}
        >
          <div className={styles.progressDot}>
            {getStepNumber(step) > 1 ? "✓" : "1"}
          </div>
          <span className={styles.progressLabel}>Upload</span>
        </div>
        <div className={styles.progressLine} />
        <div
          className={`${styles.progressStep} ${
            getStepNumber(step) >= 2 ? styles.active : ""
          } ${getStepNumber(step) > 2 ? styles.completed : ""}`}
        >
          <div className={styles.progressDot}>
            {getStepNumber(step) > 2 ? "✓" : "2"}
          </div>
          <span className={styles.progressLabel}>Review</span>
        </div>
        <div className={styles.progressLine} />
        <div
          className={`${styles.progressStep} ${
            getStepNumber(step) >= 3 ? styles.active : ""
          }`}
        >
          <div className={styles.progressDot}>3</div>
          <span className={styles.progressLabel}>Complete</span>
        </div>
      </div>

      <div className={styles.content}>
        {step === "upload" && (
          <ImportUploadStep
            onUpload={handleUpload}
            isUploading={isUploading}
            error={uploadError}
          />
        )}

        {step === "review" && session && (
          <ImportReviewStep
            session={session}
            stagingRecords={stagingRecords}
            onUpdateDecision={handleUpdateDecisions}
            onCommit={handleCommit}
            onBack={handleBack}
            isUpdating={isUpdating}
            isCommitting={isCommitting}
          />
        )}

        {step === "success" && commitResult && (
          <ImportSuccessStep
            committedCount={commitResult.committedCount}
            skippedCount={commitResult.skippedCount}
            mergedCount={commitResult.mergedCount}
            records={commitResult.records}
            onViewImported={handleViewImported}
            onImportMore={handleImportMore}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
