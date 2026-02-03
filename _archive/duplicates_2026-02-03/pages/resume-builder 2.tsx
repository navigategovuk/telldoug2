/**
 * Resume Builder Page
 * Main interface for creating and managing resume variants
 */

import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { FileText, Download, Share2, Eye, RefreshCw } from "lucide-react";
import { Button } from "../components/Button";
import { Spinner } from "../components/Spinner";
import { ResumeVariantSwitcher } from "../components/ResumeVariantSwitcher";
import { ResumeProfileEditor } from "../components/ResumeProfileEditor";
import { ResumeExportModal } from "../components/ResumeExportModal";
import { ResumeShareDialog } from "../components/ResumeShareDialog";
import { useProfile } from "../helpers/useProfileApi";
import { useVariants } from "../helpers/useVariantsApi";
import { useExportPreview } from "../helpers/useExportApi";
import styles from "./resume-builder.module.css";

export default function ResumeBuilderPage() {
  // Get the user's profile (assuming there's a default one)
  const profileQuery = useProfile();
  // Profile data includes: profile, work, education, skills, projects
  const profileId = profileQuery.data?.profile?.id ?? undefined;

  // Get variants for the profile
  const variantsQuery = useVariants({ profileId }, { enabled: !!profileId });

  // Track selected variant
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();

  // Set default variant when variants load
  useEffect(() => {
    if (variantsQuery.data?.variants && !selectedVariantId) {
      const primaryVariant = variantsQuery.data.variants.find(v => v.isPrimary);
      if (primaryVariant) {
        setSelectedVariantId(primaryVariant.id);
      } else if (variantsQuery.data.variants.length > 0) {
        setSelectedVariantId(variantsQuery.data.variants[0].id);
      }
    }
  }, [variantsQuery.data?.variants, selectedVariantId]);

  // Get selected variant details
  const selectedVariant = variantsQuery.data?.variants?.find(v => v.id === selectedVariantId);

  // Preview query
  const previewQuery = useExportPreview(
    { variantId: selectedVariantId || "", format: "html" },
    { enabled: !!selectedVariantId }
  );

  // Modal states
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Loading state
  const isLoading = profileQuery.isLoading || variantsQuery.isLoading;

  if (isLoading) {
    return (
      <>
        <Helmet>
          <title>Resume Builder - TellDoug</title>
        </Helmet>
        <div className={styles.pageContainer}>
          <div className={styles.loadingContainer}>
            <Spinner />
          </div>
        </div>
      </>
    );
  }

  if (!profileId) {
    return (
      <>
        <Helmet>
          <title>Resume Builder - TellDoug</title>
        </Helmet>
        <div className={styles.pageContainer}>
          <div className={styles.emptyState}>
            <FileText className={styles.emptyIcon} />
            <h2 className={styles.emptyTitle}>No Profile Found</h2>
            <p className={styles.emptyText}>
              You need to create a profile first to build your resume.
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Resume Builder - TellDoug</title>
        <meta name="description" content="Build and customize your professional resume" />
      </Helmet>

      <div className={styles.pageContainer}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.titleSection}>
              <h1 className={styles.title}>Resume Builder</h1>
              <p className={styles.subtitle}>
                Customize your resume for different job applications
              </p>
            </div>

            <div className={styles.headerActions}>
              <ResumeVariantSwitcher
                profileId={profileId}
                selectedVariantId={selectedVariantId}
                onVariantChange={setSelectedVariantId}
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className={styles.quickActions}>
            <span className={styles.quickActionsLabel}>Quick Actions</span>
            <span className={styles.quickActionsDivider} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportModalOpen(true)}
              disabled={!selectedVariantId}
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShareDialogOpen(true)}
              disabled={!selectedVariantId}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Editor Panel */}
          <div className={styles.editorPanel}>
            <ResumeProfileEditor profileId={profileId} />
          </div>

          {/* Preview Panel */}
          <div className={styles.previewPanel}>
            <div className={styles.previewCard}>
              <div className={styles.previewHeader}>
                <span className={styles.previewTitle}>Preview</span>
                <div className={styles.previewActions}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => previewQuery.refetch()}
                    disabled={previewQuery.isFetching}
                  >
                    <RefreshCw className={`w-4 h-4 ${previewQuery.isFetching ? "animate-spin" : ""}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // Open preview in new tab
                      if (previewQuery.data?.html) {
                        const blob = new Blob([previewQuery.data.html], { type: "text/html" });
                        const url = URL.createObjectURL(blob);
                        window.open(url, "_blank");
                      }
                    }}
                    disabled={!previewQuery.data?.html}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className={styles.previewContainer}>
                {previewQuery.isLoading ? (
                  <div className={styles.previewLoading}>
                    <Spinner />
                    <span>Loading preview...</span>
                  </div>
                ) : previewQuery.isError ? (
                  <div className={styles.previewError}>
                    <FileText className="w-8 h-8" />
                    <span>Unable to load preview</span>
                    <Button variant="outline" size="sm" onClick={() => previewQuery.refetch()}>
                      Try Again
                    </Button>
                  </div>
                ) : previewQuery.data?.html ? (
                  <iframe
                    srcDoc={previewQuery.data.html}
                    className={styles.previewFrame}
                    title="Resume Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className={styles.previewError}>
                    <FileText className="w-8 h-8" />
                    <span>Select a variant to preview</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ResumeExportModal
        open={exportModalOpen}
        onOpenChange={setExportModalOpen}
        variantId={selectedVariantId || ""}
        variantName={selectedVariant?.name}
      />

      {/* Share Dialog */}
      <ResumeShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        variantId={selectedVariantId || ""}
        variantName={selectedVariant?.name}
      />
    </>
  );
}
