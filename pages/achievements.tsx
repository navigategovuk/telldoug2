import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit, ExternalLink } from "lucide-react";
import { useAchievementsList, useDeleteAchievement } from "../helpers/useAchievementsApi";
import { Achievements, AchievementCategoryArrayValues } from "../helpers/schema";
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
import { AchievementDialog } from "../components/AchievementDialog";
import { toast } from "sonner";
import styles from "./achievements.module.css";

export default function AchievementsPage() {
  const [category, setCategory] = useState<string>("_all");
  
  const { data, isLoading } = useAchievementsList({
    category: category !== "_all" ? (category as any) : undefined,
  });
  
  const deleteMutation = useDeleteAchievement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Selectable<Achievements> | null>(null);

  const handleAdd = () => {
    setSelectedAchievement(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (achievement: Selectable<Achievements>) => {
    setSelectedAchievement(achievement);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this achievement?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Achievement deleted successfully"),
          onError: () => toast.error("Failed to delete achievement"),
        }
      );
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Achievements | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Achievements</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Achievement
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterGroup}>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_all">All Categories</SelectItem>
              {AchievementCategoryArrayValues.map((c) => (
                <SelectItem key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
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
              <th>Title</th>
              <th>Category</th>
              <th>Description</th>
              <th>Impact</th>
              <th>Evidence</th>
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
                  <td><Skeleton style={{ width: "200px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "100px", height: "1rem" }} /></td>
                  <td><Skeleton style={{ width: "24px", height: "24px" }} /></td>
                  <td><Skeleton style={{ width: "24px", height: "24px" }} /></td>
                </tr>
              ))
            ) : data?.achievements.length === 0 ? (
              <tr>
                <td colSpan={7} className={styles.emptyState}>
                  No achievements found. Add an achievement to get started!
                </td>
              </tr>
            ) : (
              data?.achievements.map((item) => (
                <tr key={item.id}>
                  <td className={styles.dateCell}>
                    {new Date(item.achievedDate).toLocaleDateString()}
                  </td>
                  <td className={styles.titleCell}>{item.title}</td>
                  <td>
                    <Badge variant="secondary">
                      {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    </Badge>
                  </td>
                  <td className={styles.truncateCell} title={item.description}>
                    {item.description}
                  </td>
                  <td className={styles.truncateCell} title={item.quantifiableImpact || ""}>
                    {item.quantifiableImpact || "-"}
                  </td>
                  <td>
                    {item.evidenceUrl ? (
                      <a
                        href={item.evidenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.link}
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      "-"
                    )}
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

      <AchievementDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        achievement={selectedAchievement}
      />
    </div>
  );
}