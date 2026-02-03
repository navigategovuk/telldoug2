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
import { AchievementCategoryArrayValues } from "../helpers/schema";
import { useCreateAchievement, useUpdateAchievement } from "../helpers/useAchievementsApi";

import type { AchievementCategory, Achievements } from "../helpers/schema";
import type { Selectable } from "kysely";

const achievementSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  achievedDate: z.date(),
  category: z.enum(AchievementCategoryArrayValues),
  quantifiableImpact: z.string().optional(),
  evidenceUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

interface AchievementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  achievement?: Selectable<Achievements> | null;
}

export function AchievementDialog({ open, onOpenChange, achievement }: AchievementDialogProps) {
  const createMutation = useCreateAchievement();
  const updateMutation = useUpdateAchievement();
  const isEditing = !!achievement;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      achievedDate: new Date(),
      category: "milestone",
      quantifiableImpact: "",
      evidenceUrl: "",
    },
    schema: achievementSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (achievement) {
        setValues({
          title: achievement.title,
          description: achievement.description,
          achievedDate: new Date(achievement.achievedDate),
          category: achievement.category,
          quantifiableImpact: achievement.quantifiableImpact || "",
          evidenceUrl: achievement.evidenceUrl || "",
        });
      } else {
        setValues({
          title: "",
          description: "",
          achievedDate: new Date(),
          category: "milestone",
          quantifiableImpact: "",
          evidenceUrl: "",
        });
      }
    }
  }, [open, achievement, setValues]);

  const onSubmit = (values: z.infer<typeof achievementSchema>) => {
    const payload = {
      ...values,
      quantifiableImpact: values.quantifiableImpact || null,
      evidenceUrl: values.evidenceUrl || null,
    };

    if (isEditing && achievement) {
      updateMutation.mutate(
        { id: achievement.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Achievement" : "Add New Achievement"}</DialogTitle>
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
                  placeholder="e.g. Launched Project X"
                  value={form.values.title}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="achievedDate">
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
                        {form.values.achievedDate ? (
                          form.values.achievedDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.achievedDate}
                      onSelect={(date: Date | undefined) =>
                        date && setValues((prev) => ({ ...prev, achievedDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="category">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.category}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, category: value as AchievementCategory }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {AchievementCategoryArrayValues.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.charAt(0).toUpperCase() + c.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What did you achieve?"
                  value={form.values.description}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, description: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="quantifiableImpact">
              <FormLabel>Quantifiable Impact (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Increased revenue by 20%"
                  value={form.values.quantifiableImpact || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, quantifiableImpact: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="evidenceUrl">
              <FormLabel>Evidence URL (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://..."
                  value={form.values.evidenceUrl || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, evidenceUrl: e.target.value }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Achievement"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
