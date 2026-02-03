import { PenLine } from "lucide-react";
import React, { useState } from "react";
import { Helmet } from "react-helmet";

import styles from "./dashboard.module.css";
import { Button } from "../components/Button";
import { CareerNarrativeDialog } from "../components/CareerNarrativeDialog";
import { ContentDraftDialog } from "../components/ContentDraftDialog";
import { DashboardContentWidget } from "../components/DashboardContentWidget";
import { DashboardFeedbackWidget } from "../components/DashboardFeedbackWidget";
import { DashboardGoalsWidget } from "../components/DashboardGoalsWidget";
import { DashboardProductiveInteractionsWidget } from "../components/DashboardProductiveInteractionsWidget";
import { DashboardRecentActivityWidget } from "../components/DashboardRecentActivityWidget";
import { DashboardReconnectWidget } from "../components/DashboardReconnectWidget";
import { DashboardSkillsGrowthWidget } from "../components/DashboardSkillsGrowthWidget";
import { DashboardTopConnectorsWidget } from "../components/DashboardTopConnectorsWidget";
import { useDashboardStats } from "../helpers/useDashboardApi";

export default function DashboardPage() {
  const [draftDialogOpen, setDraftDialogOpen] = useState(false);
  const [narrativeDialogOpen, setNarrativeDialogOpen] = useState(false);
  const { data, isFetching } = useDashboardStats();

  const staleContacts = data?.staleContacts || [];
  const productiveInteractionTypes = data?.productiveInteractionTypes || [];
  const topConnectors = data?.topConnectors || [];
  const recentInteractions = data?.recentActivity.recentInteractions || [];
  const upcomingEvents = data?.recentActivity.upcomingEvents || [];

  // New data extractions
  const goalsProgress = data?.goalsProgress || [];
  const skillsGrowth = data?.skillsGrowth || {
    totalSkills: 0,
    skillsAddedLast12Months: 0,
    byProficiency: [],
    recentSkills: [],
  };
  const feedbackThemes = data?.feedbackThemes || {
    totalFeedbackLast90Days: 0,
    byType: [],
    recentFeedback: [],
  };
  const contentActivity = data?.contentActivity || {
    totalContent: 0,
    byType: [],
    recentContent: [],
    thisYearCount: 0,
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Dashboard | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome to TellDoug</h1>
          <p className={styles.subtitle}>
            Here&apos;s what&apos;s happening in your career OS.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="outline"
            onClick={() => setNarrativeDialogOpen(true)}
          >
            <PenLine size={16} />
            Career Narrative
          </Button>
          <Button onClick={() => setDraftDialogOpen(true)}>
            <PenLine size={16} />
            Draft Content
          </Button>
        </div>
      </header>

      <div className={styles.widgetsGrid}>
        <DashboardReconnectWidget
          staleContacts={staleContacts}
          isLoading={isFetching}
        />
        <DashboardGoalsWidget
          goalsProgress={goalsProgress}
          isLoading={isFetching}
        />

        <DashboardSkillsGrowthWidget
          skillsGrowth={skillsGrowth}
          isLoading={isFetching}
        />
        <DashboardFeedbackWidget
          feedbackThemes={feedbackThemes}
          isLoading={isFetching}
        />

        <DashboardTopConnectorsWidget
          topConnectors={topConnectors}
          isLoading={isFetching}
        />
        <DashboardProductiveInteractionsWidget
          productiveInteractionTypes={productiveInteractionTypes}
          isLoading={isFetching}
        />

        <DashboardContentWidget
          contentActivity={contentActivity}
          isLoading={isFetching}
        />
        <DashboardRecentActivityWidget
          recentInteractions={recentInteractions}
          upcomingEvents={upcomingEvents}
          isLoading={isFetching}
        />
      </div>

      <ContentDraftDialog
        open={draftDialogOpen}
        onOpenChange={setDraftDialogOpen}
      />
      <CareerNarrativeDialog
        open={narrativeDialogOpen}
        onOpenChange={setNarrativeDialogOpen}
      />
    </div>
  );
}