import { Plus, MoreVertical, Trash, Edit, MapPin, Calendar as CalendarIcon } from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { toast } from "sonner";

import styles from "./jobs.module.css";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Checkbox } from "../components/Checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/DropdownMenu";
import { JobDialog } from "../components/JobDialog";
import { Skeleton } from "../components/Skeleton";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { useJobsList, useDeleteJob } from "../helpers/useJobsApi";

import type { Jobs } from "../helpers/schema";
import type { Selectable } from "kysely";



export default function JobsPage() {
  const [showCurrentOnly, setShowCurrentOnly] = useState(false);
  const { data, isLoading } = useJobsList(showCurrentOnly ? { isCurrent: true } : {});
  const deleteMutation = useDeleteJob();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Selectable<Jobs> | null>(null);

  const handleAdd = () => {
    setSelectedJob(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (job: Selectable<Jobs>) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this job?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Job deleted successfully"),
          onError: () => toast.error("Failed to delete job"),
        }
      );
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) {return "Present";}
    return new Date(date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Jobs | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Jobs</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Job
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Checkbox
            id="currentOnly"
            checked={showCurrentOnly}
            onChange={(e) => setShowCurrentOnly(e.target.checked)}
          />
          <label htmlFor="currentOnly" className={styles.filterLabel}>Show Current Only</label>
        </div>
      </div>

      <div className={styles.list}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHeader}>
                <Skeleton style={{ width: "40%", height: "1.5rem" }} />
                <Skeleton style={{ width: "24px", height: "24px" }} />
              </div>
              <Skeleton style={{ width: "30%", height: "1rem", marginBottom: "1rem" }} />
              <Skeleton style={{ width: "100%", height: "3rem" }} />
            </div>
          ))
        ) : data?.jobs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No jobs found.</p>
          </div>
        ) : (
          data?.jobs.map((job) => (
            <div 
              key={job.id} 
              ref={job.id === highlightedId ? highlightRef : undefined}
              className={`${styles.card} ${
                job.id === highlightedId ? highlightClassName : ""
              }`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <h3 className={styles.cardTitle}>{job.title}</h3>
                  <span className={styles.companyName}>at {job.company}</span>
                  {job.isCurrent && <Badge variant="success" className={styles.currentBadge}>Current</Badge>}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(job)}>
                      <Edit size={14} style={{ marginRight: 8 }} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(job.id)}
                      className={styles.deleteItem}
                    >
                      <Trash size={14} style={{ marginRight: 8 }} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className={styles.metaRow}>
                <div className={styles.metaItem}>
                  <CalendarIcon size={14} />
                  <span>
                    {formatDate(job.startDate)} - {job.isCurrent ? "Present" : formatDate(job.endDate)}
                  </span>
                </div>
                {job.location && (
                  <div className={styles.metaItem}>
                    <MapPin size={14} />
                    <span>{job.location}</span>
                  </div>
                )}
              </div>

              {job.description && (
                <div className={styles.description}>
                  {job.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <JobDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        job={selectedJob}
      />
    </div>
  );
}