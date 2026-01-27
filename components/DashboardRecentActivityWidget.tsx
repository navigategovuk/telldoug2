import React from "react";
import { Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./Tabs";
import { Badge } from "./Badge";
import { RecentInteraction } from "../endpoints/dashboard/stats_GET.schema";
import { Selectable } from "kysely";
import { Events } from "../helpers/schema";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardRecentActivityWidget.module.css";

interface DashboardRecentActivityWidgetProps {
  recentInteractions: RecentInteraction[];
  upcomingEvents: Selectable<Events>[];
  isLoading: boolean;
}

export function DashboardRecentActivityWidget({
  recentInteractions,
  upcomingEvents,
  isLoading,
}: DashboardRecentActivityWidgetProps) {
  const getInteractionVariant = (type: string) => {
    switch (type) {
      case "meeting":
        return "default";
      case "call":
        return "secondary";
      case "email":
        return "outline";
      case "coffee":
        return "success";
      default:
        return "default";
    }
  };

  const truncateNotes = (notes: string | null, maxLength: number = 60) => {
    if (!notes) {return "No notes";}
    if (notes.length <= maxLength) {return notes;}
    return notes.substring(0, maxLength) + "...";
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <Activity className={styles.icon} />
        <h2 className={styles.title}>Recent Activity</h2>
      </div>

      <div className={styles.content}>
        <Tabs defaultValue="interactions">
          <TabsList>
            <TabsTrigger value="interactions">Recent Interactions</TabsTrigger>
            <TabsTrigger value="events">Upcoming Events</TabsTrigger>
          </TabsList>

          <TabsContent value="interactions">
            <div className={styles.activityList}>
              {isLoading ? (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.activityItem}>
                      <Skeleton style={{ width: "100%", height: "60px" }} />
                    </div>
                  ))}
                </>
              ) : recentInteractions.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No recent interactions</p>
                </div>
              ) : (
                recentInteractions.slice(0, 10).map((interaction) => (
                  <div key={interaction.id} className={styles.activityItem}>
                    <div className={styles.activityHeader}>
                      <Badge variant={getInteractionVariant(interaction.interactionType)}>
                        {interaction.interactionType}
                      </Badge>
                      <span className={styles.activityDate}>
                        {new Date(interaction.interactionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className={styles.activityPerson}>
                      {interaction.personName || "Unknown person"}
                      {interaction.projectName && (
                        <span className={styles.projectLink}>
                          → {interaction.projectName}
                        </span>
                      )}
                    </p>
                    <p className={styles.activityNotes}>
                      {truncateNotes(interaction.notes)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className={styles.activityList}>
              {isLoading ? (
                <>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.activityItem}>
                      <Skeleton style={{ width: "100%", height: "60px" }} />
                    </div>
                  ))}
                </>
              ) : upcomingEvents.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.slice(0, 5).map((event) => (
                  <div key={event.id} className={styles.activityItem}>
                    <div className={styles.activityHeader}>
                      <Badge variant="warning">{event.eventType}</Badge>
                      <span className={styles.activityDate}>
                        {event.eventDate
                          ? new Date(event.eventDate).toLocaleDateString()
                          : "No date"}
                      </span>
                    </div>
                    <p className={styles.activityPerson}>{event.title}</p>
                    {event.location && (
                      <p className={styles.activityNotes}>{event.location}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}