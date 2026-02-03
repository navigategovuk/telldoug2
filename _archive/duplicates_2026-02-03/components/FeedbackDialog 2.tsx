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
import { FeedbackTypeArrayValues } from "../helpers/schema";
import { useCreateFeedback, useUpdateFeedback } from "../helpers/useFeedbackApi";
import { usePeopleList } from "../helpers/usePeopleApi";

import type { Feedback, FeedbackType } from "../helpers/schema";
import type { Selectable } from "kysely";

const feedbackSchema = z.object({
  personId: z.string().min(1, "Person is required"),
  feedbackDate: z.date(),
  feedbackType: z.enum(FeedbackTypeArrayValues),
  context: z.string().optional(),
  notes: z.string().min(1, "Notes are required"),
});

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback?: Selectable<Feedback> | null;
}

export function FeedbackDialog({ open, onOpenChange, feedback }: FeedbackDialogProps) {
  const createMutation = useCreateFeedback();
  const updateMutation = useUpdateFeedback();
  const { data: peopleData } = usePeopleList();
  const isEditing = !!feedback;

  const form = useForm({
    defaultValues: {
      personId: "",
      feedbackDate: new Date(),
      feedbackType: "peer_feedback",
      context: "",
      notes: "",
    },
    schema: feedbackSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (feedback) {
        setValues({
          personId: feedback.personId,
          feedbackDate: new Date(feedback.feedbackDate),
          feedbackType: feedback.feedbackType,
          context: feedback.context || "",
          notes: feedback.notes,
        });
      } else {
        setValues({
          personId: "",
          feedbackDate: new Date(),
          feedbackType: "peer_feedback",
          context: "",
          notes: "",
        });
      }
    }
  }, [open, feedback, setValues]);

  const onSubmit = (values: z.infer<typeof feedbackSchema>) => {
    const payload = {
      ...values,
      context: values.context || null,
    };

    if (isEditing && feedback) {
      updateMutation.mutate(
        { id: feedback.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Feedback" : "Add New Feedback"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <FormItem name="personId">
              <FormLabel>Person</FormLabel>
              <FormControl>
                <Select
                  value={form.values.personId}
                  onValueChange={(val: string) =>
                    setValues((prev) => ({ ...prev, personId: val }))
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="feedbackDate">
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
                        {form.values.feedbackDate ? (
                          form.values.feedbackDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.feedbackDate}
                      onSelect={(date: Date | undefined) =>
                        date && setValues((prev) => ({ ...prev, feedbackDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="feedbackType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.feedbackType}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, feedbackType: value as FeedbackType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {FeedbackTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="context">
              <FormLabel>Context (Optional)</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Q3 Project Review"
                  value={form.values.context || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, context: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Feedback details..."
                  value={form.values.notes}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
