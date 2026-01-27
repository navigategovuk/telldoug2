import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit } from "lucide-react";
import { useFeedbackList, useDeleteFeedback } from "../helpers/useFeedbackApi";
import { usePeopleList } from "../helpers/usePeopleApi";
import { Feedback, FeedbackTypeArrayValues } from "../helpers/schema";
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
import { FeedbackDialog } from "../components/FeedbackDialog";
import { toast } from "sonner";
import styles from "./feedback.module.css";

export default function FeedbackPage() {
  const [feedbackType, setFeedbackType] = useState<string>("_all");
  const [personId, setPersonId] = useState<string>("_all");
  
  const { data, isLoading } = useFeedbackList({
    feedbackType: feedbackType !== "_all" ? (feedbackType as any) : undefined,
    personId: personId !== "_all" ? personId : undefined,
  });
  
  const { data: peopleData } = usePeopleList();
  const deleteMutation = useDeleteFeedback();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<Selectable<Feedback> | null>(null);

  const handleAdd = () => {
    setSelectedFeedback(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (feedback: Selectable<Feedback>) => {
    setSelectedFeedback(feedback);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Feedback deleted successfully"),
          onError: () => toast.error("Failed to delete feedback"),
        }
      );
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Feedback | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Feedback</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Feedback
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <Select value={feedbackType} onValueChange={setFeedbackType}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Types</SelectItem>
              {FeedbackTypeArrayValues.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={personId} onValueChange={setPersonId}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All People" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All People</SelectItem>
              {peopleData?.people.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
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
              <th>Context</th>
              <th>Notes</th>
              <th style={{ width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1.5rem" }} /></td>
                  <td><Skeleton style={{ width: "120px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "200px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "24px", height: "24px" }} /></td>
                </tr>
              ))
            ) : data?.feedback.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No feedback found. Add some feedback to get started!
                </td>
              </tr>
            ) : (
              data?.feedback.map((item) => (
                <tr key={item.id}>
                  <td className={styles.dateCell}>
                    {new Date(item.feedbackDate).toLocaleDateString()}
                  </td>
                  <td>
                    <Badge variant="outline">
                      {item.feedbackType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                  </td>
                  <td className={styles.personCell}>{item.personName}</td>
                  <td className={styles.truncateCell} title={item.context || ""}>
                    {item.context || "-"}
                  </td>
                  <td className={styles.truncateCell} title={item.notes}>
                    {item.notes}
                  </td>
                  <td>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                          <Edit size={14} style={{ marginRight: 8 }} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(item.id)}
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

      <FeedbackDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        feedback={selectedFeedback}
      />
    </div>
  );
}