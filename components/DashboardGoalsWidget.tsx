import React from "react";
import { Link } from "react-router-dom";
import { Target } from "lucide-react";
import { GoalProgressItem } from "../endpoints/dashboard/stats_GET.schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import { Progress } from "./Progress";
import styles from "./DashboardGoalsWidget.module.css";

interface DashboardGoalsWidgetProps {
  goalsProgress: GoalProgressItem[];
  isLoading: boolean;
}

export function DashboardGoalsWidget({
  goalsProgress,
  isLoading,
}: DashboardGoalsWidgetProps) {
  const getGoalTypeVariant = (type: string) => {
    switch (type) {
      case "career":
        return "default"; // Blue
      case "skill":
        return "secondary"; // Purple-ish/Sage
      case "financial":
        return "success"; // Green
      case "relationship":
        return "warning"; // Orange
      default:
        return "outline";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "default";
      case "abandoned":
        return "destructive";
      case "not_started":
        return "outline";
      default:
        return "outline";
    }
  };

  const formatEnum = (str: string) => {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Calculate completion stats
  const totalGoals = goalsProgress.length;
  const completedGoals = goalsProgress.filter(
    (g) => g.status === "completed"
  ).length;
  const completionPercentage =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  const displayGoals = goalsProgress.slice(0, 5);

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <Target className={styles.icon} />
        <h2 className={styles.title}>Goals Progress</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            <div className={styles.statsRow}>
              <Skeleton style={{ width: "100%", height: "2rem" }} />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.goalCard}>
                <div className={styles.goalHeader}>
                  <Skeleton style={{ width: "60%", height: "1.2rem" }} />
                  <Skeleton style={{ width: "20%", height: "1rem" }} />
                </div>
                <div className={styles.goalMeta}>
                  <Skeleton style={{ width: "80px", height: "1.5rem" }} />
                  <Skeleton style={{ width: "80px", height: "1.5rem" }} />
                </div>
              </div>
            ))}
          </>
        ) : goalsProgress.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No active goals found.</p>
            <Button variant="outline" size="sm" asChild className={styles.createBtn}>
              <Link to="/goals">Create a Goal</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className={styles.statsRow}>
              <div className={styles.progressLabel}>
                <span>Overall Progress</span>
                <span>
                  {completedGoals}/{totalGoals} Completed
                </span>
              </div>
              <Progress value={completionPercentage} />
            </div>

            <div className={styles.list}>
              {displayGoals.map((goal) => (
                <div key={goal.id} className={styles.goalCard}>
                  <div className={styles.goalHeader}>
                    <h3 className={styles.goalTitle}>{goal.title}</h3>
                    <span
                      className={`${styles.daysRemaining} ${
                        goal.isOverdue ? styles.overdue : ""
                      }`}
                    >
                      {goal.status === "completed"
                        ? "Done"
                        : goal.isOverdue
                        ? "Overdue"
                        : `${goal.daysUntilTarget} days left`}
                    </span>
                  </div>
                  <div className={styles.goalMeta}>
                    <Badge variant={getGoalTypeVariant(goal.goalType)}>
                      {formatEnum(goal.goalType)}
                    </Badge>
                    <Badge variant={getStatusVariant(goal.status)}>
                      {formatEnum(goal.status)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {goalsProgress.length > 5 && (
              <Button variant="link" asChild className={styles.viewAll}>
                <Link to="/goals">View all goals →</Link>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}