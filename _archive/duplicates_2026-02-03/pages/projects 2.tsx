import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Plus, Calendar as CalendarIcon, MoreVertical, Trash, Edit } from "lucide-react";
import { useProjectsList, useDeleteProject } from "../helpers/useProjectsApi";
import { Projects, ProjectStatus } from "../helpers/schema";
import { Selectable } from "kysely";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/DropdownMenu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select";
import { ProjectDialog } from "../components/ProjectDialog";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { toast } from "sonner";
import styles from "./projects.module.css";

export default function ProjectsPage() {
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const { data, isLoading } = useProjectsList(
    statusFilter === "all" ? {} : { status: statusFilter },
  );
  const deleteMutation = useDeleteProject();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Selectable<Projects> | null>(
    null,
  );

  const handleAdd = () => {
    setSelectedProject(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (project: Selectable<Projects>) => {
    setSelectedProject(project);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Project deleted successfully");
          },
          onError: () => {
            toast.error("Failed to delete project");
          },
        },
      );
    }
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "warning";
      case "cancelled":
        return "destructive";
      case "on_hold":
        return "secondary"; // Using secondary for orange-ish feel if customized, or default
      case "planning":
      default:
        return "default"; // Blue
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Projects | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Projects</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Project
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Select
            value={statusFilter}
            onValueChange={(val) => setStatusFilter(val as ProjectStatus | "all")}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="planning">Planning</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.grid}>
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardHeader}>
                <Skeleton style={{ width: "60%", height: "1.5rem" }} />
                <Skeleton style={{ width: "24px", height: "24px" }} />
              </div>
              <div className={styles.cardBody}>
                <Skeleton style={{ width: "100%", height: "1rem", marginBottom: "0.5rem" }} />
                <Skeleton style={{ width: "80%", height: "1rem" }} />
              </div>
              <div className={styles.cardFooter}>
                <Skeleton style={{ width: "80px", height: "1.5rem", borderRadius: "999px" }} />
                <Skeleton style={{ width: "100px", height: "1rem" }} />
              </div>
            </div>
          ))
        ) : data?.projects.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No projects found matching your filter.</p>
            {statusFilter !== "all" && (
              <Button variant="link" onClick={() => setStatusFilter("all")}>
                Clear filter
              </Button>
            )}
          </div>
        ) : (
          data?.projects.map((project) => (
            <div 
              key={project.id} 
              ref={project.id === highlightedId ? highlightRef : undefined}
              className={`${styles.card} ${
                project.id === highlightedId ? highlightClassName : ""
              }`}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{project.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(project)}>
                      <Edit size={14} style={{ marginRight: 8 }} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(project.id)}
                      className={styles.deleteItem}
                    >
                      <Trash size={14} style={{ marginRight: 8 }} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.description}>
                  {project.description || "No description provided."}
                </p>
              </div>
              <div className={styles.cardFooter}>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {formatStatus(project.status)}
                </Badge>
                {(project.startDate || project.endDate) && (
                  <div className={styles.dateInfo}>
                    <CalendarIcon size={14} />
                    <span>
                      {project.startDate
                        ? new Date(project.startDate).toLocaleDateString()
                        : "..."}
                      {" - "}
                      {project.endDate
                        ? new Date(project.endDate).toLocaleDateString()
                        : "..."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ProjectDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        project={selectedProject}
      />
    </div>
  );
}