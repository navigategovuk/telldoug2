/**
 * PopulateFromCareerDialog Component
 * Shows preview of data to be imported from Career OS entities to canonical profile
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database,
  ArrowRight,
  Briefcase,
  GraduationCap,
  Award,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";
import React, { useState, useMemo } from "react";

import { Button } from "./Button";
import { Checkbox } from "./Checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Label } from "./Label";
import styles from "./PopulateFromCareerDialog.module.css";
import { Spinner } from "./Spinner";


interface PopulateFromCareerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  workspaceId?: string;
}

interface PopulatePreview {
  workToCreate: Array<{
    sourceId: string;
    company: string;
    position: string;
    startDate?: string | null;
    endDate?: string | null;
    summary?: string | null;
  }>;
  educationToCreate: Array<{
    sourceId: string;
    institution: string;
    area?: string | null;
    studyType?: string | null;
    startDate?: string | null;
    endDate?: string | null;
  }>;
  skillsToCreate: Array<{
    sourceId: string;
    name: string;
    category?: string | null;
    level?: string | null;
  }>;
}

interface PopulateResult {
  success: boolean;
  dryRun: boolean;
  workCreated: number;
  workSkipped: number;
  educationCreated: number;
  educationSkipped: number;
  skillsCreated: number;
  skillsSkipped: number;
  errors: Array<{ source: string; sourceId: string; message: string }>;
  preview?: PopulatePreview;
}

export function PopulateFromCareerDialog({
  open,
  onOpenChange,
  profileId,
  workspaceId,
}: PopulateFromCareerDialogProps) {
  const queryClient = useQueryClient();
  
  const [includeJobs, setIncludeJobs] = useState(true);
  const [includeLearning, setIncludeLearning] = useState(true);
  const [includeSkills, setIncludeSkills] = useState(true);

  // Preview query (dry run)
  const previewQuery = useQuery({
    queryKey: ["populate-preview", profileId, workspaceId, includeJobs, includeLearning, includeSkills],
    queryFn: async (): Promise<PopulateResult> => {
      const response = await fetch("/_api/profile/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          workspaceId,
          dryRun: true,
          includeJobs,
          includeLearning,
          includeSkills,
        }),
      });
      if (!response.ok) {throw new Error("Failed to fetch preview");}
      return response.json();
    },
    enabled: open,
    staleTime: 30000,
  });

  // Commit mutation
  const commitMutation = useMutation({
    mutationFn: async (): Promise<PopulateResult> => {
      const response = await fetch("/_api/profile/populate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId,
          workspaceId,
          dryRun: false,
          includeJobs,
          includeLearning,
          includeSkills,
        }),
      });
      if (!response.ok) {throw new Error("Failed to populate");}
      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile-related queries
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      queryClient.invalidateQueries({ queryKey: ["work"] });
      queryClient.invalidateQueries({ queryKey: ["education"] });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      onOpenChange(false);
    },
  });

  const preview = previewQuery.data?.preview;
  const totalToCreate = useMemo(() => {
    if (!preview) {return 0;}
    return (
      preview.workToCreate.length +
      preview.educationToCreate.length +
      preview.skillsToCreate.length
    );
  }, [preview]);

  const handleCommit = () => {
    commitMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <Database className={styles.titleIcon} />
            Populate from Career History
          </DialogTitle>
          <DialogDescription>
            Import data from your Career OS (jobs, learning, skills) into your canonical profile.
            This will add new entries without overwriting existing data.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.content}>
          {/* Data selection */}
          <div className={styles.selectionSection}>
            <h4 className={styles.sectionTitle}>Select data to import</h4>
            <div className={styles.checkboxGroup}>
              <div className={styles.checkboxItem}>
                <Checkbox
                  id="include-jobs"
                  checked={includeJobs}
                  onChange={(e) => setIncludeJobs(e.target.checked)}
                />
                <Label htmlFor="include-jobs" className={styles.checkboxLabel}>
                  <Briefcase className={styles.checkboxIcon} />
                  Jobs → Work Experience
                </Label>
              </div>
              <div className={styles.checkboxItem}>
                <Checkbox
                  id="include-learning"
                  checked={includeLearning}
                  onChange={(e) => setIncludeLearning(e.target.checked)}
                />
                <Label htmlFor="include-learning" className={styles.checkboxLabel}>
                  <GraduationCap className={styles.checkboxIcon} />
                  Learning → Education
                </Label>
              </div>
              <div className={styles.checkboxItem}>
                <Checkbox
                  id="include-skills"
                  checked={includeSkills}
                  onChange={(e) => setIncludeSkills(e.target.checked)}
                />
                <Label htmlFor="include-skills" className={styles.checkboxLabel}>
                  <Award className={styles.checkboxIcon} />
                  Skills → Profile Skills
                </Label>
              </div>
            </div>
          </div>

          {/* Preview section */}
          <div className={styles.previewSection}>
            <h4 className={styles.sectionTitle}>
              Preview
              {previewQuery.isFetching && (
                <RefreshCw className={`${styles.loadingIcon} ${styles.spinning}`} />
              )}
            </h4>

            {previewQuery.isLoading ? (
              <div className={styles.loadingContainer}>
                <Spinner />
                <span>Analyzing career data...</span>
              </div>
            ) : previewQuery.isError ? (
              <div className={styles.errorMessage}>
                <AlertCircle />
                <span>Failed to load preview. Please try again.</span>
              </div>
            ) : totalToCreate === 0 ? (
              <div className={styles.emptyMessage}>
                <CheckCircle />
                <span>Your profile is already up to date with your career data.</span>
              </div>
            ) : (
              <div className={styles.previewContent}>
                {/* Work Experience Preview */}
                {preview && preview.workToCreate.length > 0 && (
                  <div className={styles.previewCategory}>
                    <div className={styles.previewCategoryHeader}>
                      <Briefcase className={styles.previewIcon} />
                      <span>Work Experience</span>
                      <span className={styles.previewCount}>
                        +{preview.workToCreate.length}
                      </span>
                    </div>
                    <ul className={styles.previewList}>
                      {preview.workToCreate.slice(0, 5).map((work, i) => (
                        <li key={work.sourceId || i} className={styles.previewItem}>
                          <strong>{work.position}</strong> at {work.company}
                        </li>
                      ))}
                      {preview.workToCreate.length > 5 && (
                        <li className={styles.previewMore}>
                          +{preview.workToCreate.length - 5} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Education Preview */}
                {preview && preview.educationToCreate.length > 0 && (
                  <div className={styles.previewCategory}>
                    <div className={styles.previewCategoryHeader}>
                      <GraduationCap className={styles.previewIcon} />
                      <span>Education</span>
                      <span className={styles.previewCount}>
                        +{preview.educationToCreate.length}
                      </span>
                    </div>
                    <ul className={styles.previewList}>
                      {preview.educationToCreate.slice(0, 5).map((edu, i) => (
                        <li key={edu.sourceId || i} className={styles.previewItem}>
                          <strong>{edu.area || edu.studyType || "Study"}</strong> at{" "}
                          {edu.institution}
                        </li>
                      ))}
                      {preview.educationToCreate.length > 5 && (
                        <li className={styles.previewMore}>
                          +{preview.educationToCreate.length - 5} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Skills Preview */}
                {preview && preview.skillsToCreate.length > 0 && (
                  <div className={styles.previewCategory}>
                    <div className={styles.previewCategoryHeader}>
                      <Award className={styles.previewIcon} />
                      <span>Skills</span>
                      <span className={styles.previewCount}>
                        +{preview.skillsToCreate.length}
                      </span>
                    </div>
                    <ul className={styles.previewList}>
                      {preview.skillsToCreate.slice(0, 8).map((skill, i) => (
                        <li key={skill.sourceId || i} className={styles.previewItem}>
                          {skill.name}
                          {skill.level && ` (${skill.level})`}
                        </li>
                      ))}
                      {preview.skillsToCreate.length > 8 && (
                        <li className={styles.previewMore}>
                          +{preview.skillsToCreate.length - 8} more...
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className={styles.summaryBanner}>
                  <ArrowRight />
                  <span>
                    <strong>{totalToCreate}</strong> new entries will be added to your profile
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className={styles.footer}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCommit}
            disabled={
              totalToCreate === 0 ||
              commitMutation.isPending ||
              previewQuery.isLoading
            }
          >
            {commitMutation.isPending ? (
              <>
                <Spinner className={styles.buttonSpinner} />
                Importing...
              </>
            ) : (
              <>
                Import {totalToCreate} Entries
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
