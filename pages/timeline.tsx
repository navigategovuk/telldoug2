import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { useTimelineData } from "../helpers/useTimelineApi";
import { TimelineItem as TimelineItemType } from "../endpoints/timeline/data_GET.schema";
import { TimelineItem } from "../components/TimelineItem";
import { TimelineDetailModal } from "../components/TimelineDetailModal";
import { Skeleton } from "../components/Skeleton";
import { Button } from "../components/Button";
import { Link } from "react-router-dom";
import styles from "./timeline.module.css";

export default function TimelinePage() {
  const { data, isLoading } = useTimelineData();
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<TimelineItemType | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleItemClick = (item: TimelineItemType) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Career Timeline | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Career Timeline</h1>
        <p className={styles.subtitle}>
          Visualize your professional journey through jobs, projects, events, and education.
        </p>
      </header>

      <div className={styles.timelineContainer}>
        {isLoading ? (
          // Loading State
          <div className={styles.loadingWrapper}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.yearSection}>
                <div className={styles.yearLabel}>
                  <Skeleton style={{ width: "60px", height: "2rem" }} />
                </div>
                <div className={styles.itemsList}>
                  <Skeleton style={{ width: "100%", height: "120px" }} />
                  <Skeleton style={{ width: "100%", height: "120px" }} />
                </div>
              </div>
            ))}
          </div>
        ) : !data?.years || data.years.length === 0 ? (
          // Empty State
          <div className={styles.emptyState}>
            <div className={styles.emptyContent}>
              <h3>Your career timeline is empty</h3>
              <p>
                Start by adding jobs, projects, events, or education to build your timeline.
              </p>
              <div className={styles.emptyActions}>
                <Button asChild variant="outline">
                  <Link to="/jobs">Add Job</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/projects">Add Project</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          // Timeline Content
          <div className={styles.timeline}>
            {data.years.map((yearGroup) => (
              <div key={yearGroup.year} className={styles.yearSection}>
                <div className={styles.yearColumn}>
                  <span className={styles.yearLabel}>{yearGroup.year}</span>
                </div>
                <div className={styles.itemsColumn}>
                  {yearGroup.items.map((item) => (
                    <TimelineItem
                      key={item.id}
                      item={item}
                      hoveredPersonId={hoveredPersonId}
                      onPersonHover={setHoveredPersonId}
                      onClick={handleItemClick}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <TimelineDetailModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        item={selectedItem}
      />
    </div>
  );
}