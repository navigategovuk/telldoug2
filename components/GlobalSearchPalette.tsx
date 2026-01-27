import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, 
  Building2, 
  Briefcase, 
  Lightbulb, 
  CalendarDays, 
  FileEdit,
  Search
} from "lucide-react";
import { 
  CommandDialog, 
  CommandInput, 
  CommandList, 
  CommandEmpty, 
  CommandGroup, 
  CommandItem 
} from "./Command";
import { useGlobalSearch } from "../helpers/useSearchApi";
import { useDebounce } from "../helpers/useDebounce";
import styles from "./GlobalSearchPalette.module.css";

interface GlobalSearchPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearchPalette({ open, onOpenChange }: GlobalSearchPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  
  const { data, isFetching } = useGlobalSearch(debouncedQuery, {
    enabled: open && debouncedQuery.length >= 2
  });

  // Reset query when closed
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (url: string) => {
    navigate(url);
    onOpenChange(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "person": return <Users size={16} />;
      case "job": return <Building2 size={16} />;
      case "project": return <Briefcase size={16} />;
      case "skill": return <Lightbulb size={16} />;
      case "event": return <CalendarDays size={16} />;
      case "content": return <FileEdit size={16} />;
      default: return <Search size={16} />;
    }
  };

  const groupedResults = data?.results.reduce((acc, result) => {
    if (!acc[result.entityType]) {
      acc[result.entityType] = [];
    }
    acc[result.entityType].push(result);
    return acc;
  }, {} as Record<string, typeof data.results>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Search people, jobs, projects..." 
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isFetching ? "Searching..." : "No results found."}
        </CommandEmpty>
        
        {groupedResults && Object.entries(groupedResults).map(([type, items]) => (
          <CommandGroup key={type} heading={type.charAt(0).toUpperCase() + type.slice(1) + "s"}>
            {items.map((item) => (
              <CommandItem 
                key={`${item.entityType}-${item.id}`}
                onSelect={() => handleSelect(item.url)}
                className={styles.item}
              >
                <div className={styles.icon}>
                  {getIcon(item.entityType)}
                </div>
                <div className={styles.content}>
                  <span className={styles.title}>{item.title}</span>
                  {item.subtitle && (
                    <span className={styles.subtitle}>{item.subtitle}</span>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}