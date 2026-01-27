import React from "react";
import { Network } from "lucide-react";
import { TopConnector } from "../endpoints/dashboard/stats_GET.schema";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardTopConnectorsWidget.module.css";

interface DashboardTopConnectorsWidgetProps {
  topConnectors: TopConnector[];
  isLoading: boolean;
}

export function DashboardTopConnectorsWidget({
  topConnectors,
  isLoading,
}: DashboardTopConnectorsWidgetProps) {
  const displayConnectors = topConnectors.slice(0, 5);

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <Network className={styles.icon} />
        <h2 className={styles.title}>Top Connectors</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.connectorCard}>
                <Skeleton
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <Skeleton style={{ width: "120px", height: "1rem", marginBottom: "4px" }} />
                  <Skeleton style={{ width: "100px", height: "0.8rem" }} />
                </div>
              </div>
            ))}
          </>
        ) : displayConnectors.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Build relationships by logging interactions with projects</p>
          </div>
        ) : (
          <>
            {displayConnectors.map((connector) => (
              <div key={connector.id} className={styles.connectorCard}>
                <div className={styles.avatar}>
                  {connector.name.charAt(0).toUpperCase()}
                </div>
                <div className={styles.connectorInfo}>
                  <p className={styles.connectorName}>{connector.name}</p>
                  <p className={styles.connectorMeta}>
                    {connector.company || "No company"}
                  </p>
                  <div className={styles.connectionBadge}>
                    <span className={styles.connectionCount}>
                      {connector.projectCount} project
                      {connector.projectCount !== 1 ? "s" : ""}
                    </span>
                    <span className={styles.separator}>•</span>
                    <span className={styles.connectionCount}>
                      {connector.eventCount} event
                      {connector.eventCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}