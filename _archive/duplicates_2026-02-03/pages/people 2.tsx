import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Plus, Search, MoreHorizontal, Trash, Edit, Mail, FileText } from "lucide-react";
import { usePeopleList, useDeletePerson } from "../helpers/usePeopleApi";
import { People } from "../helpers/schema";
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
  DropdownMenuSeparator,
} from "../components/DropdownMenu";
import { PeopleDialog } from "../components/PeopleDialog";
import { MeetingBriefDialog } from "../components/MeetingBriefDialog";
import { useDebounce } from "../helpers/useDebounce";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { toast } from "sonner";
import styles from "./people.module.css";

export default function PeoplePage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading } = usePeopleList({ search: debouncedSearch });
  const deleteMutation = useDeletePerson();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Selectable<People> | null>(
    null,
  );

  // Briefing Dialog State
  const [isBriefDialogOpen, setIsBriefDialogOpen] = useState(false);
  const [briefPerson, setBriefPerson] = useState<{id: string, name: string} | null>(null);

  const handleAdd = () => {
    setSelectedPerson(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (person: Selectable<People>) => {
    setSelectedPerson(person);
    setIsDialogOpen(true);
  };

  const handleBrief = (person: Selectable<People>) => {
    setBriefPerson({ id: person.id, name: person.name });
    setIsBriefDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this person?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast.success("Person deleted successfully");
          },
          onError: () => {
            toast.error("Failed to delete person");
          },
        },
      );
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>People | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>People</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Person
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            placeholder="Search people..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Role & Company</th>
              <th>Relationship</th>
              <th>Contact</th>
              <th className={styles.actionsHeader}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td>
                    <div className={styles.skeletonCell}>
                      <Skeleton
                        style={{ width: "32px", height: "32px", borderRadius: "50%" }}
                      />
                      <Skeleton style={{ width: "120px", height: "1rem" }} />
                    </div>
                  </td>
                  <td>
                    <Skeleton style={{ width: "150px", height: "1rem" }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: "80px", height: "1.5rem" }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: "100px", height: "1rem" }} />
                  </td>
                  <td>
                    <Skeleton style={{ width: "32px", height: "32px" }} />
                  </td>
                </tr>
              ))
            ) : data?.people.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyState}>
                  No people found. Add someone to get started!
                </td>
              </tr>
            ) : (
              data?.people.map((person) => (
                <tr
                  key={person.id}
                  ref={person.id === highlightedId ? highlightRef : undefined}
                  className={`${styles.row} ${
                    person.id === highlightedId ? highlightClassName : ""
                  }`}
                >
                  <td>
                    <div className={styles.nameCell}>
                      <div className={styles.avatar}>
                        {person.name.charAt(0).toUpperCase()}
                      </div>
                      <span className={styles.nameText}>{person.name}</span>
                    </div>
                  </td>
                  <td>
                    <div className={styles.roleCell}>
                      <span className={styles.roleText}>
                        {person.role || "—"}
                      </span>
                      <span className={styles.companyText}>
                        {person.company}
                      </span>
                    </div>
                  </td>
                  <td>
                    {person.relationshipType ? (
                      <Badge variant="secondary" className={styles.badge}>
                        {person.relationshipType}
                      </Badge>
                    ) : (
                      <span className={styles.emptyText}>—</span>
                    )}
                  </td>
                  <td>
                    {person.email ? (
                      <a
                        href={`mailto:${person.email}`}
                        className={styles.emailLink}
                      >
                        <Mail size={14} /> {person.email}
                      </a>
                    ) : (
                      <span className={styles.emptyText}>—</span>
                    )}
                  </td>
                  <td className={styles.actionsCell}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreHorizontal size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBrief(person)}>
                          <FileText size={14} style={{ marginRight: 8 }} /> Briefing
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleEdit(person)}>
                          <Edit size={14} style={{ marginRight: 8 }} /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(person.id)}
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

      <PeopleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        person={selectedPerson}
      />

      <MeetingBriefDialog
        open={isBriefDialogOpen}
        onOpenChange={setIsBriefDialogOpen}
        personId={briefPerson?.id || null}
        personName={briefPerson?.name || null}
      />
    </div>
  );
}