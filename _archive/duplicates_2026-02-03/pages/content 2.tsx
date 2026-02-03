import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Plus, Search, MoreVertical, Trash, Edit, Calendar as CalendarIcon, ExternalLink, BarChart2 } from "lucide-react";
import { useContentList, useDeleteContent } from "../helpers/useContentApi";
import { Content, ContentType, ContentTypeArrayValues } from "../helpers/schema";
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
import { ContentDialog } from "../components/ContentDialog";
import { useDebounce } from "../helpers/useDebounce";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { toast } from "sonner";
import { format } from "date-fns";
import styles from "./content.module.css";

export default function ContentPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ContentType | "all">("all");
  
  const debouncedSearch = useDebounce(search, 300);
  
  const { data, isLoading } = useContentList({ 
    search: debouncedSearch,
    contentType: typeFilter === "all" ? undefined : typeFilter,
  });
  
  const deleteMutation = useDeleteContent();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<Selectable<Content> | null>(null);

  const handleAdd = () => {
    setSelectedContent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (content: Selectable<Content>) => {
    setSelectedContent(content);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this content?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Content deleted successfully"),
          onError: () => toast.error("Failed to delete content"),
        }
      );
    }
  };

  const formatEnum = (val: string) => {
    return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Content | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Content</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Content
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} size={18} />
          <Input
            placeholder="Search content..."
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
              {ContentTypeArrayValues.map((t) => (
                <SelectItem key={t} value={t}>{formatEnum(t)}</SelectItem>
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
        ) : data?.content.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No content found. Add content to get started!</p>
          </div>
        ) : (
          data?.content.map((item) => (
            <div 
              key={item.id} 
              ref={item.id === highlightedId ? highlightRef : undefined}
              className={`${styles.card} ${
                item.id === highlightedId ? highlightClassName : ""
              }`}
            >
              <div className={styles.cardHeader}>
                <div>
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  {item.platform && <p className={styles.platform}>{item.platform}</p>}
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
                  <Badge variant="outline" className={styles.typeBadge}>
                    {formatEnum(item.contentType)}
                  </Badge>
                </div>
                
                <div className={styles.meta}>
                  <div className={styles.metaItem}>
                    <CalendarIcon size={14} />
                    <span>{format(new Date(item.publicationDate), "MMM d, yyyy")}</span>
                  </div>
                  
                  {item.url && (
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className={styles.link}
                    >
                      <ExternalLink size={14} />
                      <span>View Content</span>
                    </a>
                  )}
                </div>

                {item.engagementMetrics && (
                  <div className={styles.metrics}>
                    <BarChart2 size={14} className={styles.metricsIcon} />
                    <span>{item.engagementMetrics}</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ContentDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        content={selectedContent}
      />
    </div>
  );
}