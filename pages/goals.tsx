import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit } from "lucide-react";
import { useGoalsList, useDeleteGoal } from "../helpers/useGoalsApi";
import { Goals, GoalTypeArrayValues, GoalStatusArrayValues, GoalStatus } from "../helpers/schema";
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
import { GoalDialog } from "../components/GoalDialog";
import { toast } from "sonner";
import styles from "./goals.module.css";

export default function GoalsPage() {
  const [goalType, setGoalType] = useState<string>("_all");
  const [status, setStatus] = useState<string>("_all");
  
  const { data, isLoading } = useGoalsList({
    goalType: goalType !== "_all" ? (goalType as any) : undefined,
    status: status !== "_all" ? (status as any) : undefined,
  });
  
  const deleteMutation = useDeleteGoal();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Selectable<Goals> | null>(null);

  const handleAdd = () => {
    setSelectedGoal(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (goal: Selectable<Goals>) => {
    setSelectedGoal(goal);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this goal?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Goal deleted successfully"),
          onError: () => toast.error("Failed to delete goal"),
        }
      );
    }
  };

  const getStatusColor = (status: GoalStatus) => {
    switch (status) {
      case "not_started": return "secondary";
      case "in_progress": return "warning";
      case "completed": return "success";
      case "abandoned": return "destructive";
      default: return "default";
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Goals | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Goals</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Goal
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <Select value={goalType} onValueChange={setGoalType}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Types</SelectItem>
              {GoalTypeArrayValues.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Statuses</SelectItem>
              {GoalStatusArrayValues.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
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
              <th>Target Date</th>
              <th>Title</th>
              <th>Type</th>
              <th>Status</th>
              <th>Description</th>
              <th style={{ width: "50px" }}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td><Skeleton style={{ width: "80px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "150px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1.5rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1.5rem" }} /></td>
                  <td><Skeleton style={{ width: "200px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "24px", height: "24px" }} /></td>
                </tr>
              ))
            ) : data?.goals.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  No goals found. Add a goal to get started!
                </td>
              </tr>
            ) : (
              data?.goals.map((item) => (
                <tr key={item.id}>
                  <td className={styles.dateCell}>
                    {new Date(item.targetDate).toLocaleDateString()}
                  </td>
                  <td className={styles.titleCell}>{item.title}</td>
                  <td>
                    <Badge variant="outline">
                      {item.goalType.charAt(0).toUpperCase() + item.goalType.slice(1)}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={getStatusColor(item.status)}>
                      {item.status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                    </Badge>
                  </td>
                  <td className={styles.truncateCell} title={item.description}>
                    {item.description}
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

      <GoalDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        goal={selectedGoal}
      />
    </div>
  );
}