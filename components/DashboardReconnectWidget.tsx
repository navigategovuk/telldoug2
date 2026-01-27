import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Users } from "lucide-react";
import { StaleContact } from "../endpoints/dashboard/stats_GET.schema";
import { Button } from "./Button";
import { InteractionDialog } from "./InteractionDialog";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardReconnectWidget.module.css";

interface DashboardReconnectWidgetProps {
  staleContacts: StaleContact[];
  isLoading: boolean;
}

export function DashboardReconnectWidget({
  staleContacts,
  isLoading,
}: DashboardReconnectWidgetProps) {
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogInteraction = (personId: string) => {
    setSelectedPersonId(personId);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setSelectedPersonId(null);
    }
  };

  // Show only top 5
  const displayContacts = staleContacts.slice(0, 5);

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <Users className={styles.icon} />
        <h2 className={styles.title}>Time to Reconnect</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.contactCard}>
                <Skeleton
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "120px", height: "1rem", marginBottom: "4px" }} />
                  <Skeleton style={{ width: "80px", height: "0.8rem" }} />
                </div>
                <Skeleton style={{ width: "100px", height: "2rem" }} />
              </div>
            ))}
          </>
        ) : displayContacts.length === 0 ? (
          <div className={styles.emptyState}>
            <p>You're staying in touch! All contacts have recent interactions.</p>
          </div>
        ) : (
          <>
            {displayContacts.map((contact) => (
              <div key={contact.id} className={styles.contactCard}>
                <div className={styles.avatar}>
                  {contact.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.contactInfo}>
                  <p className={styles.contactName}>{contact.name}</p>
                  <p className={styles.contactMeta}>
                    {contact.role} {contact.company && `at ${contact.company}`}
                  </p>
                  <p className={styles.lastContact}>
                    {contact.daysSinceLastInteraction === null
                      ? "No interactions yet"
                      : `${contact.daysSinceLastInteraction} days ago`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleLogInteraction(contact.id)}
                >
                  Log Interaction
                </Button>
              </div>
            ))}
            {staleContacts.length > 5 && (
              <Button variant="link" asChild className={styles.viewAll}>
                <Link to="/people">View all →</Link>
              </Button>
            )}
          </>
        )}
      </div>

      {selectedPersonId && (
        <InteractionDialog
          open={dialogOpen}
          onOpenChange={handleDialogClose}
          interaction={{
            id: "",
            personId: selectedPersonId,
            projectId: null,
            interactionDate: new Date(),
            interactionType: "meeting",
            tags: null,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            personName: null,
            projectName: null,
          } as import("../endpoints/interactions/list_GET.schema").InteractionWithDetails}
        />
      )}
    </div>
  );
}
