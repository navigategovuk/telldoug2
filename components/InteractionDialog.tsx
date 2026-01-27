import React, { useEffect } from "react";
import { z } from "zod";
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
import { Textarea } from "./Textarea";
import { Button } from "./Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCreateInteraction, useUpdateInteraction } from "../helpers/useInteractionsApi";
import { usePeopleList } from "../helpers/usePeopleApi";
import { useProjectsList } from "../helpers/useProjectsApi";
import { InteractionTypeArrayValues } from "../helpers/schema";
import { InteractionWithDetails } from "../endpoints/interactions/list_GET.schema";
import styles from "./InteractionDialog.module.css";

const interactionSchema = z.object({
  personId: z.string().min(1, "Person is required"),
  projectId: z.string().optional(),
  interactionDate: z.date({ required_error: "Date is required" }),
  interactionType: z.enum(InteractionTypeArrayValues),
  tags: z.string().optional(),
  notes: z.string().optional(),
});

interface InteractionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interaction?: InteractionWithDetails | null;
}

export function InteractionDialog({
  open,
  onOpenChange,
  interaction,
}: InteractionDialogProps) {
  const createMutation = useCreateInteraction();
  const updateMutation = useUpdateInteraction();
  const { data: peopleData } = usePeopleList();
  const { data: projectsData } = useProjectsList();

  const isEditing = !!interaction;

  const form = useForm({
    defaultValues: {
      personId: "",
      projectId: "none", // Use "none" as a sentinel for empty selection in UI
      interactionDate: new Date(),
      interactionType: "meeting",
      tags: "",
      notes: "",
    },
    schema: interactionSchema,
  });

  useEffect(() => {
    if (open) {
      if (interaction) {
        form.setValues({
          personId: interaction.personId,
          projectId: interaction.projectId || "none",
          interactionDate: new Date(interaction.interactionDate),
          interactionType: interaction.interactionType,
          tags: interaction.tags || "",
          notes: interaction.notes || "",
        });
      } else {
        form.setValues({
          personId: "",
          projectId: "none",
          interactionDate: new Date(),
          interactionType: "meeting",
          tags: "",
          notes: "",
        });
      }
    }
  }, [open, interaction, form.setValues]);

  const onSubmit = (values: z.infer<typeof interactionSchema>) => {
    const payload = {
      ...values,
      projectId: values.projectId === "none" ? null : values.projectId,
      tags: values.tags || null,
      notes: values.notes || null,
    };

    if (isEditing && interaction) {
      updateMutation.mutate(
        { id: interaction.id, ...payload },
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
          <DialogTitle>
            {isEditing ? "Edit Interaction" : "Log Interaction"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div className={styles.grid}>
              <FormItem name="personId">
                <FormLabel>Person</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.personId}
                    onValueChange={(val) =>
                      form.setValues((prev) => ({ ...prev, personId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select person" />
                    </SelectTrigger>
                    <SelectContent>
                      {peopleData?.people.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                          {person.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="projectId">
                <FormLabel>Project (Optional)</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.projectId}
                    onValueChange={(val) =>
                      form.setValues((prev) => ({ ...prev, projectId: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {projectsData?.projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div className={styles.grid}>
              <FormItem name="interactionType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.interactionType}
                    onValueChange={(val: any) =>
                      form.setValues((prev) => ({ ...prev, interactionType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {InteractionTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="interactionDate">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          fontWeight: "normal",
                        }}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "8px" }} />
                        {form.values.interactionDate ? (
                          form.values.interactionDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.interactionDate}
                      onSelect={(date: Date | undefined) =>
                        date && form.setValues((prev) => ({ ...prev, interactionDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="tags">
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. urgent, follow-up (comma separated)"
                  value={form.values.tags || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, tags: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What did you discuss?"
                  value={form.values.notes || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, notes: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Log Interaction"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
