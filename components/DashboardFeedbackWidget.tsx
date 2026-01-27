import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import { FeedbackThemesData } from "../endpoints/dashboard/stats_GET.schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardFeedbackWidget.module.css";

interface DashboardFeedbackWidgetProps {
  feedbackThemes: FeedbackThemesData;
  isLoading: boolean;
}

export function DashboardFeedbackWidget({
  feedbackThemes,
  isLoading,
}: DashboardFeedbackWidgetProps) {
  const formatEnum = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <MessageSquare className={styles.icon} />
        <h2 className={styles.title}>Recent Feedback</h2>
        {!isLoading && (
          <Badge variant="secondary" className={styles.countBadge}>
            {feedbackThemes.totalFeedbackLast90Days} in 90d
          </Badge>
        )}
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            <div className={styles.typesRow}>
              <Skeleton style={{ width: "100%", height: "2rem" }} />
            </div>
            <div className={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.feedbackItem}>
                  <Skeleton style={{ width: "100%", height: "4rem" }} />
                </div>
              ))}
            </div>
          </>
        ) : feedbackThemes.totalFeedbackLast90Days === 0 ? (
          <div className={styles.emptyState}>
            <p>No feedback recorded in the last 90 days.</p>
            <Button variant="outline" size="sm" asChild className={styles.createBtn}>
              <Link to="/feedback">Log Feedback</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.typesRow}>
              {feedbackThemes.byType.map((item) => (
                <Badge key={item.type} variant="outline" className={styles.typeBadge}>
                  {formatEnum(item.type)}
                  <span className={styles.badgeCount}>{item.count}</span>
                </Badge>
              ))}
            </div>

            <div className={styles.list}>
              {feedbackThemes.recentFeedback.map((feedback) => (
                <div key={feedback.id} className={styles.feedbackItem}>
                  <div className={styles.feedbackHeader}>
                    <Badge variant="secondary" className={styles.miniBadge}>
                      {formatEnum(feedback.feedbackType)}
                    </Badge>
                    <span className={styles.date}>
                      {new Date(feedback.feedbackDate).toLocaleDateString()}
                    </span>
                  </div>
                  {feedback.personName && (
                    <p className={styles.personName}>From: {feedback.personName}</p>
                  )}
                  <p className={styles.preview}>"{feedback.notesPreview}..."</p>
                </div>
              ))}
            </div>

            <Button variant="link" asChild className={styles.viewAll}>
              <Link to="/feedback">View all feedback →</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}