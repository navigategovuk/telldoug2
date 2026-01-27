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
import { Checkbox } from "./Checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { Calendar } from "./Calendar";
import { Calendar as CalendarIcon } from "lucide-react";
import { useCreateJob, useUpdateJob } from "../helpers/useJobsApi";
import { Jobs } from "../helpers/schema";
import { Selectable } from "kysely";

const jobSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().min(1, "Company is required"),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  isCurrent: z.boolean().default(false),
  location: z.string().optional(),
  notes: z.string().optional(),
});

interface JobDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job?: Selectable<Jobs> | null;
}

export function JobDialog({ open, onOpenChange, job }: JobDialogProps) {
  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();
  const isEditing = !!job;

  const form = useForm({
    defaultValues: {
      title: "",
      company: "",
      description: "",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      isCurrent: false,
      location: "",
      notes: "",
    },
    schema: jobSchema,
  });

  useEffect(() => {
    if (open) {
      if (job) {
        form.setValues({
          title: job.title,
          company: job.company,
          description: job.description || "",
          startDate: job.startDate ? new Date(job.startDate) : undefined,
          endDate: job.endDate ? new Date(job.endDate) : undefined,
          isCurrent: job.isCurrent,
          location: job.location || "",
          notes: job.notes || "",
        });
      } else {
        form.setValues({
          title: "",
          company: "",
          description: "",
          startDate: undefined,
          endDate: undefined,
          isCurrent: false,
          location: "",
          notes: "",
        });
      }
    }
  }, [open, job, form.setValues]);

  const onSubmit = (values: z.infer<typeof jobSchema>) => {
    const payload = {
      ...values,
      description: values.description || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      location: values.location || null,
      notes: values.notes || null,
    };

    if (isEditing && job) {
      updateMutation.mutate(
        { id: job.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Job" : "Add New Job"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="title">
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Senior Engineer"
                    value={form.values.title}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="company">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Acme Corp"
                    value={form.values.company}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, company: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="location">
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. San Francisco, CA"
                  value={form.values.location || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="startDate">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          fontWeight: "normal",
                          color: !form.values.startDate ? "var(--muted-foreground)" : undefined
                        }}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "8px" }} />
                        {form.values.startDate ? (
                          form.values.startDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.startDate}
                      onSelect={(date: Date | undefined) =>
                        form.setValues((prev) => ({ ...prev, startDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="endDate">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        style={{
                          width: "100%",
                          justifyContent: "flex-start",
                          fontWeight: "normal",
                          color: !form.values.endDate ? "var(--muted-foreground)" : undefined
                        }}
                        disabled={form.values.isCurrent}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "8px" }} />
                        {form.values.endDate ? (
                          form.values.endDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.endDate}
                      onSelect={(date: Date | undefined) =>
                        form.setValues((prev) => ({ ...prev, endDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="isCurrent">
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <FormControl>
                  <Checkbox
                    id="isCurrent"
                    checked={form.values.isCurrent}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      form.setValues((prev) => ({
                        ...prev,
                        isCurrent: checked,
                        endDate: checked ? undefined : prev.endDate,
                      }));
                    }}
                  />
                </FormControl>
                <FormLabel htmlFor="isCurrent" style={{ marginBottom: 0 }}>
                  I currently work here
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your role and achievements..."
                  value={form.values.description || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Private notes..."
                  value={form.values.notes || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, notes: e.target.value }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Job"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
