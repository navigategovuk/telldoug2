import {
  LayoutDashboard,
  GitBranch,
  Users,
  MessageSquare,
  Briefcase,
  Lightbulb,
  Building2,
  GraduationCap,
  CalendarDays,
  Network,
  Menu,
  X,
  LogOut,
  MessageCircle,
  Trophy,
  Target,
  DollarSign,
  BookOpen,
  FileEdit,
  Upload,
  Search,
  FileUser,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import styles from "./AppLayout.module.css";
import { Button } from "./Button";
import { GlobalSearchPalette } from "./GlobalSearchPalette";
import { QuickCaptureButton } from "./QuickCaptureButton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";
import { LOGO_URL } from "../helpers/brand";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/timeline", label: "Timeline", icon: GitBranch },
    { path: "/resume-builder", label: "Resume Builder", icon: FileUser },
    { path: "/people", label: "People", icon: Users },
    { path: "/interactions", label: "Interactions", icon: MessageSquare },
    { path: "/feedback", label: "Feedback", icon: MessageCircle },
    { path: "/projects", label: "Projects", icon: Briefcase },
    { path: "/skills", label: "Skills", icon: Lightbulb },
    { path: "/learning", label: "Learning", icon: BookOpen },
    { path: "/jobs", label: "Jobs", icon: Building2 },
    { path: "/compensation", label: "Compensation", icon: DollarSign },
    { path: "/institutions", label: "Institutions", icon: GraduationCap },
    { path: "/achievements", label: "Achievements", icon: Trophy },
    { path: "/goals", label: "Goals", icon: Target },
    { path: "/events", label: "Events", icon: CalendarDays },
    { path: "/content", label: "Content", icon: FileEdit },
    { path: "/relationships", label: "Relationships", icon: Network },
    { path: "/import", label: "Import", icon: Upload },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "k" &&
        (e.metaKey || e.ctrlKey) &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Header */}
      <header className={styles.mobileHeader}>
        <div className={styles.logoContainer}>
          <img
            src={LOGO_URL}
            alt="TellDoug Logo"
            className={styles.logo}
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMobileMenu}
          className={styles.menuButton}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </header>

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoContainer}>
            <img
              src={LOGO_URL}
              alt="TellDoug Logo"
              className={styles.logo}
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
              >
                <Search size={20} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Search (⌘K)</TooltipContent>
          </Tooltip>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ""}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <Button
            variant="ghost"
            className={styles.logoutButton}
            asChild
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <Link to="/">
              <LogOut size={20} />
              <span>Log Out</span>
            </Link>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <div className={styles.contentContainer}>{children}</div>
      </main>

      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div className={styles.overlay} onClick={() => setIsMobileMenuOpen(false)} />
      )}

      <QuickCaptureButton />
      <GlobalSearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
