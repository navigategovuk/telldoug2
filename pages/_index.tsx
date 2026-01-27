import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";
import { ArrowRight, Users, Briefcase, Network } from "lucide-react";
import { Helmet } from "react-helmet";
import styles from "./_index.module.css";

export default function LandingPage() {
  return (
    <div className={styles.container}>
      <Helmet>
        <title>TellDoug - Your Career OS</title>
        <meta
          name="description"
          content="Tell Doug everything about your career. Track people, manage projects, and build your network."
        />
      </Helmet>

      <nav className={styles.nav}>
        <div className={styles.logoContainer}>
          <img
            src="https://assets.floot.app/79b82a6e-ad98-4978-87df-e15471f09436/fe204399-5542-4950-a373-e70feddbeee4.png"
            alt="TellDoug Logo"
            className={styles.logo}
          />
          <span className={styles.brandName}>TellDoug</span>
        </div>
        <div className={styles.navLinks}>
          <Button variant="ghost" asChild>
            <Link to="/dashboard">Log In</Link>
          </Button>
          <Button asChild>
            <Link to="/dashboard">Get Started</Link>
          </Button>
        </div>
      </nav>

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Your Personal <br />
              <span className={styles.highlight}>Career Operating System</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Tell Doug everything about your career. Track your people, manage
              your projects, and visualize your professional timeline in one
              secure place.
            </p>
            <div className={styles.ctaGroup}>
              <Button size="lg" className={styles.ctaButton} asChild>
                <Link to="/dashboard">
                  Get Started <ArrowRight size={20} />
                </Link>
              </Button>
            </div>
          </div>
          <div className={styles.heroImageContainer}>
            <div className={styles.heroCard}>
              <div className={styles.cardHeader}>
                <div className={styles.cardDot} />
                <div className={styles.cardDot} />
                <div className={styles.cardDot} />
              </div>
              <div className={styles.cardBody}>
                <div className={styles.mockRow}>
                  <div className={styles.mockAvatar} />
                  <div className={styles.mockLine} />
                </div>
                <div className={styles.mockRow}>
                  <div className={styles.mockAvatar} />
                  <div className={styles.mockLine} />
                </div>
                <div className={styles.mockGraph} />
              </div>
            </div>
          </div>
        </section>

        <section className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Users size={32} />
            </div>
            <h3>Track People</h3>
            <p>
              Keep detailed records of your professional relationships, roles,
              and interactions. Never forget a connection again.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Briefcase size={32} />
            </div>
            <h3>Manage Projects</h3>
            <p>
              Organize your work history, side hustles, and major achievements.
              Visualize your progress from planning to completion.
            </p>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Network size={32} />
            </div>
            <h3>Build Your Network</h3>
            <p>
              Connect the dots between people and projects. Understand how your
              network evolves over time.
            </p>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} TellDoug. All rights reserved.</p>
      </footer>
    </div>
  );
}