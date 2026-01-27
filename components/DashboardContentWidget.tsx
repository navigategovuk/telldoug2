import React from "react";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { ContentActivityData } from "../endpoints/dashboard/stats_GET.schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardContentWidget.module.css";

interface DashboardContentWidgetProps {
  contentActivity: ContentActivityData;
  isLoading: boolean;
}

export function DashboardContentWidget({
  contentActivity,
  isLoading,
}: DashboardContentWidgetProps) {
  const formatEnum = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <FileText className={styles.icon} />
        <h2 className={styles.title}>Content Activity</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            <div className={styles.statsGrid}>
              <Skeleton style={{ height: "4rem", width: "100%" }} />
              <Skeleton style={{ height: "4rem", width: "100%" }} />
            </div>
            <div className={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.contentItem}>
                  <Skeleton style={{ width: "100%", height: "3rem" }} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {contentActivity.totalContent}
                </span>
                <span className={styles.statLabel}>Total Items</span>
              </div>
              <div className={styles.statBox}>
                <span className={`${styles.statValue} ${styles.highlight}`}>
                  {contentActivity.thisYearCount}
                </span>
                <span className={styles.statLabel}>This Year</span>
              </div>
            </div>

            {contentActivity.byType.length > 0 && (
              <div className={styles.typesRow}>
                {contentActivity.byType.map((item) => (
                  <Badge
                    key={item.type}
                    variant="outline"
                    className={styles.typeBadge}
                  >
                    {formatEnum(item.type)}
                    <span className={styles.badgeCount}>{item.count}</span>
                  </Badge>
                ))}
              </div>
            )}

            <div className={styles.recentSection}>
              <p className={styles.sectionTitle}>Recent Publications</p>
              {contentActivity.recentContent.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No content published yet.</p>
                  <Button variant="outline" size="sm" asChild className={styles.createBtn}>
                    <Link to="/content">Add Content</Link>
                  </Button>
                </div>
              ) : (
                <div className={styles.list}>
                  {contentActivity.recentContent.map((item) => (
                    <div key={item.id} className={styles.contentItem}>
                      <div className={styles.itemMain}>
                        <h3 className={styles.itemTitle}>{item.title}</h3>
                        <div className={styles.itemMeta}>
                          <Badge variant="secondary" className={styles.miniBadge}>
                            {formatEnum(item.contentType)}
                          </Badge>
                          {item.platform && (
                            <span className={styles.platform}>
                              on {item.platform}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={styles.date}>
                        {new Date(item.publicationDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button variant="link" asChild className={styles.viewAll}>
              <Link to="/content">View all content →</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}