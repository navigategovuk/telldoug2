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
import { useCreateInstitution, useUpdateInstitution } from "../helpers/useInstitutionsApi";
import { Institutions, InstitutionTypeArrayValues } from "../helpers/schema";
import { Selectable } from "kysely";

const institutionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(InstitutionTypeArrayValues),
  location: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  notes: z.string().optional(),
});

interface InstitutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution?: Selectable<Institutions> | null;
}

export function InstitutionDialog({ open, onOpenChange, institution }: InstitutionDialogProps) {
  const createMutation = useCreateInstitution();
  const updateMutation = useUpdateInstitution();
  const isEditing = !!institution;

  const form = useForm({
    defaultValues: {
      name: "",
      type: "university",
      location: "",
      startDate: undefined as Date | undefined,
      endDate: undefined as Date | undefined,
      degree: "",
      fieldOfStudy: "",
      notes: "",
    },
    schema: institutionSchema,
  });

  useEffect(() => {
    if (open) {
      if (institution) {
        form.setValues({
          name: institution.name,
          type: institution.type,
          location: institution.location || "",
          startDate: institution.startDate ? new Date(institution.startDate) : undefined,
          endDate: institution.endDate ? new Date(institution.endDate) : undefined,
          degree: institution.degree || "",
          fieldOfStudy: institution.fieldOfStudy || "",
          notes: institution.notes || "",
        });
      } else {
        form.setValues({
          name: "",
          type: "university",
          location: "",
          startDate: undefined,
          endDate: undefined,
          degree: "",
          fieldOfStudy: "",
          notes: "",
        });
      }
    }
  }, [open, institution, form.setValues]);

  const onSubmit = (values: z.infer<typeof institutionSchema>) => {
    const payload = {
      ...values,
      location: values.location || null,
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      degree: values.degree || null,
      fieldOfStudy: values.fieldOfStudy || null,
      notes: values.notes || null,
    };

    if (isEditing && institution) {
      updateMutation.mutate(
        { id: institution.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Institution" : "Add New Institution"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <FormItem name="name">
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Harvard University"
                  value={form.values.name}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="type">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.type}
                    onValueChange={(val: any) =>
                      form.setValues((prev) => ({ ...prev, type: val }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {InstitutionTypeArrayValues.map((t) => (
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
                    placeholder="e.g. Cambridge, MA"
                    value={form.values.location || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, location: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="degree">
                <FormLabel>Degree</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Bachelor of Science"
                    value={form.values.degree || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, degree: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="fieldOfStudy">
                <FormLabel>Field of Study</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Computer Science"
                    value={form.values.fieldOfStudy || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, fieldOfStudy: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

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

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes..."
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Institution"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
