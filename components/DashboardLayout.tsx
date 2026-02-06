import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useAuth } from "../helpers/useAuth";
import { DashboardNav } from "./DashboardNav";
import { MobileBottomNav } from "./MobileBottomNav";
import { Button } from "./Button";
import styles from "./DashboardLayout.module.css";

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authState, logout, switchOrganization } = useAuth();
  const location = useLocation();

  if (authState.type !== "authenticated") {
    return null;
  }

  const { context } = authState;

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logoContainer}>
          <Link to="/" className={styles.logo}>Housing Portal</Link>
        </div>

        <div className={styles.sidebarContent}>
          <DashboardNav />

          <div className={styles.userSection}>
            <div className={styles.userDetails}>
              <strong>{context.user.displayName}</strong>
              <small>{context.user.role.replace("_", " ")}</small>
            </div>

            <label className={styles.selectLabel}>Organization</label>
            <select
              className={styles.orgSelect}
              value={context.activeOrganizationId}
              onChange={(e) => switchOrganization(Number(e.target.value))}
            >
              {context.memberships.map((membership) => (
                <option key={membership.organizationId} value={membership.organizationId}>
                  {membership.organizationName}
                </option>
              ))}
            </select>

            <Button variant="ghost" onClick={() => logout()} className={styles.logoutButton}>
              <LogOut size={16} /> Sign out
            </Button>
          </div>
        </div>
      </aside>

      <main className={styles.main}>
        <div className={styles.content} key={location.pathname}>
          {children}
        </div>
      </main>

      <MobileBottomNav />
    </div>
  );
};
