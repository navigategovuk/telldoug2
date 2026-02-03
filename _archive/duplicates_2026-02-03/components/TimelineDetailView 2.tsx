import { format, addDays, subDays, isWithinInterval } from "date-fns";
import {
  Building2,
  GraduationCap,
  Calendar,
  Briefcase,
  MapPin,
  MessageSquare,
  User,
  Trophy,
  MessageCircle,
  Target,
  DollarSign,
  BookOpen,
  FileText,
  ExternalLink,
} from "lucide-react";
import React from "react";

import { Badge } from "./Badge";
import { Skeleton } from "./Skeleton";
import styles from "./TimelineDetailModal.module.css";
import { useAchievementsList } from "../helpers/useAchievementsApi";
import { useCompensationList } from "../helpers/useCompensationApi";
import { useContentList } from "../helpers/useContentApi";
import { useEventsList } from "../helpers/useEventsApi";
import { useFeedbackList } from "../helpers/useFeedbackApi";
import { useGoalsList } from "../helpers/useGoalsApi";
import { useInstitutionsList } from "../helpers/useInstitutionsApi";
import { useInteractionsList } from "../helpers/useInteractionsApi";
import { useJobsList } from "../helpers/useJobsApi";
import { useLearningList } from "../helpers/useLearningApi";
import { useProjectsList } from "../helpers/useProjectsApi";

import type { TimelineItem } from "../endpoints/timeline/data_GET.schema";

interface TimelineDetailViewProps {
  item: TimelineItem;
}

type TimelineDetailFields = {
  location?: string | null;
  company?: string | null;
  degree?: string | null;
  category?: string | null;
  quantifiableImpact?: string | null;
  feedbackType?: string | null;
  context?: string | null;
  goalType?: string | null;
  status?: string | null;
  currency?: string | null;
  baseSalary?: number | string | null;
  bonus?: number | string | null;
  equityValue?: number | string | null;
  provider?: string | null;
  learningType?: string | null;
  cost?: number | string | null;
  platform?: string | null;
  contentType?: string | null;
  url?: string | null;
  description?: string | null;
  notes?: string | null;
  skillsGained?: string | null;
  benefitsNote?: string | null;
  engagementMetrics?: string | null;
};

export const TimelineDetailView = ({ item }: TimelineDetailViewProps) => {
  // Fetch all interactions to filter client-side
  const { data: interactionsData, isLoading: isLoadingInteractions } =
    useInteractionsList({});

  // Fetch specific details based on type
  // Note: We call all hooks but they will likely return cached data or be lightweight
  // In a larger app, we would split this into separate components to avoid fetching all lists
  const { data: jobsData } = useJobsList({});
  const { data: eventsData } = useEventsList({});
  const { data: projectsData } = useProjectsList({});
  const { data: institutionsData } = useInstitutionsList({});
  const { data: achievementsData } = useAchievementsList({});
  const { data: feedbackData } = useFeedbackList({});
  const { data: goalsData } = useGoalsList({});
  const { data: compensationData } = useCompensationList({});
  const { data: learningData } = useLearningList({});
  const { data: contentData } = useContentList({});

  const getDetails = () => {
    switch (item.type) {
      case "job":
        return jobsData?.jobs.find((j) => j.id === item.id);
      case "event":
        return eventsData?.events.find((e) => e.id === item.id);
      case "project":
        return projectsData?.projects.find((p) => p.id === item.id);
      case "institution":
        return institutionsData?.institutions.find((i) => i.id === item.id);
      case "achievement":
        return achievementsData?.achievements.find((a) => a.id === item.id);
      case "feedback":
        return feedbackData?.feedback.find((f) => f.id === item.id);
      case "goal":
        return goalsData?.goals.find((g) => g.id === item.id);
      case "compensation":
        return compensationData?.compensation.find((c) => c.id === item.id);
      case "learning":
        return learningData?.learning.find((l) => l.id === item.id);
      case "content":
        return contentData?.content.find((c) => c.id === item.id);
      default:
        return null;
    }
  };

  const details = getDetails();
  const detail = details as TimelineDetailFields | null;

  const toNumber = (value: string | number | null | undefined) => {
    if (value == null) {
      return null;
    }
    const numeric = typeof value === "number" ? value : Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  };

  const formatNumber = (value: string | number | null | undefined) => {
    const numeric = toNumber(value);
    if (numeric != null) {
      return numeric.toLocaleString();
    }
    return value != null ? String(value) : "";
  };

  const isPositiveNumber = (value: string | number | null | undefined) => {
    const numeric = toNumber(value);
    return numeric != null && numeric > 0;
  };

  const getRelatedInteractions = () => {
    if (!interactionsData?.interactions) {return [];}

    return interactionsData.interactions.filter((interaction) => {
      // For Projects: Match projectId
      if (item.type === "project" && interaction.projectId === item.id) {
        return true;
      }

      // For Events: Match date range (+/- 3 days)
      if (item.type === "event" && item.startDate) {
        const eventDate = new Date(item.startDate);
        const interactionDate = new Date(interaction.interactionDate);
        const start = subDays(eventDate, 3);
        const end = addDays(eventDate, 3);
        
        if (isWithinInterval(interactionDate, { start, end })) {
          return true;
        }
      }

      // For all types: Match linked people
      if (item.linkedPeople.length > 0) {
        const linkedIds = item.linkedPeople.map((p) => p.id);
        if (linkedIds.includes(interaction.personId)) {
          return true;
        }
      }

      return false;
    });
  };

  const relatedInteractions = getRelatedInteractions();

  if (!details && item.type !== "project") {
    // Projects might be missing from list if filtered, but generally we expect details
    // If loading lists relevant to the item type, show skeleton
    const isLoading =
      (item.type === "job" && !jobsData) ||
      (item.type === "event" && !eventsData) ||
      (item.type === "institution" && !institutionsData) ||
      (item.type === "achievement" && !achievementsData) ||
      (item.type === "feedback" && !feedbackData) ||
      (item.type === "goal" && !goalsData) ||
      (item.type === "compensation" && !compensationData) ||
      (item.type === "learning" && !learningData) ||
      (item.type === "content" && !contentData);

    if (isLoading) {
      return (
        <div className={styles.loadingContainer}>
          <Skeleton className={styles.titleSkeleton} />
          <Skeleton className={styles.metaSkeleton} />
          <Skeleton className={styles.bodySkeleton} />
        </div>
      );
    }
  }

  const renderMeta = () => {
    return (
      <div className={styles.metaGrid}>
        <div className={styles.metaItem}>
          <Calendar size={16} />
          <span>
            {item.startDate ? format(new Date(item.startDate), "MMM yyyy") : "TBD"}
            {item.endDate && ` - ${format(new Date(item.endDate), "MMM yyyy")}`}
            {/* Handle cases like 'Present' which was hardcoded before but better handled via data check or specific types */}
            {item.type === 'job' && !item.endDate && " - Present"}
          </span>
        </div>

        {/* Existing types */}
        {detail?.location && (
          <div className={styles.metaItem}>
            <MapPin size={16} />
            <span>{detail?.location}</span>
          </div>
        )}
        {item.type === "job" && detail?.company && (
          <div className={styles.metaItem}>
            <Building2 size={16} />
            <span>{detail?.company}</span>
          </div>
        )}
        {item.type === "institution" && detail?.degree && (
          <div className={styles.metaItem}>
            <GraduationCap size={16} />
            <span>{detail?.degree}</span>
          </div>
        )}

        {/* New types */}
        {item.type === "achievement" && detail?.category && (
          <div className={styles.metaItem}>
            <Trophy size={16} />
            <span style={{ textTransform: 'capitalize' }}>{detail?.category}</span>
          </div>
        )}
         {item.type === "achievement" && detail?.quantifiableImpact && (
          <div className={styles.metaItem}>
            <Target size={16} />
            <span>{detail?.quantifiableImpact}</span>
          </div>
        )}

        {item.type === "feedback" && detail?.feedbackType && (
          <div className={styles.metaItem}>
            <MessageSquare size={16} />
            <span style={{ textTransform: 'capitalize' }}>{detail?.feedbackType?.replace(/_/g, " ")}</span>
          </div>
        )}
        {item.type === "feedback" && detail?.context && (
          <div className={styles.metaItem}>
            <Briefcase size={16} />
            <span>{detail?.context}</span>
          </div>
        )}

        {item.type === "goal" && detail?.goalType && (
          <div className={styles.metaItem}>
            <Target size={16} />
            <span style={{ textTransform: 'capitalize' }}>{detail?.goalType}</span>
          </div>
        )}
        {item.type === "goal" && detail?.status && (
          <div className={styles.metaItem}>
             <Badge variant="outline" style={{ textTransform: 'capitalize' }}>
               {detail?.status?.replace(/_/g, " ")}
             </Badge>
          </div>
        )}

        {item.type === "compensation" && (
          <>
            <div className={styles.metaItem}>
              <DollarSign size={16} />
              <span>
                {detail?.currency} {formatNumber(detail?.baseSalary)}
              </span>
            </div>
            {isPositiveNumber(detail?.bonus) && (
               <div className={styles.metaItem}>
               <span className={styles.label}>Bonus:</span>
               <span>
                 {detail?.currency} {formatNumber(detail?.bonus)}
               </span>
             </div>
            )}
             {isPositiveNumber(detail?.equityValue) && (
               <div className={styles.metaItem}>
               <span className={styles.label}>Equity:</span>
               <span>
                 {detail?.currency} {formatNumber(detail?.equityValue)}
               </span>
             </div>
            )}
          </>
        )}

        {item.type === "learning" && detail?.provider && (
           <div className={styles.metaItem}>
             <Building2 size={16} />
             <span>{detail?.provider}</span>
           </div>
        )}
        {item.type === "learning" && detail?.learningType && (
           <div className={styles.metaItem}>
             <BookOpen size={16} />
             <span style={{ textTransform: 'capitalize' }}>{detail?.learningType?.replace(/_/g, " ")}</span>
           </div>
        )}
        {item.type === "learning" && isPositiveNumber(detail?.cost) && (
           <div className={styles.metaItem}>
             <DollarSign size={16} />
             <span>{formatNumber(detail?.cost)}</span>
           </div>
        )}

        {item.type === "content" && detail?.platform && (
          <div className={styles.metaItem}>
            <Briefcase size={16} />
            <span>{detail?.platform}</span>
          </div>
        )}
        {item.type === "content" && detail?.contentType && (
          <div className={styles.metaItem}>
            <FileText size={16} />
            <span style={{ textTransform: 'capitalize' }}>{detail?.contentType?.replace(/_/g, " ")}</span>
          </div>
        )}
        {item.type === "content" && detail?.url && (
           <div className={styles.metaItem}>
            <a 
              href={detail?.url ?? ""} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline text-blue-600"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              <span>Link</span>
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.detailContainer}>
      <div className={styles.detailHeader}>
        <div className={styles.iconLarge}>
          {item.type === "job" && <Building2 size={24} />}
          {item.type === "institution" && <GraduationCap size={24} />}
          {item.type === "event" && <Calendar size={24} />}
          {item.type === "project" && <Briefcase size={24} />}
          {item.type === "achievement" && <Trophy size={24} />}
          {item.type === "feedback" && <MessageCircle size={24} />}
          {item.type === "goal" && <Target size={24} />}
          {item.type === "compensation" && <DollarSign size={24} />}
          {item.type === "learning" && <BookOpen size={24} />}
          {item.type === "content" && <FileText size={24} />}
        </div>
        <div>
          <h2 className={styles.detailTitle}>{item.title}</h2>
          <p className={styles.detailSubtitle}>{item.subtitle}</p>
        </div>
      </div>

      {renderMeta()}

      {detail?.description && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Description</h3>
          <p className={styles.description}>{detail?.description}</p>
        </div>
      )}

      {detail?.notes && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Notes</h3>
          <p className={styles.notes}>{detail?.notes}</p>
        </div>
      )}

      {/* Specific fields for new types that act like description/notes */}
      {item.type === "learning" && detail?.skillsGained && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Skills Gained</h3>
          <p className={styles.description}>{detail?.skillsGained}</p>
        </div>
      )}
      
      {item.type === "compensation" && detail?.benefitsNote && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Benefits</h3>
          <p className={styles.description}>{detail?.benefitsNote}</p>
        </div>
      )}

      {item.type === "content" && detail?.engagementMetrics && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Engagement</h3>
          <p className={styles.description}>{detail?.engagementMetrics}</p>
        </div>
      )}

      {item.linkedPeople.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Linked People</h3>
          <div className={styles.peopleGrid}>
            {item.linkedPeople.map((person) => (
              <div key={person.id} className={styles.personCard}>
                <div className={styles.personAvatar}>
                  <User size={16} />
                </div>
                <span className={styles.personName}>{person.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>
          Related Interactions
          <Badge variant="secondary" className={styles.countBadge}>
            {relatedInteractions.length}
          </Badge>
        </h3>
        
        {isLoadingInteractions ? (
          <div className={styles.interactionsList}>
            <Skeleton className={styles.interactionSkeleton} />
            <Skeleton className={styles.interactionSkeleton} />
          </div>
        ) : relatedInteractions.length > 0 ? (
          <div className={styles.interactionsList}>
            {relatedInteractions.map((interaction) => (
              <div key={interaction.id} className={styles.interactionCard}>
                <div className={styles.interactionHeader}>
                  <Badge variant="outline" className={styles.interactionType}>
                    {interaction.interactionType}
                  </Badge>
                  <span className={styles.interactionDate}>
                    {format(new Date(interaction.interactionDate), "MMM d, yyyy")}
                  </span>
                </div>
                <div className={styles.interactionBody}>
                  <div className={styles.interactionPerson}>
                    <User size={14} />
                    <span>{interaction.personName || "Unknown Person"}</span>
                  </div>
                  {interaction.notes && (
                    <p className={styles.interactionNotes}>{interaction.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.emptyText}>No related interactions found.</p>
        )}
      </div>
    </div>
  );
};