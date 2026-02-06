import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileText,
  Folder,
  MessageSquare,
  Sparkles,
  Clock3,
  ListChecks,
  ShieldCheck,
  ScrollText,
  BarChart3,
} from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import styles from "./DashboardNav.module.css";

interface Item {
  path: string;
  label: string;
  icon: React.ElementType;
}

const applicantItems: Item[] = [
  { path: "/applicant/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/applicant/application", label: "Application", icon: FileText },
  { path: "/applicant/documents", label: "Documents", icon: Folder },
  { path: "/applicant/messages", label: "Messages", icon: MessageSquare },
  { path: "/applicant/assistant", label: "Assistant", icon: Sparkles },
  { path: "/applicant/status", label: "Status", icon: Clock3 },
];

const caseworkerItems: Item[] = [
  { path: "/caseworker/queue", label: "Case Queue", icon: ListChecks },
  { path: "/caseworker/moderation", label: "Moderation", icon: ShieldCheck },
  { path: "/caseworker/policies", label: "Policies", icon: ScrollText },
  { path: "/caseworker/reports", label: "Reports", icon: BarChart3 },
];

export const DashboardNav: React.FC = () => {
  const location = useLocation();
  const { authState } = useAuth();

  if (authState.type !== "authenticated") {
    return null;
  }

  const items =
    authState.context.user.role === "applicant" ? applicantItems : caseworkerItems;

  return (
    <nav className={styles.nav}>
      {items.map((item) => {
        const active = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`${styles.navItem} ${active ? styles.active : ""}`}
          >
            <Icon size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
