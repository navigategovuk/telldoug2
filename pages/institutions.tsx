import React, { useState } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit, MapPin, Calendar as CalendarIcon, GraduationCap } from "lucide-react";
import { useInstitutionsList, useDeleteInstitution } from "../helpers/useInstitutionsApi";
import { Institutions, InstitutionType } from "../helpers/schema";
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
import { InstitutionDialog } from "../components/InstitutionDialog";
import { toast } from "sonner";
import styles from "./institutions.module.css";

export default function InstitutionsPage() {
  const [typeFilter, setTypeFilter] = useState<InstitutionType | "all">("all");
  const { data, isLoading } = useInstitutionsList(typeFilter === "all" ? {} : { type: typeFilter });
  const deleteMutation = useDeleteInstitution();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedInstitution, setSelectedInstitution] = useState<Selectable<Institutions> | null>(null);

  const handleAdd = () => {
    setSelectedInstitution(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (institution: Selectable<Institutions>) => {
    setSelectedInstitution(institution);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this institution?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Institution deleted successfully"),
          onError: () => toast.error("Failed to delete institution"),
        }
      );
    }
  };

  const getTypeBadgeVariant = (type: InstitutionType) => {
    switch (type) {
      case "university": return "default";
      case "college": return "secondary";
      case "bootcamp": return "warning";
      case "school": return "success";
      default: return "outline";
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Institutions | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Institutions</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Institution
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as InstitutionType | "all")}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="university">University</SelectItem>
              <SelectItem value="college">College</SelectItem>
              <SelectItem value="bootcamp">Bootcamp</SelectItem>
              <SelectItem value="school">School</SelectItem>
              <SelectItem value="organization">Organization</SelectItem>
              <SelectItem value="other">Other</SelectItem>
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
        ) : data?.institutions.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No institutions found.</p>
          </div>
        ) : (
          data?.institutions.map((inst) => (
            <div key={inst.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <h3 className={styles.cardTitle}>{inst.name}</h3>
                  <Badge variant={getTypeBadgeVariant(inst.type)} className={styles.typeBadge}>
                    {inst.type}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(inst)}>
                      <Edit size={14} style={{ marginRight: 8 }} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(inst.id)}
                      className={styles.deleteItem}
                    >
                      <Trash size={14} style={{ marginRight: 8 }} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className={styles.cardBody}>
                {(inst.degree || inst.fieldOfStudy) && (
                  <div className={styles.infoRow}>
                    <GraduationCap size={16} className={styles.icon} />
                    <span>
                      {inst.degree} {inst.degree && inst.fieldOfStudy && "in"} {inst.fieldOfStudy}
                    </span>
                  </div>
                )}
                
                <div className={styles.infoRow}>
                  <CalendarIcon size={16} className={styles.icon} />
                  <span>
                    {inst.startDate ? new Date(inst.startDate).getFullYear() : "?"} 
                    {" - "}
                    {inst.endDate ? new Date(inst.endDate).getFullYear() : "Present"}
                  </span>
                </div>

                {inst.location && (
                  <div className={styles.infoRow}>
                    <MapPin size={16} className={styles.icon} />
                    <span>{inst.location}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <InstitutionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        institution={selectedInstitution}
      />
    </div>
  );
}