import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreHorizontal, Trash, Edit } from "lucide-react";
import { useInteractionsList, useDeleteInteraction } from "../helpers/useInteractionsApi";
import { usePeopleList } from "../helpers/usePeopleApi";
import { InteractionType } from "../helpers/schema";
import { InteractionWithDetails } from "../endpoints/interactions/list_GET.schema";
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
import { InteractionDialog } from "../components/InteractionDialog";
import { toast } from "sonner";
import styles from "./interactions.module.css";

export default function InteractionsPage() {
  const [typeFilter, setTypeFilter] = useState<InteractionType | "all">("all");
  const [personFilter, setPersonFilter] = useState<string>("all");

  const { data, isLoading } = useInteractionsList({
    interactionType: typeFilter === "all" ? undefined : typeFilter,
    personId: personFilter === "all" ? undefined : personFilter,
  });

  const { data: peopleData } = usePeopleList();
  const deleteMutation = useDeleteInteraction();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionWithDetails | null>(null);

  const handleAdd = () => {
    setSelectedInteraction(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (interaction: InteractionWithDetails) => {
    setSelectedInteraction(interaction);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this interaction?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Interaction deleted successfully"),
          onError: () => toast.error("Failed to delete interaction"),
        }
      );
    }
  };

  const getTypeBadgeVariant = (type: InteractionType) => {
    switch (type) {
      case "meeting": return "default"; // Blue
      case "call": return "success"; // Green
      case "email": return "secondary"; // Purple-ish
      case "coffee": return "warning"; // Orange
      default: return "outline";
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Interactions | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Interactions</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Log Interaction
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as InteractionType | "all")}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="coffee">Coffee</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className={styles.filterContainer}>
          <Select
            value={personFilter}
            onValueChange={setPersonFilter}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by person" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All People</SelectItem>
              {peopleData?.people.map((person) => (
                <SelectItem key={person.id} value={person.id}>
                  {person.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Person</th>
              <th>Project</th>
              <th>Tags</th>
              <th>Notes</th>
              <th className={styles.actionsHeader}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "60px", height: "1.5rem" }} /></td>
                  <td><Skeleton style={{ width: "120px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "32px", height: "32px" }} /></td>
                </tr>
              ))
            ) : data?.interactions.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No interactions found. Log one to get started!
                </td>
              </tr>
            ) : (
              data?.interactions.map((interaction) => (
                <tr key={interaction.id} className={styles.row}>
                  <td className={styles.dateCell}>
                    {new Date(interaction.interactionDate).toLocaleDateString()}
                  </td>
                  <td>
                    <Badge variant={getTypeBadgeVariant(interaction.interactionType)} className={styles.typeBadge}>
                      {interaction.interactionType}
                    </Badge>
                  </td>
                  <td className={styles.personName}>
                    {interaction.personName || "Unknown"}
                  </td>
                  <td className={styles.projectName}>
                    {interaction.projectName || "—"}
                  </td>
                  <td>
                    <div className={styles.tagsContainer}>
                      {interaction.tags ? (
                        interaction.tags.split(',').map((tag, idx) => (
                          <Badge key={idx} variant="outline" className={styles.tagBadge}>
                            {tag.trim()}
                          </Badge>
                        ))
                      ) : (
                        <span style={{ color: "var(--muted-foreground)", opacity: 0.5 }}>—</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className={styles.notesPreview}>
                      {interaction.notes || "—"}
                    </div>
                  </td>
                  <td className={styles.actionsCell}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(interaction)}>
                          <Edit size={14} style={{ marginRight: 8 }} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(interaction.id)}
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

      <InteractionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        interaction={selectedInteraction}
      />
    </div>
  );
}