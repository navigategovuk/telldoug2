import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, FileText, MessageSquare, ListChecks } from "lucide-react";
import { useIsMobile } from "../helpers/useIsMobile";
import { useAuth } from "../helpers/useAuth";
import styles from "./MobileBottomNav.module.css";

export const MobileBottomNav: React.FC = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { authState } = useAuth();

  if (!isMobile || authState.type !== "authenticated") {
    return null;
  }

  const isApplicant = authState.context.user.role === "applicant";
  const items = isApplicant
    ? [
        { path: "/applicant/dashboard", label: "Home", icon: Home },
        { path: "/applicant/application", label: "Apply", icon: FileText },
        { path: "/applicant/messages", label: "Messages", icon: MessageSquare },
      ]
    : [
        { path: "/caseworker/queue", label: "Queue", icon: ListChecks },
        { path: "/caseworker/moderation", label: "Review", icon: FileText },
        { path: "/caseworker/reports", label: "Reports", icon: Home },
      ];

  return (
    <nav className={styles.bottomNav}>
      {items.map((item) => {
        const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;
        return (
          <Link key={item.path} to={item.path} className={`${styles.navItem} ${active ? styles.active : ""}`}>
            <Icon size={18} className={styles.icon} />
            <span className={styles.label}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
