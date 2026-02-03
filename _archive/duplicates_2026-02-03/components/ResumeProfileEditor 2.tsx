/**
 * ResumeProfileEditor Component
 * Displays profile information with sections for work, education, skills, projects
 * Uses collapsible sections for organization
 */

import {
  User,
  Briefcase,
  GraduationCap,
  Award,
  FolderOpen,
  Plus,
  Trash2,
  MapPin,
  ChevronDown,
  Database,
} from "lucide-react";
import React, { useState } from "react";

import { Button } from "./Button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./Collapsible";
import { Input } from "./Input";
import { PopulateFromCareerDialog } from "./PopulateFromCareerDialog";
import styles from "./ResumeProfileEditor.module.css";
import { Spinner } from "./Spinner";
import {
  useProfile,
  useWorkExperiences,
  useEducation,
  useProfileSkills,
  useProfileProjects,
  useCreateProfileSkill,
  useDeleteProfileSkill,
  useDeleteWorkExperience,
  useDeleteEducation,
  useDeleteProfileProject,
} from "../helpers/useProfileApi";

interface ResumeProfileEditorProps {
  profileId?: string;
  className?: string;
}

export function ResumeProfileEditor({ profileId, className }: ResumeProfileEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    work: true,
    education: true,
    skills: true,
    projects: true,
  });
  const [populateDialogOpen, setPopulateDialogOpen] = useState(false);

  // Profile data
  const profileQuery = useProfile(profileId);
  const workQuery = useWorkExperiences({ profileId });
  const educationQuery = useEducation({ profileId });
  const skillsQuery = useProfileSkills({ profileId });
  const projectsQuery = useProfileProjects({ profileId });

  // Mutations
  const createSkill = useCreateProfileSkill();
  const deleteSkill = useDeleteProfileSkill();
  const deleteWork = useDeleteWorkExperience();
  const deleteEducation = useDeleteEducation();
  const deleteProject = useDeleteProfileProject();

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const profile = profileQuery.data?.profile;
  const location = profile?.location as { city?: string; region?: string } | null;

  if (profileQuery.isLoading) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.loadingContainer}>
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Populate from Career Button */}
      <div className={styles.actionBar}>
        <Button
          variant="outline"
          onClick={() => setPopulateDialogOpen(true)}
          className={styles.populateButton}
        >
          <Database className={styles.populateIcon} />
          Populate from Career History
        </Button>
      </div>

      {/* Profile Section */}
      <section className={styles.section}>
        <Collapsible open={expandedSections.profile} onOpenChange={() => toggleSection("profile")}>
          <div className={styles.sectionHeader}>
            <CollapsibleTrigger className={styles.collapsibleTrigger}>
              <h2 className={styles.sectionTitle}>
                <User className={styles.sectionIcon} />
                Personal Information
              </h2>
              <ChevronDown
                className={`${styles.collapseIcon} ${expandedSections.profile ? styles.expanded : ""}`}
              />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            <div className={styles.displayGrid}>
              <div className={styles.displayItem}>
                <span className={styles.displayLabel}>Full Name</span>
                <span className={styles.displayValue}>{profile?.label || <span className={styles.displayValueMuted}>Not set</span>}</span>
              </div>
              <div className={styles.displayItem}>
                <span className={styles.displayLabel}>Email</span>
                <span className={styles.displayValue}>{profile?.email || <span className={styles.displayValueMuted}>Not set</span>}</span>
              </div>
              <div className={styles.displayItem}>
                <span className={styles.displayLabel}>Phone</span>
                <span className={styles.displayValue}>{profile?.phone || <span className={styles.displayValueMuted}>Not set</span>}</span>
              </div>
              <div className={styles.displayItem}>
                <span className={styles.displayLabel}>Location</span>
                <span className={`${styles.displayValue} ${styles.locationDisplay}`}>
                  <MapPin className={styles.locationIcon} />
                  {location?.city || location?.region
                    ? [location.city, location.region].filter(Boolean).join(", ")
                    : <span className={styles.displayValueMuted}>Not set</span>}
                </span>
              </div>
              <div className={`${styles.displayItem} ${styles.span2}`}>
                <span className={styles.displayLabel}>Professional Summary</span>
                <p className={styles.displayValue}>
                  {profile?.summary || <span className={styles.displayValueMuted}>No summary provided</span>}
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Work Experience Section */}
      <section className={styles.section}>
        <Collapsible open={expandedSections.work} onOpenChange={() => toggleSection("work")}>
          <div className={styles.sectionHeader}>
            <CollapsibleTrigger className={styles.collapsibleTrigger}>
              <h2 className={styles.sectionTitle}>
                <Briefcase className={styles.sectionIcon} />
                Work Experience
                <span className={styles.sectionCount}>({workQuery.data?.work?.length ?? 0})</span>
              </h2>
              <ChevronDown className={`${styles.collapseIcon} ${expandedSections.work ? styles.expanded : ""}`} />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {workQuery.isLoading ? (
              <div className={styles.loadingContainer}><Spinner /></div>
            ) : (workQuery.data?.work?.length ?? 0) === 0 ? (
              <div className={styles.emptyState}>
                <Briefcase className={styles.emptyIcon} />
                <span className={styles.emptyText}>No work experience added</span>
              </div>
            ) : (
              <div className={styles.entryList}>
                {workQuery.data?.work?.map((entry) => (
                  <div key={entry.id} className={styles.entryItem}>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryInfo}>
                        <span className={styles.entryTitle}>{entry.position}</span>
                        <span className={styles.entrySubtitle}>{entry.company}</span>
                        <span className={styles.entryDate}>
                          {entry.startDate ? new Date(entry.startDate).getFullYear() : ""} 
                          {" - "}
                          {entry.endDate ? new Date(entry.endDate).getFullYear() : "Present"}
                        </span>
                      </div>
                      <div className={styles.entryActions}>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.danger}`}
                          onClick={() => deleteWork.mutate({ id: entry.id })}
                          title="Delete work experience"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {entry.summary && <p className={styles.entryDescription}>{entry.summary}</p>}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Education Section */}
      <section className={styles.section}>
        <Collapsible open={expandedSections.education} onOpenChange={() => toggleSection("education")}>
          <div className={styles.sectionHeader}>
            <CollapsibleTrigger className={styles.collapsibleTrigger}>
              <h2 className={styles.sectionTitle}>
                <GraduationCap className={styles.sectionIcon} />
                Education
                <span className={styles.sectionCount}>({educationQuery.data?.education?.length ?? 0})</span>
              </h2>
              <ChevronDown className={`${styles.collapseIcon} ${expandedSections.education ? styles.expanded : ""}`} />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {educationQuery.isLoading ? (
              <div className={styles.loadingContainer}><Spinner /></div>
            ) : (educationQuery.data?.education?.length ?? 0) === 0 ? (
              <div className={styles.emptyState}>
                <GraduationCap className={styles.emptyIcon} />
                <span className={styles.emptyText}>No education added</span>
              </div>
            ) : (
              <div className={styles.entryList}>
                {educationQuery.data?.education?.map((entry) => (
                  <div key={entry.id} className={styles.entryItem}>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryInfo}>
                        <span className={styles.entryTitle}>
                          {entry.studyType ? `${entry.studyType} in ${entry.area || ""}` : entry.area || "Degree"}
                        </span>
                        <span className={styles.entrySubtitle}>{entry.institution}</span>
                        {entry.endDate && (
                          <span className={styles.entryDate}>{new Date(entry.endDate).getFullYear()}</span>
                        )}
                      </div>
                      <div className={styles.entryActions}>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.danger}`}
                          onClick={() => deleteEducation.mutate({ id: entry.id })}
                          title="Delete education"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Skills Section */}
      <SkillsSection
        skills={skillsQuery.data?.skills ?? []}
        isExpanded={expandedSections.skills}
        onToggle={() => toggleSection("skills")}
        onAdd={(name) => createSkill.mutate({ 
          profileId, 
          name, 
          proficiency: "intermediate",
          keywords: []
        })}
        onRemove={(id) => deleteSkill.mutate({ id })}
        isLoading={skillsQuery.isLoading}
        isAdding={createSkill.isPending}
      />

      {/* Projects Section */}
      <section className={styles.section}>
        <Collapsible open={expandedSections.projects} onOpenChange={() => toggleSection("projects")}>
          <div className={styles.sectionHeader}>
            <CollapsibleTrigger className={styles.collapsibleTrigger}>
              <h2 className={styles.sectionTitle}>
                <FolderOpen className={styles.sectionIcon} />
                Projects
                <span className={styles.sectionCount}>({projectsQuery.data?.projects?.length ?? 0})</span>
              </h2>
              <ChevronDown className={`${styles.collapseIcon} ${expandedSections.projects ? styles.expanded : ""}`} />
            </CollapsibleTrigger>
          </div>

          <CollapsibleContent>
            {projectsQuery.isLoading ? (
              <div className={styles.loadingContainer}><Spinner /></div>
            ) : (projectsQuery.data?.projects?.length ?? 0) === 0 ? (
              <div className={styles.emptyState}>
                <FolderOpen className={styles.emptyIcon} />
                <span className={styles.emptyText}>No projects added</span>
              </div>
            ) : (
              <div className={styles.entryList}>
                {projectsQuery.data?.projects?.map((project) => (
                  <div key={project.id} className={styles.entryItem}>
                    <div className={styles.entryHeader}>
                      <div className={styles.entryInfo}>
                        <span className={styles.entryTitle}>{project.name}</span>
                        {project.url && (
                          <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.entrySubtitle}>
                            {project.url}
                          </a>
                        )}
                      </div>
                      <div className={styles.entryActions}>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.danger}`}
                          onClick={() => deleteProject.mutate({ id: project.id })}
                          title="Delete project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {project.description && <p className={styles.entryDescription}>{project.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </section>

      {/* Populate from Career Dialog */}
      {profile?.id && (
        <PopulateFromCareerDialog
          open={populateDialogOpen}
          onOpenChange={setPopulateDialogOpen}
          profileId={profile.id}
          workspaceId={profile.workspaceId ?? undefined}
        />
      )}
    </div>
  );
}

// Standalone Skills Section with add functionality
interface SkillsSectionProps {
  skills: Array<{ id: string; name: string }>;
  isExpanded: boolean;
  onToggle: () => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
  isAdding: boolean;
}

function SkillsSection({ skills, isExpanded, onToggle, onAdd, onRemove, isLoading, isAdding }: SkillsSectionProps) {
  const [newSkill, setNewSkill] = useState("");

  const handleAdd = () => {
    if (newSkill.trim()) {
      onAdd(newSkill.trim());
      setNewSkill("");
    }
  };

  return (
    <section className={styles.section}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <div className={styles.sectionHeader}>
          <CollapsibleTrigger className={styles.collapsibleTrigger}>
            <h2 className={styles.sectionTitle}>
              <Award className={styles.sectionIcon} />
              Skills
              <span className={styles.sectionCount}>({skills.length})</span>
            </h2>
            <ChevronDown className={`${styles.collapseIcon} ${isExpanded ? styles.expanded : ""}`} />
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className={styles.addEntryRow}>
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder="Add a skill..."
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAdd())}
            />
            <Button onClick={handleAdd} disabled={isAdding || !newSkill.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className={styles.loadingContainer}><Spinner /></div>
          ) : skills.length === 0 ? (
            <div className={styles.emptyState}>
              <Award className={styles.emptyIcon} />
              <span className={styles.emptyText}>No skills added</span>
            </div>
          ) : (
            <div className={styles.tagList}>
              {skills.map((skill) => (
                <span key={skill.id} className={styles.tag}>
                  {skill.name}
                  <button
                    type="button"
                    className={styles.tagRemove}
                    onClick={() => onRemove(skill.id)}
                    title={`Remove ${skill.name}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </section>
  );
}

export default ResumeProfileEditor;
