import React, { useCallback, useEffect, useMemo } from "react";
import { z } from "zod";

import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./Dialog";
import {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { EntityTypeArrayValues } from "../helpers/schema";
import { useEventsList } from "../helpers/useEventsApi";
import { useInstitutionsList } from "../helpers/useInstitutionsApi";
import { useJobsList } from "../helpers/useJobsApi";
import { usePeopleList } from "../helpers/usePeopleApi";
import { useProjectsList } from "../helpers/useProjectsApi";
import { useCreateRelationship, useUpdateRelationship } from "../helpers/useRelationshipsApi";
import { useSkillsList } from "../helpers/useSkillsApi";

import type { Relationships, EntityType } from "../helpers/schema";
import type { Selectable } from "kysely";

const relationshipSchema = z.object({
  sourceType: z.enum(EntityTypeArrayValues),
  sourceId: z.string().min(1, "Source is required"),
  targetType: z.enum(EntityTypeArrayValues),
  targetId: z.string().min(1, "Target is required"),
  relationshipLabel: z.string().min(1, "Label is required"),
  notes: z.string().optional(),
});

interface RelationshipDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  relationship?: Selectable<Relationships> | null;
}

export function RelationshipDialog({ open, onOpenChange, relationship }: RelationshipDialogProps) {
  const createMutation = useCreateRelationship();
  const updateMutation = useUpdateRelationship();
  const isEditing = !!relationship;

  // Fetch all possible entities for dropdowns
  // In a real app with large data, these should be async searchable selects
  const { data: people } = usePeopleList();
  const { data: projects } = useProjectsList();
  const { data: skills } = useSkillsList();
  const { data: jobs } = useJobsList();
  const { data: institutions } = useInstitutionsList();
  const { data: events } = useEventsList();

  const form = useForm({
    defaultValues: {
      sourceType: "person",
      sourceId: "",
      targetType: "project",
      targetId: "",
      relationshipLabel: "",
      notes: "",
    },
    schema: relationshipSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (relationship) {
        setValues({
          sourceType: relationship.sourceType,
          sourceId: relationship.sourceId,
          targetType: relationship.targetType,
          targetId: relationship.targetId,
          relationshipLabel: relationship.relationshipLabel,
          notes: relationship.notes || "",
        });
      } else {
        setValues({
          sourceType: "person",
          sourceId: "",
          targetType: "project",
          targetId: "",
          relationshipLabel: "",
          notes: "",
        });
      }
    }
  }, [open, relationship, setValues]);

  const getOptionsForType = useCallback((type: EntityType) => {
    switch (type) {
      case "person": return people?.people.map(p => ({ id: p.id, name: p.name })) || [];
      case "project": return projects?.projects.map(p => ({ id: p.id, name: p.name })) || [];
      case "skill": return skills?.skills.map(s => ({ id: s.id, name: s.name })) || [];
      case "job": return jobs?.jobs.map(j => ({ id: j.id, name: `${j.title} at ${j.company}` })) || [];
      case "institution": return institutions?.institutions.map(i => ({ id: i.id, name: i.name })) || [];
      case "event": return events?.events.map(e => ({ id: e.id, name: e.title })) || [];
      default: return [];
    }
  }, [people, projects, skills, jobs, institutions, events]);

  const sourceOptions = useMemo(() => getOptionsForType(form.values.sourceType), [form.values.sourceType, getOptionsForType]);
  const targetOptions = useMemo(() => getOptionsForType(form.values.targetType), [form.values.targetType, getOptionsForType]);

  const onSubmit = (values: z.infer<typeof relationshipSchema>) => {
    const payload = {
      ...values,
      notes: values.notes || null,
    };

    if (isEditing && relationship) {
      // Note: API might not allow updating source/target IDs/Types for existing relationship, 
      // but schema allows it. Usually relationships are immutable regarding endpoints.
      // The update endpoint schema only takes id, label, notes.
      // So we only send those.
      updateMutation.mutate(
        { 
          id: relationship.id, 
          relationshipLabel: values.relationshipLabel,
          notes: values.notes || null
        },
        { onSuccess: () => onOpenChange(false) }
      );
    } else {
      createMutation.mutate(payload, { onSuccess: () => onOpenChange(false) });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Relationship" : "Add New Relationship"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {!isEditing && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <FormItem name="sourceType">
                    <FormLabel>Source Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.values.sourceType}
                        onValueChange={(value: string) => {
                          setValues((prev) => ({ ...prev, sourceType: value as EntityType, sourceId: "" }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EntityTypeArrayValues.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem name="sourceId">
                    <FormLabel>Source Entity</FormLabel>
                    <FormControl>
                      <Select
                        value={form.values.sourceId}
                        onValueChange={(value: string) =>
                          setValues((prev) => ({ ...prev, sourceId: value }))
                        }
                        disabled={!form.values.sourceType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                        <SelectContent>
                          {sourceOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <FormItem name="targetType">
                    <FormLabel>Target Type</FormLabel>
                    <FormControl>
                      <Select
                        value={form.values.targetType}
                        onValueChange={(value: string) => {
                          setValues((prev) => ({ ...prev, targetType: value as EntityType, targetId: "" }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {EntityTypeArrayValues.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t.charAt(0).toUpperCase() + t.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>

                  <FormItem name="targetId">
                    <FormLabel>Target Entity</FormLabel>
                    <FormControl>
                      <Select
                        value={form.values.targetId}
                        onValueChange={(value: string) =>
                          setValues((prev) => ({ ...prev, targetId: value }))
                        }
                        disabled={!form.values.targetType}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select entity" />
                        </SelectTrigger>
                        <SelectContent>
                          {targetOptions.map((opt) => (
                            <SelectItem key={opt.id} value={opt.id}>
                              {opt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                </div>
              </>
            )}

            <FormItem name="relationshipLabel">
              <FormLabel>Relationship Label</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Worked on, Mentored by, Attended"
                  value={form.values.relationshipLabel}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, relationshipLabel: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Context about this relationship..."
                  value={form.values.notes || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Relationship"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}