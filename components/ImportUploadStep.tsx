import { useCallback, useState } from "react";
import styles from "./ImportUploadStep.module.css";
import { Button } from "./Button";

interface ImportUploadStepProps {
  onUpload: (file: File, quickImport: boolean) => Promise<void>;
  isUploading: boolean;
  error?: Error | null;
}

export function ImportUploadStep({
  onUpload,
  isUploading,
  error,
}: ImportUploadStepProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [quickImport, setQuickImport] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (isValidFile(file)) {
        setSelectedFile(file);
      }
    }
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        if (isValidFile(file)) {
          setSelectedFile(file);
        }
      }
    },
    []
  );

  const handleUpload = useCallback(async () => {
    if (selectedFile) {
      await onUpload(selectedFile, quickImport);
    }
  }, [selectedFile, quickImport, onUpload]);

  const isValidFile = (file: File): boolean => {
    const validTypes = [
      "application/zip",
      "application/x-zip-compressed",
      "text/csv",
    ];
    const validExtensions = [".zip", ".csv"];
    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidType || hasValidExtension;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {return `${bytes} B`;}
    if (bytes < 1024 * 1024) {return `${(bytes / 1024).toFixed(1)} KB`;}
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Import Your LinkedIn Data</h2>
        <p className={styles.description}>
          Upload your LinkedIn data export to import your career history,
          skills, connections, and achievements.
        </p>
      </div>

      <div
        className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""} ${
          selectedFile ? styles.hasFile : ""
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {selectedFile ? (
          <div className={styles.selectedFile}>
            <div className={styles.fileIcon}>
              {selectedFile.name.endsWith(".zip") ? "📦" : "📄"}
            </div>
            <div className={styles.fileInfo}>
              <span className={styles.fileName}>{selectedFile.name}</span>
              <span className={styles.fileSize}>
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            <button
              className={styles.clearButton}
              onClick={() => setSelectedFile(null)}
              disabled={isUploading}
            >
              ✕
            </button>
          </div>
        ) : (
          <>
            <div className={styles.dropIcon}>📥</div>
            <p className={styles.dropText}>
              Drag and drop your LinkedIn export here
            </p>
            <p className={styles.dropSubtext}>or</p>
            <label className={styles.fileInputLabel}>
              Browse Files
              <input
                type="file"
                accept=".zip,.csv"
                onChange={handleFileChange}
                className={styles.fileInput}
              />
            </label>
          </>
        )}
      </div>

      <div className={styles.options}>
        <label className={styles.optionLabel}>
          <input
            type="checkbox"
            checked={quickImport}
            onChange={(e) => setQuickImport(e.target.checked)}
            disabled={isUploading}
          />
          <span className={styles.optionText}>
            Quick Import
            <span className={styles.optionDescription}>
              Skip review and import all records immediately
            </span>
          </span>
        </label>
      </div>

      {error && (
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span className={styles.errorText}>{error.message}</span>
        </div>
      )}

      <div className={styles.actions}>
        <Button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          variant="primary"
        >
          {isUploading ? "Uploading..." : "Upload and Parse"}
        </Button>
      </div>

      <div className={styles.instructions}>
        <h3 className={styles.instructionsTitle}>
          How to export your LinkedIn data
        </h3>
        <ol className={styles.instructionsList}>
          <li>Go to LinkedIn Settings &amp; Privacy</li>
          <li>Select "Get a copy of your data"</li>
          <li>Choose the data you want to export</li>
          <li>Request the archive and wait for the email</li>
          <li>Download and upload the ZIP file here</li>
        </ol>
        <p className={styles.supportedFormats}>
          <strong>Supported formats:</strong> LinkedIn ZIP export, CSV files
        </p>
      </div>
    </div>
  );
}
