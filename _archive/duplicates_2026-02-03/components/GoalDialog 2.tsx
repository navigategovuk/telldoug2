import { Calendar as CalendarIcon } from "lucide-react";
import React, { useEffect } from "react";
import { z } from "zod";

import { Button } from "./Button";
import { Calendar } from "./Calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { GoalTypeArrayValues, GoalStatusArrayValues } from "../helpers/schema";
import { useCreateGoal, useUpdateGoal } from "../helpers/useGoalsApi";

import type { GoalStatus, GoalType, Goals } from "../helpers/schema";
import type { Selectable } from "kysely";

const goalSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  targetDate: z.date(),
  goalType: z.enum(GoalTypeArrayValues),
  status: z.enum(GoalStatusArrayValues),
  notes: z.string().optional(),
});

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal?: Selectable<Goals> | null;
}

export function GoalDialog({ open, onOpenChange, goal }: GoalDialogProps) {
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const isEditing = !!goal;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      targetDate: new Date(),
      goalType: "career",
      status: "not_started",
      notes: "",
    },
    schema: goalSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (goal) {
        setValues({
          title: goal.title,
          description: goal.description,
          targetDate: new Date(goal.targetDate),
          goalType: goal.goalType,
          status: goal.status,
          notes: goal.notes || "",
        });
      } else {
        setValues({
          title: "",
          description: "",
          targetDate: new Date(),
          goalType: "career",
          status: "not_started",
          notes: "",
        });
      }
    }
  }, [open, goal, setValues]);

  const onSubmit = (values: z.infer<typeof goalSchema>) => {
    const payload = {
      ...values,
      notes: values.notes || null,
    };

    if (isEditing && goal) {
      updateMutation.mutate(
        { id: goal.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Goal" : "Add New Goal"}</DialogTitle>
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
                  placeholder="e.g. Get promoted to Senior"
                  value={form.values.title}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="targetDate">
                <FormLabel>Target Date</FormLabel>
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
                        {form.values.targetDate ? (
                          form.values.targetDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.targetDate}
                      onSelect={(date: Date | undefined) =>
                        date && setValues((prev) => ({ ...prev, targetDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="goalType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.goalType}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, goalType: value as GoalType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {GoalTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="status">
              <FormLabel>Status</FormLabel>
              <FormControl>
                <Select
                  value={form.values.status}
                  onValueChange={(value: string) =>
                    setValues((prev) => ({ ...prev, status: value as GoalStatus }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {GoalStatusArrayValues.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Goal details..."
                  value={form.values.description}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Private notes..."
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Goal"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
