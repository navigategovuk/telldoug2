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
import { useCreatePerson, useUpdatePerson } from "../helpers/usePeopleApi";
import { People } from "../helpers/schema";
import { Selectable } from "kysely";

// Schema matching the API input
const personSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  company: z.string().optional(),
  role: z.string().optional(),
  relationshipType: z.string().optional(),
  notes: z.string().optional(),
});

interface PeopleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Selectable<People> | null; // If provided, we are in edit mode
}

export function PeopleDialog({
  open,
  onOpenChange,
  person,
}: PeopleDialogProps) {
  const createMutation = useCreatePerson();
  const updateMutation = useUpdatePerson();

  const isEditing = !!person;

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      company: "",
      role: "",
      relationshipType: "",
      notes: "",
    },
    schema: personSchema,
  });

  // Reset form when dialog opens/closes or person changes
  useEffect(() => {
    if (open) {
      if (person) {
        form.setValues({
          name: person.name,
          email: person.email || "",
          company: person.company || "",
          role: person.role || "",
          relationshipType: person.relationshipType || "",
          notes: person.notes || "",
        });
      } else {
        form.setValues({
          name: "",
          email: "",
          company: "",
          role: "",
          relationshipType: "",
          notes: "",
        });
      }
    }
  }, [open, person, form.setValues]);

  const onSubmit = (values: z.infer<typeof personSchema>) => {
    const payload = {
      ...values,
      // Convert empty strings to null/undefined for optional fields if needed by API,
      // but the schema allows optional strings.
      // The API schema expects optional fields to be string | null | undefined.
      email: values.email || null,
      company: values.company || null,
      role: values.role || null,
      relationshipType: values.relationshipType || null,
      notes: values.notes || null,
    };

    if (isEditing && person) {
      updateMutation.mutate(
        { id: person.id, ...payload },
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
            {isEditing ? "Edit Person" : "Add New Person"}
          </DialogTitle>
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
                  placeholder="e.g. Doug Smith"
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

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="email">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="doug@example.com"
                    value={form.values.email || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="relationshipType">
                <FormLabel>Relationship</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.relationshipType || "_empty"}
                    onValueChange={(val) =>
                      form.setValues((prev) => ({
                        ...prev,
                        relationshipType: val === "_empty" ? "" : val,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="colleague">Colleague</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="friend">Friend</SelectItem>
                      <SelectItem value="recruiter">Recruiter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="company">
                <FormLabel>Company</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Company Name"
                    value={form.values.company || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="role">
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Job Title"
                    value={form.values.role || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({
                        ...prev,
                        role: e.target.value,
                      }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any notes about this person..."
                  value={form.values.notes || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({
                      ...prev,
                      notes: e.target.value,
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Person"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}