import {
  Building2,
  GraduationCap,
  Calendar,
  Briefcase,
  User,
  Trophy,
  MessageCircle,
  Target,
  DollarSign,
  BookOpen,
  FileText,
} from "lucide-react";
import React from "react";

import { Badge } from "./Badge";
import styles from "./TimelineItem.module.css";

import type { TimelineItem as TimelineItemType } from "../endpoints/timeline/data_GET.schema";

interface TimelineItemProps {
  item: TimelineItemType;
  hoveredPersonId: string | null;
  onPersonHover: (id: string | null) => void;
  onClick: (item: TimelineItemType) => void;
}

export const TimelineItem = ({
  item,
  hoveredPersonId,
  onPersonHover,
  onClick,
}: TimelineItemProps) => {
  const getIcon = () => {
    switch (item.type) {
      case "job":
        return <Building2 size={18} />;
      case "institution":
        return <GraduationCap size={18} />;
      case "event":
        return <Calendar size={18} />;
      case "project":
        return <Briefcase size={18} />;
      case "achievement":
        return <Trophy size={18} />;
      case "feedback":
        return <MessageCircle size={18} />;
      case "goal":
        return <Target size={18} />;
      case "compensation":
        return <DollarSign size={18} />;
      case "learning":
        return <BookOpen size={18} />;
      case "content":
        return <FileText size={18} />;
      default:
        return <Building2 size={18} />;
    }
  };

  const getVariant = () => {
    switch (item.type) {
      case "job":
        return styles.job;
      case "institution":
        return styles.institution;
      case "event":
        return styles.event;
      case "project":
        return styles.project;
      case "achievement":
        return styles.achievement;
      case "feedback":
        return styles.feedback;
      case "goal":
        return styles.goal;
      case "compensation":
        return styles.compensation;
      case "learning":
        return styles.learning;
      case "content":
        return styles.contentItem;
      default:
        return styles.job;
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) {return "Present";}
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  };

  const isHighlighted = item.linkedPeople.some(
    (p) => p.id === hoveredPersonId,
  );

  return (
    <div
      className={`${styles.container} ${isHighlighted ? styles.highlighted : ""}`}
      onClick={() => onClick(item)}
    >
      <div className={`${styles.iconWrapper} ${getVariant()}`}>{getIcon()}</div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{item.title}</h3>
          <span className={styles.date}>
            {formatDate(item.startDate)}
            {item.endDate ? ` - ${formatDate(item.endDate)}` : " - Present"}
          </span>
        </div>
        
        <p className={styles.subtitle}>{item.subtitle}</p>

        {item.linkedPeople.length > 0 && (
          <div className={styles.people}>
            {item.linkedPeople.slice(0, 2).map((person) => (
              <Badge
                key={person.id}
                variant="secondary"
                className={`${styles.personBadge} ${
                  hoveredPersonId === person.id ? styles.personBadgeActive : ""
                }`}
                onMouseEnter={(e) => {
                  e.stopPropagation();
                  onPersonHover(person.id);
                }}
                onMouseLeave={(e) => {
                  e.stopPropagation();
                  onPersonHover(null);
                }}
              >
                <User size={12} className={styles.personIcon} />
                {person.name}
              </Badge>
            ))}
            {item.linkedPeopleCount > 2 && (
              <Badge variant="outline" className={styles.moreBadge}>
                +{item.linkedPeopleCount - 2} others
              </Badge>
            )}
          </div>
        )}
      </div>
    </div>
  );
};