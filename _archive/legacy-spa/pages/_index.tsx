import React from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";

import styles from "./_index.module.css";
import { Button } from "../components/Button";
import { LOGO_URL } from "../helpers/brand";

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
            src={LOGO_URL}
            alt="TellDoug Logo"
            className={styles.logo}
          />
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
        <header className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.pill}>Current State Assessment</div>
            <h1 className={styles.heroTitle}>
              TellDoug Platform Architecture
            </h1>
            <p className={styles.heroSubtitle}>
              A structured, end‑to‑end blueprint covering data models, APIs,
              integrations, background jobs, and UX delivery requirements.
            </p>
            <div className={styles.ctaGroup}>
              <Button size="lg" className={styles.ctaButton} asChild>
                <Link to="/dashboard">Open the App</Link>
              </Button>
            </div>
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current State Assessment</h2>
          <ul className={styles.list}>
            <li>
              <strong>telldoug.navigategov.uk:</strong> single‑page React app
            </li>
            <li>Career‑focused data model centered on user entity</li>
            <li>Likely manual data entry as primary input method</li>
            <li>Standard CRUD operations</li>
            <li>No apparent external API integrations</li>
            <li>No automated data ingestion pipeline</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Required Technical Components</h2>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Database Schema Additions</h3>
            <pre className={styles.codeBlock}><code>{`-- Contacts table (enhanced from basic contact list)
contacts:
  id, user_id, full_name, email[], phone[], 
  linkedin_url, twitter_handle, avatar_url,
  current_company, current_role, company_start_date,
  location, bio, relationship_strength_score,
  last_interaction_date, first_contact_date,
  tags[], custom_fields jsonb, created_at, updated_at

-- Activities/Feed items
activities:
  id, contact_id, activity_type (enum: job_change, post, email, etc),
  source (enum: linkedin, twitter, gmail, manual),
  timestamp, raw_data jsonb, processed_content text,
  metadata jsonb, is_read boolean, priority_score float,
  created_at

-- Integrations
integrations:
  id, user_id, service (enum: linkedin, gmail, twitter),
  access_token_encrypted, refresh_token_encrypted,
  token_expires_at, scopes[], last_sync_at, 
  sync_status, error_log jsonb, enabled boolean

-- Relationship metadata
relationship_data:
  id, contact_id, interaction_count_30d,
  interaction_count_90d, email_count, meeting_count,
  last_email_sent, last_email_received,
  reconnect_suggested_at, reconnect_dismissed boolean

-- Groups
contact_groups:
  id, user_id, name, color, icon, created_at
  
contact_group_members:
  group_id, contact_id`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>API Endpoints Required</h3>
            <pre className={styles.codeBlock}><code>{`POST   /api/integrations/linkedin/connect
GET    /api/integrations/linkedin/callback
POST   /api/integrations/linkedin/sync
DELETE /api/integrations/linkedin/disconnect

POST   /api/integrations/gmail/connect
GET    /api/integrations/gmail/callback
POST   /api/integrations/gmail/sync

GET    /api/feed?offset=0&limit=50&filter=upcoming|yesterday|week
GET    /api/contacts?search=&group=&sort=
GET    /api/contacts/:id
PUT    /api/contacts/:id
POST   /api/contacts/:id/interactions
GET    /api/contacts/:id/timeline

GET    /api/groups
POST   /api/groups
PUT    /api/groups/:id
DELETE /api/groups/:id

GET    /api/reconnect/suggestions
POST   /api/reconnect/dismiss/:contactId
POST   /api/reconnect/complete/:contactId`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Backend Service Layer Files</h3>
            <pre className={styles.codeBlock}><code>{`backend/src/services/
  ContactService.ts
    - getContacts(userId, filters)
    - getContactById(contactId)
    - enrichContactData(contactId)
    - calculateRelationshipStrength(contactId)
    - searchContacts(query)
  
  FeedService.ts
    - getFeed(userId, pagination, filters)
    - rankFeedItems(items)
    - markAsRead(activityId)
  
  IntegrationService.ts
    - connectIntegration(userId, service, authCode)
    - refreshToken(integrationId)
    - disconnectIntegration(integrationId)
  
  ReconnectService.ts
    - generateSuggestions(userId)
    - calculateReconnectPriority(contactId)

backend/src/integrations/
  linkedin/
    LinkedInClient.ts
      - authenticate(code)
      - getProfile(accessToken)
      - getConnections(accessToken)
      - getActivity(accessToken, since)
    LinkedInParser.ts
      - parseProfile(rawData) -> Contact
      - parseJobChange(rawData) -> Activity
      - parsePost(rawData) -> Activity
    LinkedInSync.ts
      - syncUser(userId)
      - syncContacts(userId)
      - syncActivity(userId, since)
  
  gmail/
    GmailClient.ts
      - authenticate(code)
      - listMessages(accessToken, query)
      - getMessageHeaders(messageId)
    GmailParser.ts
      - extractCorrespondents(headers)
      - determineDirection(headers, userEmail)
    GmailSync.ts
      - syncEmails(userId, since)
      - analyzeInteractions(userId)
  
  twitter/
    TwitterClient.ts
    TwitterParser.ts
    TwitterSync.ts

backend/src/jobs/
  SyncScheduler.ts
    - scheduleUserSync(userId, service)
    - executeSync(syncJob)
  
  LinkedInSyncJob.ts
    - run(userId)
  
  GmailSyncJob.ts
    - run(userId)
  
  RelationshipScoreJob.ts
    - calculateScores(userId)
    - updateDatabase(scores)
  
  ReconnectSuggestionJob.ts
    - generateDailySuggestions(userId)`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Frontend Components Structure</h3>
            <pre className={styles.codeBlock}><code>{`frontend/src/components/
  feed/
    Feed.tsx
    FeedItem.tsx
    FeedFilters.tsx
    LinkedInJobChange.tsx
    TwitterPost.tsx
    EmailThread.tsx
    ReconnectSuggestion.tsx
    UpcomingReminder.tsx
  
  contacts/
    ContactList.tsx
    ContactCard.tsx
    ContactDetail.tsx
    ContactTimeline.tsx
    ContactAvatar.tsx
    ContactGroups.tsx
  
  groups/
    GroupList.tsx
    GroupDetail.tsx
    GroupForm.tsx
  
  settings/
    IntegrationSettings.tsx
    LinkedInConnect.tsx
    GmailConnect.tsx
    NotificationPreferences.tsx

frontend/src/pages/
  home.tsx
  contacts/
    index.tsx
    [id].tsx
  groups/
    index.tsx
    [id].tsx
  settings/
    integrations.tsx
    preferences.tsx

frontend/src/state/
  feedSlice.ts
  contactsSlice.ts
  integrationsSlice.ts
  groupsSlice.ts`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Worker / Background Job Setup</h3>
            <pre className={styles.codeBlock}><code>{`workers/src/
  queue/
    config.ts
    scheduler.ts
  
  jobs/
    sync-linkedin.ts
    sync-gmail.ts
    sync-twitter.ts
    calculate-relationship-scores.ts
    generate-reconnect-suggestions.ts
    cleanup-old-activities.ts`}</code></pre>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Third‑Party Integration Requirements</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>LinkedIn</h3>
              <ul className={styles.list}>
                <li>OAuth 2.0 client credentials</li>
                <li>Scopes: r_liteprofile, r_emailaddress, r_basicprofile, r_network</li>
                <li>Endpoints: /v2/me, /v2/connections, /v2/shares</li>
                <li>Rate limits: ~100 requests/day (basic tier)</li>
                <li>Webhook support: limited</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Gmail</h3>
              <ul className={styles.list}>
                <li>Google OAuth 2.0</li>
                <li>Scopes: gmail.readonly, gmail.metadata</li>
                <li>Endpoints: users.messages.list, users.messages.get</li>
                <li>Rate limits: 250 units/user/second</li>
                <li>Pub/Sub webhooks available</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Twitter/X</h3>
              <ul className={styles.list}>
                <li>OAuth 2.0 or OAuth 1.0a</li>
                <li>API v2 endpoints: /users/:id, /tweets</li>
                <li>Rate limits: restricted on free tier</li>
                <li>Webhooks: paid tiers only</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Algorithm Implementations Required</h2>
          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Relationship Strength</h3>
            <pre className={styles.codeBlock}><code>{`function calculateRelationshipStrength(contactId: string): number {
  const interactions = getInteractions(contactId, 90);
  const emailWeight = 2.0;
  const meetingWeight = 3.0;
  const linkedinWeight = 0.5;
  
  const score = interactions.reduce((acc, interaction) => {
    const recencyFactor = Math.exp(-daysSince(interaction.date) / 30);
    const weight = getWeightForType(interaction.type);
    return acc + (weight * recencyFactor);
  }, 0);
  
  return Math.min(100, score);
}`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Reconnect Priority</h3>
            <pre className={styles.codeBlock}><code>{`function calculateReconnectPriority(contactId: string): number {
  const daysSinceContact = getDaysSinceLastInteraction(contactId);
  const relationshipStrength = getRelationshipStrength(contactId);
  const expectedCadence = getExpectedCadence(contactId);
  
  if (daysSinceContact < expectedCadence * 0.8) return 0;
  
  const overdueFactor = daysSinceContact / expectedCadence;
  return relationshipStrength * overdueFactor;
}`}</code></pre>
          </div>

          <div className={styles.subSection}>
            <h3 className={styles.subTitle}>Feed Ranking</h3>
            <pre className={styles.codeBlock}><code>{`function rankFeedItems(items: Activity[]): Activity[] {
  return items.sort((a, b) => {
    const aScore = calculateFeedScore(a);
    const bScore = calculateFeedScore(b);
    return bScore - aScore;
  });
}

function calculateFeedScore(activity: Activity): number {
  const contactStrength = getRelationshipStrength(activity.contactId);
  const recencyScore = Math.exp(-hoursSince(activity.timestamp) / 24);
  const typeWeight = getActivityTypeWeight(activity.type);
  
  return contactStrength * recencyScore * typeWeight;
}`}</code></pre>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Infrastructure Requirements</h2>
          <div className={styles.grid}>
            <div className={styles.card}>
              <h3>Deployment</h3>
              <ul className={styles.list}>
                <li>Docker containers for API + workers</li>
                <li>PostgreSQL 14+</li>
                <li>Redis for queue and caching</li>
                <li>S3‑compatible storage</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Monitoring</h3>
              <ul className={styles.list}>
                <li>Integration health checks</li>
                <li>Sync job success/failure tracking</li>
                <li>API rate‑limit monitoring</li>
                <li>Feed performance metrics</li>
              </ul>
            </div>
            <div className={styles.card}>
              <h3>Security</h3>
              <ul className={styles.list}>
                <li>OAuth token encryption at rest</li>
                <li>JWT authentication</li>
                <li>Rate limiting on endpoints</li>
                <li>GDPR compliance</li>
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Development Estimates</h2>
          <p className={styles.note}>
            Placeholder estimates — to be refined with scope, team size, and
            sequencing.
          </p>
          <ul className={styles.list}>
            <li>Database migration and setup</li>
            <li>LinkedIn integration</li>
            <li>Gmail integration</li>
            <li>Feed implementation</li>
            <li>Relationship scoring algorithms</li>
            <li>Background job infrastructure</li>
            <li>Frontend components</li>
            <li>Testing and polish</li>
          </ul>
        </section>
      </main>

      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} TellDoug. All rights reserved.</p>
      </footer>
    </div>
  );
}
