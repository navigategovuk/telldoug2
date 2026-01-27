import React, { useState, useCallback } from "react";
import { Helmet } from "react-helmet";
import { Upload, FileText, CheckCircle, AlertCircle, RefreshCw, ArrowRight, Package } from "lucide-react";
import { FileDropzone } from "../components/FileDropzone";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
// Skeleton available if needed for loading states
import { LinkedInImportWizard } from "../components/LinkedInImportWizard";
import { useLinkedInImport } from "../helpers/useImportApi";
import { useWorkspaceContext } from "../helpers/WorkspaceContext";
import { toast } from "sonner";
import styles from "./import.module.css";

type ImportMode = "select" | "wizard" | "legacy";

export default function ImportPage() {
  const [mode, setMode] = useState<ImportMode>("select");
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  
  const { workspace } = useWorkspaceContext();
  const workspaceId = workspace?.id;
  const importMutation = useLinkedInImport();

  const handleFileSelect = useCallback((files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setCsvContent(text);
        
        // Simple preview parsing
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 0) {
          // Basic CSV split for preview (not robust for quotes but good enough for preview)
          const headerRow = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
          setHeaders(headerRow);
          
          const preview = lines.slice(1, 6).map(line => {
            // Very basic split, visual only
            return line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          });
          setPreviewRows(preview);

          // Client-side detection hint
          if (headerRow.includes("Connected On")) {setDetectedType("Connections");}
          else if (headerRow.includes("Endorser First Name")) {setDetectedType("Endorsements");}
          else if (headerRow.includes("School Name")) {setDetectedType("Education");}
          else if (headerRow.includes("Authority")) {setDetectedType("Certifications");}
          else if (headerRow.includes("Company Name")) {setDetectedType("Positions");}
          else if (headerRow.length === 1 && headerRow[0] === "Name") {setDetectedType("Skills");}
          else {setDetectedType("Unknown");}
        }
      };
      reader.readAsText(selectedFile);
    }
  }, []);

  const handleImport = () => {
    if (!csvContent || !file) {return;}

    importMutation.mutate({
      csvData: csvContent,
      fileName: file.name
    }, {
      onSuccess: (data) => {
        if (data.errors.length > 0) {
          toast.error("Import completed with some errors");
        } else {
          toast.success("Import completed successfully");
        }
      },
      onError: (error) => {
        toast.error(`Import failed: ${error.message}`);
      }
    });
  };

  const reset = () => {
    setFile(null);
    setCsvContent(null);
    setPreviewRows([]);
    setHeaders([]);
    setDetectedType(null);
    importMutation.reset();
    setMode("select");
  };

  const handleWizardComplete = () => {
    toast.success("Import completed successfully!");
    setMode("select");
  };

  const handleWizardClose = () => {
    setMode("select");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) {return '0 Bytes';}
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Import Data | TellDoug</title>
      </Helmet>

      {mode === "wizard" && workspaceId && (
        <LinkedInImportWizard
          workspaceId={workspaceId}
          onComplete={handleWizardComplete}
          onClose={handleWizardClose}
        />
      )}

      {mode === "select" && (
        <>
          <header className={styles.header}>
            <div>
              <h1 className={styles.title}>Import Data</h1>
              <p className={styles.subtitle}>Bring your career history into TellDoug from LinkedIn.</p>
            </div>
          </header>

          <div className={styles.content}>
            <div className={styles.modeSelection}>
              <button
                className={styles.modeCard}
                onClick={() => setMode("wizard")}
              >
                <div className={styles.modeIcon}>
                  <Package size={48} />
                </div>
                <h3 className={styles.modeTitle}>ZIP Export Import</h3>
                <p className={styles.modeDescription}>
                  Upload your complete LinkedIn data export (ZIP file) with duplicate detection, 
                  record preview, and the ability to review before importing.
                </p>
                <Badge variant="default">Recommended</Badge>
              </button>

              <button
                className={styles.modeCard}
                onClick={() => setMode("legacy")}
              >
                <div className={styles.modeIcon}>
                  <FileText size={48} />
                </div>
                <h3 className={styles.modeTitle}>Single CSV Import</h3>
                <p className={styles.modeDescription}>
                  Quick import of individual CSV files from LinkedIn. Best for single file 
                  updates like new connections or certifications.
                </p>
                <Badge variant="secondary">Quick</Badge>
              </button>
            </div>

            <div className={styles.instructionsCard}>
              <h3 className={styles.cardTitle}>How to export from LinkedIn</h3>
              <ol className={styles.stepsList}>
                <li>Go to LinkedIn <strong>Settings & Privacy</strong></li>
                <li>Select <strong>Data Privacy</strong> in the sidebar</li>
                <li>Click on <strong>Get a copy of your data</strong></li>
                <li>Select the specific data files you want (Connections, Education, Skills, etc.)</li>
                <li>Wait for the email from LinkedIn and download the archive</li>
                <li>Upload the ZIP file or individual CSV files above</li>
              </ol>
            </div>
          </div>
        </>
      )}

      {mode === "legacy" && (
        <>
          <header className={styles.header}>
            <div>
              <Button variant="ghost" onClick={() => setMode("select")} className={styles.backButton}>
                ← Back
              </Button>
              <h1 className={styles.title}>Single CSV Import</h1>
              <p className={styles.subtitle}>Quick import of individual LinkedIn CSV files.</p>
            </div>
          </header>

      {!importMutation.isSuccess ? (
        <div className={styles.content}>
          {!file ? (
            <>
              <div className={styles.instructionsCard}>
                <h3 className={styles.cardTitle}>How to export from LinkedIn</h3>
                <ol className={styles.stepsList}>
                  <li>Go to LinkedIn <strong>Settings & Privacy</strong></li>
                  <li>Select <strong>Data Privacy</strong> in the sidebar</li>
                  <li>Click on <strong>Get a copy of your data</strong></li>
                  <li>Select the specific data files you want (Connections, Education, Skills, etc.)</li>
                  <li>Wait for the email from LinkedIn and download the archive</li>
                  <li>Upload the individual CSV files below</li>
                </ol>
              </div>

              <FileDropzone
                accept=".csv"
                maxFiles={1}
                onFilesSelected={handleFileSelect}
                title="Upload LinkedIn CSV"
                subtitle="Supports Connections, Education, Skills, Positions, Certifications"
                icon={<Upload size={48} />}
                className={styles.dropzone}
              />
            </>
          ) : (
            <div className={styles.previewContainer}>
              <div className={styles.fileInfo}>
                <div className={styles.fileMeta}>
                  <FileText size={32} className={styles.fileIcon} />
                  <div>
                    <div className={styles.fileName}>{file.name}</div>
                    <div className={styles.fileSize}>{formatFileSize(file.size)}</div>
                  </div>
                </div>
                <div className={styles.detectionBadge}>
                  {detectedType === "Unknown" ? (
                    <Badge variant="warning">Unknown Type</Badge>
                  ) : (
                    <Badge variant="success">{detectedType} Detected</Badge>
                  )}
                </div>
              </div>

              {detectedType === "Unknown" && (
                <div className={styles.warningBox}>
                  <AlertCircle size={20} />
                  <p>We couldn't automatically detect the type of this file. You can still try to import it, but it might fail if the format isn't recognized.</p>
                </div>
              )}

              <div className={styles.tableWrapper}>
                <table className={styles.previewTable}>
                  <thead>
                    <tr>
                      {headers.map((h, i) => (
                        <th key={i}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i}>
                        {row.map((cell, j) => (
                          <td key={j}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.tableFooter}>
                  Showing first {previewRows.length} rows
                </div>
              </div>

              <div className={styles.actions}>
                <Button variant="outline" onClick={reset} disabled={importMutation.isPending}>
                  Cancel
                </Button>
                <Button onClick={handleImport} disabled={importMutation.isPending}>
                  {importMutation.isPending ? "Importing..." : "Import Data"}
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.successContainer}>
          <div className={styles.successHeader}>
            <div className={styles.successIconWrapper}>
              <CheckCircle size={48} className={styles.successIcon} />
            </div>
            <h2>Import Complete</h2>
            <p>Your data has been successfully processed.</p>
          </div>

          <div className={styles.statsGrid}>
            {importMutation.data.imported.length > 0 ? (
              importMutation.data.imported.map((item, i) => (
                <div key={i} className={styles.statCard}>
                  <div className={styles.statValue}>{item.count}</div>
                  <div className={styles.statLabel}>{item.entity}</div>
                </div>
              ))
            ) : (
              <div className={styles.emptyStat}>No new records were imported (duplicates skipped).</div>
            )}
            <div className={styles.statCard}>
              <div className={styles.statValue}>{importMutation.data.skipped}</div>
              <div className={styles.statLabel}>Skipped / Duplicates</div>
            </div>
          </div>

          {importMutation.data.errors.length > 0 && (
            <div className={styles.errorList}>
              <h4>Errors encountered:</h4>
              <ul>
                {importMutation.data.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.successActions}>
            <Button onClick={reset} size="lg">
              <RefreshCw size={18} /> Import Another File
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href="/dashboard">Go to Dashboard <ArrowRight size={18} /></a>
            </Button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
