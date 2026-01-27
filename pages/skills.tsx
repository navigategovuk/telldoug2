import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Plus, Search, MoreVertical, Trash, Edit } from "lucide-react";
import { useSkillsList, useDeleteSkill } from "../helpers/useSkillsApi";
import { Skills, SkillProficiency } from "../helpers/schema";
import { Selectable } from "kysely";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Skeleton } from "../components/Skeleton";
import { Badge } from "../components/Badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/DropdownMenu";
import { SkillDialog } from "../components/SkillDialog";
import { useDebounce } from "../helpers/useDebounce";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { toast } from "sonner";
import styles from "./skills.module.css";

export default function SkillsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = useSkillsList({ search: debouncedSearch });
  const deleteMutation = useDeleteSkill();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Selectable<Skills> | null>(null);

  const handleAdd = () => {
    setSelectedSkill(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (skill: Selectable<Skills>) => {
    setSelectedSkill(skill);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this skill?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Skill deleted successfully"),
          onError: () => toast.error("Failed to delete skill"),
        }
      );
    }
  };

  const getProficiencyColor = (proficiency: SkillProficiency) => {
    switch (proficiency) {
      case "beginner": return "secondary"; // Gray-ish
      case "intermediate": return "default"; // Blue
      case "advanced": return "warning"; // Orange/Purple metaphor
      case "expert": return "success"; // Green
      default: return "outline";
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Skills | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Skills</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Skill
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            placeholder="Search skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
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
                <Skeleton style={{ width: "40%", height: "1rem", marginBottom: "0.5rem" }} />
                <Skeleton style={{ width: "80%", height: "1rem" }} />
              </div>
            </div>
          ))
        ) : data?.skills.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No skills found. Add a skill to get started!</p>
          </div>
        ) : (
          data?.skills.map((skill) => (
            <div 
              key={skill.id} 
              ref={skill.id === highlightedId ? highlightRef : undefined}
              className={`${styles.card} ${
                skill.id === highlightedId ? highlightClassName : ""
              }`}
            >
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{skill.name}</h3>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(skill)}>
                      <Edit size={14} style={{ marginRight: 8 }} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(skill.id)}
                      className={styles.deleteItem}
                    >
                      <Trash size={14} style={{ marginRight: 8 }} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className={styles.cardBody}>
                <div className={styles.badges}>
                  <Badge variant={getProficiencyColor(skill.proficiency)}>
                    {skill.proficiency}
                  </Badge>
                  {skill.category && (
                    <Badge variant="outline" className={styles.categoryBadge}>
                      {skill.category}
                    </Badge>
                  )}
                </div>
                {skill.notes && <p className={styles.notes}>{skill.notes}</p>}
              </div>
            </div>
          ))
        )}
      </div>

      <SkillDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        skill={selectedSkill}
      />
    </div>
  );
}