import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { useGenerateMeetingBrief } from "../helpers/useAiApi";
import { FileText, AlertCircle } from "lucide-react";
import styles from "./MeetingBriefDialog.module.css";

interface MeetingBriefDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personId: string | null;
  personName: string | null;
}

export function MeetingBriefDialog({
  open,
  onOpenChange,
  personId,
  personName,
}: MeetingBriefDialogProps) {
  const { mutate, data, isPending, isError, error, reset } = useGenerateMeetingBrief();

  useEffect(() => {
    if (open && personId) {
      mutate({ personId });
    } else if (!open) {
      // Reset state when closed so it re-fetches next time or clears old data
      const timer = setTimeout(() => reset(), 300); // Wait for animation
      return () => clearTimeout(timer);
    }
  }, [open, personId, mutate, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <FileText size={20} className={styles.icon} />
            Meeting Brief: {personName}
          </DialogTitle>
          <DialogDescription>
            AI-generated briefing based on your history and interactions.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.contentArea}>
          {isPending ? (
            <div className={styles.loadingState}>
              <Skeleton className={styles.skeletonLine} style={{ width: "60%" }} />
              <Skeleton className={styles.skeletonLine} style={{ width: "90%" }} />
              <Skeleton className={styles.skeletonLine} style={{ width: "80%" }} />
              <div className={styles.spacer} />
              <Skeleton className={styles.skeletonLine} style={{ width: "40%" }} />
              <Skeleton className={styles.skeletonLine} style={{ width: "95%" }} />
              <Skeleton className={styles.skeletonLine} style={{ width: "70%" }} />
              <div className={styles.spacer} />
              <Skeleton className={styles.skeletonLine} style={{ width: "50%" }} />
              <Skeleton className={styles.skeletonLine} style={{ width: "85%" }} />
            </div>
          ) : isError ? (
            <div className={styles.errorState}>
              <AlertCircle size={32} className={styles.errorIcon} />
              <p>Failed to generate brief.</p>
              <p className={styles.errorMessage}>{error?.message}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => personId && mutate({ personId })}
                className={styles.retryButton}
              >
                Retry
              </Button>
            </div>
          ) : data ? (
            <div className={styles.briefContent}>
              {data.brief.split('\n').map((line, i) => (
                <p key={i} className={styles.briefLine}>
                  {line}
                </p>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}