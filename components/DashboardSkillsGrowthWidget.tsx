import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp } from "lucide-react";
import { SkillsGrowthData } from "../endpoints/dashboard/stats_GET.schema";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./DashboardSkillsGrowthWidget.module.css";

interface DashboardSkillsGrowthWidgetProps {
  skillsGrowth: SkillsGrowthData;
  isLoading: boolean;
}

export function DashboardSkillsGrowthWidget({
  skillsGrowth,
  isLoading,
}: DashboardSkillsGrowthWidgetProps) {
  const getProficiencyVariant = (level: string) => {
    switch (level) {
      case "expert":
        return "default";
      case "advanced":
        return "secondary";
      case "intermediate":
        return "outline";
      case "beginner":
        return "outline"; // Or a lighter variant if available
      default:
        return "outline";
    }
  };

  const formatEnum = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <div className={styles.widget}>
      <div className={styles.header}>
        <TrendingUp className={styles.icon} />
        <h2 className={styles.title}>Skills Growth</h2>
      </div>

      <div className={styles.content}>
        {isLoading ? (
          <>
            <div className={styles.statsGrid}>
              <Skeleton style={{ height: "4rem", width: "100%" }} />
              <Skeleton style={{ height: "4rem", width: "100%" }} />
            </div>
            <div className={styles.proficiencyRow}>
              <Skeleton style={{ height: "2rem", width: "100%" }} />
            </div>
            <div className={styles.list}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} style={{ height: "3rem", width: "100%" }} />
              ))}
            </div>
          </>
        ) : (
          <>
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <span className={styles.statValue}>
                  {skillsGrowth.totalSkills}
                </span>
                <span className={styles.statLabel}>Total Skills</span>
              </div>
              <div className={styles.statBox}>
                <span className={`${styles.statValue} ${styles.highlight}`}>
                  +{skillsGrowth.skillsAddedLast12Months}
                </span>
                <span className={styles.statLabel}>Last 12 Months</span>
              </div>
            </div>

            {skillsGrowth.byProficiency.length > 0 && (
              <div className={styles.proficiencyBreakdown}>
                <p className={styles.sectionTitle}>Proficiency Breakdown</p>
                <div className={styles.badgesRow}>
                  {skillsGrowth.byProficiency.map((item) => (
                    <Badge
                      key={item.proficiency}
                      variant={getProficiencyVariant(item.proficiency)}
                      className={styles.countBadge}
                    >
                      {formatEnum(item.proficiency)}
                      <span className={styles.badgeCount}>{item.count}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.recentSection}>
              <p className={styles.sectionTitle}>Recently Added</p>
              {skillsGrowth.recentSkills.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>No skills added yet.</p>
                </div>
              ) : (
                <div className={styles.list}>
                  {skillsGrowth.recentSkills.map((skill) => (
                    <div key={skill.id} className={styles.skillItem}>
                      <span className={styles.skillName}>{skill.name}</span>
                      <Badge
                        variant={getProficiencyVariant(skill.proficiency)}
                        className={styles.miniBadge}
                      >
                        {formatEnum(skill.proficiency)}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button variant="link" asChild className={styles.viewAll}>
              <Link to="/skills">Manage Skills →</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}