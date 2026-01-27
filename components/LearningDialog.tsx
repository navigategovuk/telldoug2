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
import { useCreateLearning, useUpdateLearning } from "../helpers/useLearningApi";
import { Learning, LearningTypeArrayValues, LearningStatusArrayValues } from "../helpers/schema";
import { Selectable } from "kysely";
import { format } from "date-fns";

const learningSchema = z.object({
  title: z.string().min(1, "Title is required"),
  provider: z.string().optional(),
  learningType: z.enum(LearningTypeArrayValues),
  status: z.enum(LearningStatusArrayValues),
  startDate: z.string().optional(), // Using string for date input
  completionDate: z.string().optional(), // Using string for date input
  cost: z.string().optional(), // Using string for number input to handle empty state
  skillsGained: z.string().optional(),
  notes: z.string().optional(),
});

interface LearningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learning?: Selectable<Learning> | null;
}

export function LearningDialog({ open, onOpenChange, learning }: LearningDialogProps) {
  const createMutation = useCreateLearning();
  const updateMutation = useUpdateLearning();
  const isEditing = !!learning;

  const form = useForm({
    defaultValues: {
      title: "",
      provider: "",
      learningType: "course",
      status: "planned",
      startDate: "",
      completionDate: "",
      cost: "",
      skillsGained: "",
      notes: "",
    },
    schema: learningSchema,
  });

  useEffect(() => {
    if (open) {
      if (learning) {
        form.setValues({
          title: learning.title,
          provider: learning.provider || "",
          learningType: learning.learningType,
          status: learning.status,
          startDate: learning.startDate ? format(new Date(learning.startDate), "yyyy-MM-dd") : "",
          completionDate: learning.completionDate ? format(new Date(learning.completionDate), "yyyy-MM-dd") : "",
          cost: learning.cost !== null ? String(learning.cost) : "",
          skillsGained: learning.skillsGained || "",
          notes: learning.notes || "",
        });
      } else {
        form.setValues({
          title: "",
          provider: "",
          learningType: "course",
          status: "planned",
          startDate: "",
          completionDate: "",
          cost: "",
          skillsGained: "",
          notes: "",
        });
      }
    }
  }, [open, learning, form.setValues]);

  const onSubmit = (values: z.infer<typeof learningSchema>) => {
    const payload = {
      title: values.title,
      provider: values.provider || null,
      learningType: values.learningType,
      status: values.status,
      startDate: values.startDate ? new Date(values.startDate) : null,
      completionDate: values.completionDate ? new Date(values.completionDate) : null,
      cost: values.cost ? parseFloat(values.cost) : null,
      skillsGained: values.skillsGained || null,
      notes: values.notes || null,
    };

    if (isEditing && learning) {
      updateMutation.mutate(
        { id: learning.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Learning" : "Add New Learning"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <FormItem name="title">
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Advanced React Patterns"
                  value={form.values.title}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="provider">
              <FormLabel>Provider</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Frontend Masters"
                  value={form.values.provider || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, provider: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="learningType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.learningType}
                    onValueChange={(val: any) =>
                      form.setValues((prev) => ({ ...prev, learningType: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {LearningTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="status">
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.status}
                    onValueChange={(val: any) =>
                      form.setValues((prev) => ({ ...prev, status: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {LearningStatusArrayValues.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="startDate">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={form.values.startDate || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, startDate: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="completionDate">
                <FormLabel>Completion Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={form.values.completionDate || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, completionDate: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="cost">
              <FormLabel>Cost</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={form.values.cost || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, cost: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="skillsGained">
              <FormLabel>Skills Gained</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. React, TypeScript, Performance Optimization (comma separated)"
                  value={form.values.skillsGained || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, skillsGained: e.target.value }))
                  }
                  rows={2}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes about this learning experience..."
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Learning"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}