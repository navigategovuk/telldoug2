import React, { useState, useRef, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Plus, MoreVertical, Trash, Edit, MapPin, Calendar as CalendarIcon } from "lucide-react";
import { useEventsList, useDeleteEvent } from "../helpers/useEventsApi";
import { Events, EventType } from "../helpers/schema";
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
import { EventDialog } from "../components/EventDialog";
import { useHighlightFromSearch } from "../helpers/useHighlightFromSearch";
import { toast } from "sonner";
import styles from "./events.module.css";

export default function EventsPage() {
  const [typeFilter, setTypeFilter] = useState<EventType | "all">("all");
  const { data, isLoading } = useEventsList(typeFilter === "all" ? {} : { eventType: typeFilter });
  const deleteMutation = useDeleteEvent();

  const { highlightedId, scrollToElement, highlightClassName } = useHighlightFromSearch();
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (highlightedId && highlightRef.current && !isLoading) {
      scrollToElement(highlightRef.current);
    }
  }, [highlightedId, isLoading, scrollToElement]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Selectable<Events> | null>(null);

  const handleAdd = () => {
    setSelectedEvent(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (event: Selectable<Events>) => {
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => toast.success("Event deleted successfully"),
          onError: () => toast.error("Failed to delete event"),
        }
      );
    }
  };

  const getTypeBadgeVariant = (type: EventType) => {
    switch (type) {
      case "conference": return "default"; // Blue
      case "meeting": return "success"; // Green
      case "workshop": return "secondary"; // Purple-ish (via secondary)
      case "networking": return "warning"; // Orange
      case "interview": return "destructive"; // Red
      case "presentation": return "default"; // Cyan/Blue
      default: return "outline";
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Events | TellDoug</title>
      </Helmet>

      <header className={styles.header}>
        <h1 className={styles.title}>Events</h1>
        <Button onClick={handleAdd}>
          <Plus size={16} /> Add Event
        </Button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.filterContainer}>
          <Select
            value={typeFilter}
            onValueChange={(val) => setTypeFilter(val as EventType | "all")}
          >
            <SelectTrigger className={styles.filterSelect}>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="presentation">Presentation</SelectItem>
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
        ) : data?.events.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No events found.</p>
          </div>
        ) : (
          data?.events.map((event) => (
            <div 
              key={event.id} 
              ref={event.id === highlightedId ? highlightRef : undefined}
              className={`${styles.card} ${
                event.id === highlightedId ? highlightClassName : ""
              }`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.titleGroup}>
                  <h3 className={styles.cardTitle}>{event.title}</h3>
                  <Badge variant={getTypeBadgeVariant(event.eventType)} className={styles.typeBadge}>
                    {event.eventType}
                  </Badge>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" className={styles.menuButton}>
                      <MoreVertical size={16} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(event)}>
                      <Edit size={14} style={{ marginRight: 8 }} /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDelete(event.id)}
                      className={styles.deleteItem}
                    >
                      <Trash size={14} style={{ marginRight: 8 }} /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className={styles.cardBody}>
                <div className={styles.infoRow}>
                  <CalendarIcon size={16} className={styles.icon} />
                  <span>
                    {event.eventDate ? new Date(event.eventDate).toLocaleDateString() : "TBD"}
                    {event.eventEndDate && ` - ${new Date(event.eventEndDate).toLocaleDateString()}`}
                  </span>
                </div>

                {event.location && (
                  <div className={styles.infoRow}>
                    <MapPin size={16} className={styles.icon} />
                    <span>{event.location}</span>
                  </div>
                )}
                
                {event.description && (
                  <p className={styles.description}>{event.description}</p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <EventDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEvent}
      />
    </div>
  );
}