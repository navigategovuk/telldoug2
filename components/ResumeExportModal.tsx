/**
 * ResumeExportModal Component
 * Allows users to preview and export their resume in various formats
 */

import React, { useState, useEffect } from "react";
import { FileText, FileDown, FileType, Eye, CheckCircle, AlertCircle, Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Switch } from "./Switch";
import { Spinner } from "./Spinner";
import { useExportPreview, useDownloadExport } from "../helpers/useExportApi";
import styles from "./ResumeExportModal.module.css";

type ExportFormat = "pdf" | "docx" | "html";

interface FormatOption {
  value: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  available: boolean;
}

const formatOptions: FormatOption[] = [
  {
    value: "pdf",
    label: "PDF",
    description: "Best for sharing",
    icon: FileDown,
    available: true,
  },
  {
    value: "docx",
    label: "Word",
    description: "Editable format",
    icon: FileText,
    available: true,
  },
  {
    value: "html",
    label: "HTML",
    description: "Web format",
    icon: FileType,
    available: true,
  },
];

interface ResumeExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  variantName?: string;
}

export function ResumeExportModal({
  open,
  onOpenChange,
  variantId,
  variantName,
}: ResumeExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("pdf");
  const [includePhoto, setIncludePhoto] = useState(false);
  const [includeContactInfo, setIncludeContactInfo] = useState(true);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Preview query
  const previewQuery = useExportPreview(
    { variantId, format: "html" },
    { enabled: open && !!variantId }
  );

  // Download hook
  const downloadExport = useDownloadExport();

  // Reset success state when modal opens
  useEffect(() => {
    if (open) {
      setDownloadSuccess(false);
    }
  }, [open]);

  const handleDownload = async () => {
    try {
      await downloadExport.download({
        variantId,
        format: selectedFormat,
        options: {
          includePhotos: includePhoto,
          includeLinks: includeContactInfo,
          paperSize: "letter",
          colorScheme: "full",
        },
      });
      setDownloadSuccess(true);
      // Auto-hide success after 3 seconds
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleFormatSelect = (format: ExportFormat) => {
    setSelectedFormat(format);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "600px" }}>
        <DialogHeader>
          <DialogTitle>
            Export Resume {variantName && `- ${variantName}`}
          </DialogTitle>
        </DialogHeader>

        <div className={styles.modalContent}>
          {/* Format Selection */}
          <div className={styles.formatSection}>
            <h3 className={styles.sectionTitle}>Format</h3>
            <div className={styles.formatGrid}>
              {formatOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.formatOption} ${
                      selectedFormat === option.value ? styles.selected : ""
                    }`}
                    onClick={() => handleFormatSelect(option.value)}
                    disabled={!option.available}
                  >
                    <Icon className={styles.formatIcon} />
                    <span className={styles.formatLabel}>{option.label}</span>
                    <span className={styles.formatDescription}>
                      {option.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preview */}
          <div className={styles.previewSection}>
            <div className={styles.previewHeader}>
              <h3 className={styles.sectionTitle}>Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => previewQuery.refetch()}>
                <Eye className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
            <div className={styles.previewContainer}>
              {previewQuery.isLoading && (
                <div className={styles.previewLoading}>
                  <Spinner />
                  <span>Generating preview...</span>
                </div>
              )}
              {previewQuery.isError && (
                <div className={styles.previewError}>
                  <AlertCircle className="w-6 h-6" />
                  <span>Failed to load preview</span>
                  <Button variant="outline" size="sm" onClick={() => previewQuery.refetch()}>
                    Try Again
                  </Button>
                </div>
              )}
              {previewQuery.data?.html && (
                <iframe
                  srcDoc={previewQuery.data.html}
                  className={styles.previewFrame}
                  title="Resume Preview"
                  sandbox="allow-same-origin"
                />
              )}
            </div>
          </div>

          {/* Options */}
          <div className={styles.optionsSection}>
            <h3 className={styles.sectionTitle}>Options</h3>
            <div className={styles.optionRow}>
              <div className={styles.optionLabel}>
                <span className={styles.optionTitle}>Include Photo</span>
                <span className={styles.optionDescription}>
                  Add your profile photo to the resume
                </span>
              </div>
              <Switch
                checked={includePhoto}
                onCheckedChange={setIncludePhoto}
              />
            </div>
            <div className={styles.optionRow}>
              <div className={styles.optionLabel}>
                <span className={styles.optionTitle}>Include Contact Info</span>
                <span className={styles.optionDescription}>
                  Show email, phone, and address
                </span>
              </div>
              <Switch
                checked={includeContactInfo}
                onCheckedChange={setIncludeContactInfo}
              />
            </div>
          </div>
        </div>

        <DialogFooter className={styles.footer}>
          <div className={styles.footerLeft}>
            {downloadSuccess && (
              <div className={styles.successMessage}>
                <CheckCircle className={styles.successIcon} />
                Download started!
              </div>
            )}
          </div>
          <div className={styles.footerActions}>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleDownload}
              disabled={downloadExport.isPending || !variantId}
            >
              {downloadExport.isPending ? (
                <>
                  <Spinner className="w-4 h-4 mr-2" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {formatOptions.find(f => f.value === selectedFormat)?.label}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ResumeExportModal;
