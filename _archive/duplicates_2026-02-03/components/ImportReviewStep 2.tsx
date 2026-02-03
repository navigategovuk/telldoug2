import { useState, useMemo } from "react";

import { Badge } from "./Badge";
import { Button } from "./Button";
import styles from "./ImportReviewStep.module.css";
import {
  categorizeStagingRecords,
  entityTypeLabels,
  getConfidenceBadge,
} from "../helpers/useImportPipeline";

import type {
  StagingRecordResponse,
  ImportSessionResponse,
} from "../endpoints/import/staging_POST.schema";


interface ImportReviewStepProps {
  session: ImportSessionResponse;
  stagingRecords: StagingRecordResponse[];
  onUpdateDecision: (
    updates: Array<{
      stagingRecordId: string;
      userDecision: "create" | "merge" | "skip";
    }>
  ) => void;
  onCommit: () => void;
  onBack: () => void;
  isUpdating: boolean;
  isCommitting: boolean;
}

type FilterType = "all" | "create" | "merge" | "skip" | "duplicates";
type SortType = "type" | "confidence" | "decision";

export function ImportReviewStep({
  session: _session,
  stagingRecords,
  onUpdateDecision,
  onCommit,
  onBack,
  isUpdating,
  isCommitting,
}: ImportReviewStepProps) {
  const [filter, setFilter] = useState<FilterType>("all");
  const [sort, setSort] = useState<SortType>("type");
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(
    new Set()
  );
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );

  const categorized = useMemo(
    () => categorizeStagingRecords(stagingRecords),
    [stagingRecords]
  );

  const filteredRecords = useMemo(() => {
    let records = stagingRecords;

    switch (filter) {
      case "create":
        records = categorized.toCreate;
        break;
      case "merge":
        records = categorized.toMerge;
        break;
      case "skip":
        records = categorized.toSkip;
        break;
      case "duplicates":
        records = [
          ...categorized.byConfidence.exact,
          ...categorized.byConfidence.likely,
          ...categorized.byConfidence.possible,
        ];
        break;
    }

    // Sort records
    return [...records].sort((a, b) => {
      switch (sort) {
        case "type":
          return a.entityMappings.primary.localeCompare(
            b.entityMappings.primary
          );
        case "confidence": {
          const confidenceOrder = { exact: 0, likely: 1, possible: 2, none: 3 };
          const aConf = a.duplicateCheck?.confidence || "none";
          const bConf = b.duplicateCheck?.confidence || "none";
          return confidenceOrder[aConf] - confidenceOrder[bConf];
        }
        case "decision":
          return a.userDecision.localeCompare(b.userDecision);
        default:
          return 0;
      }
    });
  }, [stagingRecords, filter, sort, categorized]);

  const toggleExpanded = (id: string) => {
    setExpandedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedRecords((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedRecords(new Set(filteredRecords.map((r) => r.id)));
  };

  const clearSelection = () => {
    setSelectedRecords(new Set());
  };

  const bulkUpdateDecision = (decision: "create" | "merge" | "skip") => {
    const updates = Array.from(selectedRecords).map((id) => ({
      stagingRecordId: id,
      userDecision: decision,
    }));
    onUpdateDecision(updates);
    clearSelection();
  };

  const getRecordTitle = (record: StagingRecordResponse): string => {
    const data = record.mappedData;
    switch (record.entityMappings.primary) {
      case "job":
        return `${data.title || "Position"} at ${data.company || "Company"}`;
      case "learning":
        return `${data.title || "Degree"} at ${data.institution || "Institution"}`;
      case "skill":
        return (data.name as string) || "Skill";
      case "project":
        return (data.name as string) || "Project";
      case "person":
        return (data.name as string) || "Connection";
      case "achievement":
        return (data.title as string) || "Achievement";
      default:
        return "Record";
    }
  };

  const getRecordSubtitle = (record: StagingRecordResponse): string => {
    const data = record.mappedData;
    if (data.startDate) {
      const start = new Date(data.startDate as string).toLocaleDateString();
      const end = data.endDate
        ? new Date(data.endDate as string).toLocaleDateString()
        : "Present";
      return `${start} - ${end}`;
    }
    return "";
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Review Import</h2>
        <p className={styles.description}>
          Review {stagingRecords.length} records before importing. Records with
          potential duplicates are flagged for your review.
        </p>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{categorized.toCreate.length}</span>
          <span className={styles.summaryLabel}>To Create</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{categorized.toMerge.length}</span>
          <span className={styles.summaryLabel}>To Merge</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>{categorized.toSkip.length}</span>
          <span className={styles.summaryLabel}>To Skip</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryCount}>
            {categorized.byConfidence.exact.length +
              categorized.byConfidence.likely.length}
          </span>
          <span className={styles.summaryLabel}>Duplicates</span>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.filters}>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className={styles.select}
          >
            <option value="all">All Records ({stagingRecords.length})</option>
            <option value="create">
              To Create ({categorized.toCreate.length})
            </option>
            <option value="merge">To Merge ({categorized.toMerge.length})</option>
            <option value="skip">To Skip ({categorized.toSkip.length})</option>
            <option value="duplicates">
              Duplicates (
              {categorized.byConfidence.exact.length +
                categorized.byConfidence.likely.length +
                categorized.byConfidence.possible.length}
              )
            </option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortType)}
            className={styles.select}
          >
            <option value="type">Sort by Type</option>
            <option value="confidence">Sort by Confidence</option>
            <option value="decision">Sort by Decision</option>
          </select>
        </div>

        {selectedRecords.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.selectedCount}>
              {selectedRecords.size} selected
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => bulkUpdateDecision("create")}
              disabled={isUpdating}
            >
              Create All
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => bulkUpdateDecision("skip")}
              disabled={isUpdating}
            >
              Skip All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
            >
              Clear
            </Button>
          </div>
        )}

        {selectedRecords.size === 0 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={selectAll}
          >
            Select All
          </Button>
        )}
      </div>

      <div className={styles.recordsList}>
        {filteredRecords.map((record) => {
          const isExpanded = expandedRecords.has(record.id);
          const isSelected = selectedRecords.has(record.id);
          const entityInfo = entityTypeLabels[record.entityMappings.primary] || {
            label: record.entityMappings.primary,
            icon: "📄",
          };
          const confidenceBadge = getConfidenceBadge(
            record.duplicateCheck?.confidence
          );

          return (
            <div
              key={record.id}
              className={`${styles.recordCard} ${isExpanded ? styles.expanded : ""} ${
                isSelected ? styles.selected : ""
              }`}
            >
              <div className={styles.recordHeader}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelected(record.id)}
                  />
                </label>

                <span className={styles.entityIcon}>{entityInfo.icon}</span>

                <div
                  className={styles.recordInfo}
                  onClick={() => toggleExpanded(record.id)}
                >
                  <span className={styles.recordTitle}>
                    {getRecordTitle(record)}
                  </span>
                  <span className={styles.recordSubtitle}>
                    {getRecordSubtitle(record)}
                  </span>
                </div>

                <Badge variant={confidenceBadge.color === "green" ? "success" : confidenceBadge.color === "red" ? "destructive" : "warning"}>
                  {confidenceBadge.label}
                </Badge>

                <div className={styles.decisionButtons}>
                  <button
                    className={`${styles.decisionButton} ${
                      record.userDecision === "create" ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateDecision([
                        { stagingRecordId: record.id, userDecision: "create" },
                      ])
                    }
                    disabled={isUpdating}
                    title="Create new record"
                  >
                    ➕
                  </button>
                  {record.duplicateCheck?.matchedId && (
                    <button
                      className={`${styles.decisionButton} ${
                        record.userDecision === "merge" ? styles.active : ""
                      }`}
                      onClick={() =>
                        onUpdateDecision([
                          { stagingRecordId: record.id, userDecision: "merge" },
                        ])
                      }
                      disabled={isUpdating}
                      title="Merge with existing"
                    >
                      🔀
                    </button>
                  )}
                  <button
                    className={`${styles.decisionButton} ${
                      record.userDecision === "skip" ? styles.active : ""
                    }`}
                    onClick={() =>
                      onUpdateDecision([
                        { stagingRecordId: record.id, userDecision: "skip" },
                      ])
                    }
                    disabled={isUpdating}
                    title="Skip this record"
                  >
                    ⏭️
                  </button>
                </div>

                <button
                  className={styles.expandButton}
                  onClick={() => toggleExpanded(record.id)}
                >
                  {isExpanded ? "▲" : "▼"}
                </button>
              </div>

              {isExpanded && (
                <div className={styles.recordDetails}>
                  <div className={styles.detailsGrid}>
                    <div className={styles.detailSection}>
                      <h4 className={styles.detailTitle}>Imported Data</h4>
                      <pre className={styles.detailCode}>
                        {JSON.stringify(record.mappedData, null, 2)}
                      </pre>
                    </div>

                    {record.duplicateCheck?.matchedId && (
                      <div className={styles.detailSection}>
                        <h4 className={styles.detailTitle}>
                          Potential Duplicate
                        </h4>
                        <p className={styles.detailText}>
                          Match confidence:{" "}
                          <strong>{record.duplicateCheck.confidence}</strong>
                          {" "}({Math.round(record.duplicateCheck.score * 100)}%)
                        </p>
                        <p className={styles.detailText}>
                          Matched fields:{" "}
                          {record.duplicateCheck.matchedFields.join(", ")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredRecords.length === 0 && (
          <div className={styles.emptyState}>
            <p>No records match the current filter.</p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <Button variant="secondary" onClick={onBack} disabled={isCommitting}>
          Back
        </Button>
        <Button
          variant="primary"
          onClick={onCommit}
          disabled={isCommitting || categorized.pending.length > 0}
        >
          {isCommitting
            ? "Committing..."
            : `Import ${categorized.toCreate.length + categorized.toMerge.length} Records`}
        </Button>
      </div>
    </div>
  );
}
