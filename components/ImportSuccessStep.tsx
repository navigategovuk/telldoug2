import styles from "./ImportSuccessStep.module.css";
import { Button } from "./Button";
import { CommittedRecord } from "../endpoints/import/commit_POST.schema";
import { entityTypeLabels } from "../helpers/useImportPipeline";

interface ImportSuccessStepProps {
  committedCount: number;
  skippedCount: number;
  mergedCount: number;
  records: CommittedRecord[];
  onViewImported: () => void;
  onImportMore: () => void;
  onClose: () => void;
}

export function ImportSuccessStep({
  committedCount,
  skippedCount,
  mergedCount,
  records,
  onViewImported,
  onImportMore,
  onClose,
}: ImportSuccessStepProps) {
  // Group records by entity type
  const recordsByType = records.reduce(
    (acc, record) => {
      if (record.action !== "skipped") {
        const type = record.entityType;
        if (!acc[type]) {acc[type] = [];}
        acc[type].push(record);
      }
      return acc;
    },
    {} as Record<string, CommittedRecord[]>
  );

  const totalImported = committedCount + mergedCount;

  return (
    <div className={styles.container}>
      <div className={styles.successIcon}>✅</div>

      <h2 className={styles.title}>Import Complete!</h2>

      <p className={styles.description}>
        Your LinkedIn data has been successfully imported into TellDoug.
      </p>

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{committedCount}</span>
          <span className={styles.statLabel}>Records Created</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{mergedCount}</span>
          <span className={styles.statLabel}>Records Merged</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNumber}>{skippedCount}</span>
          <span className={styles.statLabel}>Records Skipped</span>
        </div>
      </div>

      {totalImported > 0 && (
        <div className={styles.breakdown}>
          <h3 className={styles.breakdownTitle}>Import Summary</h3>
          <div className={styles.breakdownList}>
            {Object.entries(recordsByType).map(([type, typeRecords]) => {
              const entityInfo = entityTypeLabels[type] || {
                label: type,
                icon: "📄",
              };
              const created = typeRecords.filter(
                (r) => r.action === "created"
              ).length;
              const merged = typeRecords.filter(
                (r) => r.action === "merged"
              ).length;

              return (
                <div key={type} className={styles.breakdownItem}>
                  <span className={styles.breakdownIcon}>
                    {entityInfo.icon}
                  </span>
                  <span className={styles.breakdownLabel}>
                    {entityInfo.label}s
                  </span>
                  <span className={styles.breakdownCount}>
                    {created > 0 && <span>{created} created</span>}
                    {created > 0 && merged > 0 && <span>, </span>}
                    {merged > 0 && <span>{merged} merged</span>}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className={styles.nextSteps}>
        <h3 className={styles.nextStepsTitle}>What's Next?</h3>
        <ul className={styles.nextStepsList}>
          <li>Review your imported jobs in the Career History section</li>
          <li>Check your skills and add proficiency levels</li>
          <li>Connect with your imported network contacts</li>
          <li>Update any merged records with additional details</li>
        </ul>
      </div>

      <div className={styles.actions}>
        <Button variant="primary" onClick={onViewImported}>
          View Imported Data
        </Button>
        <Button variant="secondary" onClick={onImportMore}>
          Import More Data
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
