import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, Search, MoreVertical, Trash, Edit, Calendar as CalendarIcon, DollarSign } from "lucide-react";
import { useLearningList, useDeleteLearning } from "../helpers/useLearningApi";
import { Learning, LearningType, LearningStatus, LearningTypeArrayValues, LearningStatusArrayValues } from "../helpers/schema";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/Select";
import { LearningDialog } from "../components/LearningDialog";
import { useDebounce } from "../helpers/useDebounce";
import { toast } from "sonner";
import { format } from "date-fns";
import styles from "./learning.module.css";

export default function LearningPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<LearningType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<LearningStatus | "all">("all");
  
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading } = useLearningList({ 
    search: debouncedSearch,
    learningType: typeFilter === "all" ? undefined : typeFilter,
    status: statusFilter === "all" ? undefined : statusFilter,
  });
  
  const deleteMutation = useDeleteLearning();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState<Selectable<Learning> | null>(null);

  const handleAdd = () => {
    setSelectedLearning(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (learning: Selectable<Learning>) => {
    setSelectedLearning(learning);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this learning record?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Learning record deleted successfully"),
          onError: () => toast.error("Failed to delete learning record"),
        }
      );
    }
  };

  const getStatusColor = (status: LearningStatus) => {
    switch (status) {
      case "planned": return "secondary";
      case "in_progress": return "default";
      case "completed": return "success";
      case "abandoned": return "destructive";
      default: return "outline";
    }
  };

  const formatEnum = (val: string) => {
    return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Learning | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Learning</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Learning
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            placeholder="Search learning..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.filterContainer}>
          <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {LearningTypeArrayValues.map((t) => (
                <SelectItem key={t} value={t}>{formatEnum(t)}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {LearningStatusArrayValues.map((s) => (
                <SelectItem key={s} value={s}>{formatEnum(s)}</SelectItem>
              ))}
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
                <Skeleton style={{ width: "40%", height: "1rem", marginBottom: "0.5rem" }} />
                <Skeleton style={{ width: "80%", height: "1rem" }} />
              </div>
            </div>
          ))
        ) : data?.learning.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No learning records found. Add a learning record to get started!</p>
          </div>
        ) : (
          data?.learning.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.provider && <p className={styles.provider}>{item.provider}</p>}
                </div>
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
              </div>
              <div className={styles.cardBody}>
                <div className={styles.badges}>
                  <Badge variant={getStatusColor(item.status)}>
                    {formatEnum(item.status)}
                  </Badge>
                  <Badge variant="outline" className={styles.typeBadge}>
                    {formatEnum(item.learningType)}
                  </Badge>
                </div>
                
                <div className={styles.meta}>
                  {(item.startDate || item.completionDate) && (
                    <div className={styles.metaItem}>
                      <CalendarIcon size={14} />
                      <span>
                        {item.startDate ? format(new Date(item.startDate), "MMM yyyy") : "?"} 
                        {item.completionDate ? ` - ${format(new Date(item.completionDate), "MMM yyyy")}` : " - Present"}
                      </span>
                    </div>
                  )}
                  {item.cost !== null && (
                    <div className={styles.metaItem}>
                      <DollarSign size={14} />
                      <span>{Number(item.cost).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {item.skillsGained && (
                  <div className={styles.skillsGained}>
                    <span className={styles.label}>Skills:</span> {item.skillsGained}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <LearningDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        learning={selectedLearning}
      />
    </div>
  );
}