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
import { useCreateProject, useUpdateProject } from "../helpers/useProjectsApi";
import { Projects, ProjectStatusArrayValues } from "../helpers/schema";
import { Selectable } from "kysely";

// Schema matching the API input
const projectSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  status: z.enum(ProjectStatusArrayValues),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project?: Selectable<Projects> | null; // If provided, we are in edit mode
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
}: ProjectDialogProps) {
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const isEditing = !!project;

  const form = useForm({
    defaultValues: {
      name: "",
      description: "",
      status: "planning",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
    },
    schema: projectSchema,
  });

  // Reset form when dialog opens/closes or project changes
  useEffect(() => {
    if (open) {
      if (project) {
        form.setValues({
          name: project.name,
          description: project.description || "",
          status: project.status,
          startDate: project.startDate ? new Date(project.startDate) : undefined,
          endDate: project.endDate ? new Date(project.endDate) : undefined,
        });
      } else {
        form.setValues({
          name: "",
          description: "",
          status: "planning",
          startDate: undefined,
          endDate: undefined,
        });
      }
    }
  }, [open, project, form.setValues]);

  const onSubmit = (values: z.infer<typeof projectSchema>) => {
    const payload = {
      ...values,
      description: values.description || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
    };

    if (isEditing && project) {
      updateMutation.mutate(
        { id: project.id, ...payload },
        {
          onSuccess: () => {
            onOpenChange(false);
          },
        },
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Project" : "Add New Project"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <FormItem name="name">
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Website Redesign"
                  value={form.values.name}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="status">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  value={form.values.status}
                  onValueChange={(val: any) =>
                    form.setValues((prev) => ({
                      ...prev,
                      status: val,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ProjectStatusArrayValues.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the project..."
                  value={form.values.description || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
