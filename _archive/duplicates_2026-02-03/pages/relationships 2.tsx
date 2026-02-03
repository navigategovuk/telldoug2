import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreHorizontal, Trash, Edit, ArrowRight } from "lucide-react";
import { useRelationshipsList, useDeleteRelationship } from "../helpers/useRelationshipsApi";
import { Relationships, EntityType } from "../helpers/schema";
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
import { RelationshipDialog } from "../components/RelationshipDialog";
import { toast } from "sonner";
import { usePeopleList } from "../helpers/usePeopleApi";
import { useProjectsList } from "../helpers/useProjectsApi";
import { useSkillsList } from "../helpers/useSkillsApi";
import { useJobsList } from "../helpers/useJobsApi";
import { useInstitutionsList } from "../helpers/useInstitutionsApi";
import { useEventsList } from "../helpers/useEventsApi";
import styles from "./relationships.module.css";

export default function RelationshipsPage() {
  const [sourceTypeFilter, setSourceTypeFilter] = useState<EntityType | "all">("all");
  const { data, isLoading } = useRelationshipsList(sourceTypeFilter === "all" ? {} : { sourceType: sourceTypeFilter });
  const deleteMutation = useDeleteRelationship();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRelationship, setSelectedRelationship] = useState<Selectable<Relationships> | null>(null);

  // Fetch all entities to resolve names
  // In a real app, this would be handled by the backend returning joined data or a dedicated lookup endpoint
  const { data: people } = usePeopleList();
  const { data: projects } = useProjectsList();
  const { data: skills } = useSkillsList();
  const { data: jobs } = useJobsList();
  const { data: institutions } = useInstitutionsList();
  const { data: events } = useEventsList();

  const getEntityName = (type: EntityType, id: string) => {
    switch (type) {
      case "person": return people?.people.find(p => p.id === id)?.name || "Unknown Person";
      case "project": return projects?.projects.find(p => p.id === id)?.name || "Unknown Project";
      case "skill": return skills?.skills.find(s => s.id === id)?.name || "Unknown Skill";
      case "job": {
        const job = jobs?.jobs.find(j => j.id === id);
        return job ? `${job.title} at ${job.company}` : "Unknown Job";
      }
      case "institution": return institutions?.institutions.find(i => i.id === id)?.name || "Unknown Institution";
      case "event": return events?.events.find(e => e.id === id)?.title || "Unknown Event";
      default: return "Unknown Entity";
    }
  };

  const handleAdd = () => {
    setSelectedRelationship(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (rel: Selectable<Relationships>) => {
    setSelectedRelationship(rel);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this relationship?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Relationship deleted successfully"),
          onError: () => toast.error("Failed to delete relationship"),
        }
      );
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Relationships | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Relationships</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Relationship
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Select
            value={sourceTypeFilter}
            onValueChange={(val) => setSourceTypeFilter(val as EntityType | "all")}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by source type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Source Types</SelectItem>
              <SelectItem value="person">Person</SelectItem>
              <SelectItem value="project">Project</SelectItem>
              <SelectItem value="skill">Skill</SelectItem>
              <SelectItem value="job">Job</SelectItem>
              <SelectItem value="institution">Institution</SelectItem>
              <SelectItem value="event">Event</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Source</th>
              <th>Relationship</th>
              <th>Target</th>
              <th>Notes</th>
              <th className={styles.actionsHeader}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "200px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "32px", height: "32px" }} /></td>
                </tr>
              ))
            ) : data?.relationships.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No relationships found.
                </td>
              </tr>
            ) : (
              data?.relationships.map((rel) => (
                <tr key={rel.id} className={styles.row}>
                  <td>
                    <div className={styles.entityCell}>
                      <Badge variant="outline" className={styles.typeBadge}>{rel.sourceType}</Badge>
                      <span className={styles.entityName}>{getEntityName(rel.sourceType, rel.sourceId)}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.relationCell}>
                      <ArrowRight size={14} className={styles.arrowIcon} />
                      <span className={styles.relationLabel}>{rel.relationshipLabel}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.entityCell}>
                      <Badge variant="outline" className={styles.typeBadge}>{rel.targetType}</Badge>
                      <span className={styles.entityName}>{getEntityName(rel.targetType, rel.targetId)}</span>
                    </div>
                  </td>
                  <td className={styles.notesCell}>
                    {rel.notes || <span className={styles.emptyText}>—</span>}
                  </td>
                  <td className={styles.actionsCell}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(rel)}>
                          <Edit size={14} style={{ marginRight: 8 }} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(rel.id)}
                          className={styles.deleteItem}
                        >
                          <Trash size={14} style={{ marginRight: 8 }} /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <RelationshipDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        relationship={selectedRelationship}
      />
    </div>
  );
}