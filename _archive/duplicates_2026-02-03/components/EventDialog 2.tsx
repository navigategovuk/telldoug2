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
import { EventTypeArrayValues } from "../helpers/schema";
import { useCreateEvent, useUpdateEvent } from "../helpers/useEventsApi";

import type { EventType, Events } from "../helpers/schema";
import type { Selectable } from "kysely";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  eventDate: z.date().optional(),
  eventEndDate: z.date().optional(),
  eventType: z.enum(EventTypeArrayValues),
  location: z.string().optional(),
  notes: z.string().optional(),
});

interface EventDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: Selectable<Events> | null;
}

export function EventDialog({ open, onOpenChange, event }: EventDialogProps) {
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const isEditing = !!event;

  const form = useForm({
    defaultValues: {
      title: "",
      description: "",
      eventDate: undefined as Date | undefined,
      eventEndDate: undefined as Date | undefined,
      eventType: "other",
      location: "",
      notes: "",
    },
    schema: eventSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (event) {
        setValues({
          title: event.title,
          description: event.description || "",
          eventDate: event.eventDate ? new Date(event.eventDate) : undefined,
          eventEndDate: event.eventEndDate ? new Date(event.eventEndDate) : undefined,
          eventType: event.eventType,
          location: event.location || "",
          notes: event.notes || "",
        });
      } else {
        setValues({
          title: "",
          description: "",
          eventDate: undefined,
          eventEndDate: undefined,
          eventType: "other",
          location: "",
          notes: "",
        });
      }
    }
  }, [open, event, setValues]);

  const onSubmit = (values: z.infer<typeof eventSchema>) => {
    const payload = {
      ...values,
      description: values.description || null,
      eventDate: values.eventDate || null,
      eventEndDate: values.eventEndDate || null,
      location: values.location || null,
      notes: values.notes || null,
    };

    if (isEditing && event) {
      updateMutation.mutate(
        { id: event.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Event" : "Add New Event"}</DialogTitle>
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
                  placeholder="e.g. Tech Conference 2024"
                  value={form.values.title}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="eventType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.eventType}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, eventType: value as EventType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {EventTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="location">
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. New York, NY"
                    value={form.values.location || ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="eventDate">
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
                          color: !form.values.eventDate ? "var(--muted-foreground)" : undefined
                        }}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "8px" }} />
                        {form.values.eventDate ? (
                          form.values.eventDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.eventDate}
                      onSelect={(date: Date | undefined) =>
                        setValues((prev) => ({ ...prev, eventDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="eventEndDate">
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
                          color: !form.values.eventEndDate ? "var(--muted-foreground)" : undefined
                        }}
                      >
                        <CalendarIcon size={16} style={{ marginRight: "8px" }} />
                        {form.values.eventEndDate ? (
                          form.values.eventEndDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.eventEndDate}
                      onSelect={(date: Date | undefined) =>
                        setValues((prev) => ({ ...prev, eventEndDate: date }))
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
                  placeholder="Event details..."
                  value={form.values.description || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, description: e.target.value }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Event"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
