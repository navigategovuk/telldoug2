import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./Dialog";
import { TimelineItem } from "../endpoints/timeline/data_GET.schema";
import { TimelineDetailView } from "./TimelineDetailView";
import styles from "./TimelineDetailModal.module.css";

interface TimelineDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: TimelineItem | null;
}

export const TimelineDetailModal = ({
  open,
  onOpenChange,
  item,
}: TimelineDetailModalProps) => {
  if (!item) {return null;}

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.modalContent}>
        <DialogHeader className={styles.srOnly}>
          <DialogTitle>{item.title}</DialogTitle>
          <DialogDescription>Details for {item.title}</DialogDescription>
        </DialogHeader>
        
        <TimelineDetailView item={item} />
      </DialogContent>
    </Dialog>
  );
};