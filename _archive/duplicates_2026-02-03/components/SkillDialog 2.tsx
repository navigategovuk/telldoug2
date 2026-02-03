import React, { useEffect } from "react";
import { z } from "zod";

import { Button } from "./Button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { SkillProficiencyArrayValues } from "../helpers/schema";
import { useCreateSkill, useUpdateSkill } from "../helpers/useSkillsApi";

import type { SkillProficiency, Skills } from "../helpers/schema";
import type { Selectable } from "kysely";

const skillSchema = z.object({
  name: z.string().min(1, "Name is required"),
  category: z.string().optional(),
  proficiency: z.enum(SkillProficiencyArrayValues),
  notes: z.string().optional(),
});

interface SkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: Selectable<Skills> | null;
}

export function SkillDialog({ open, onOpenChange, skill }: SkillDialogProps) {
  const createMutation = useCreateSkill();
  const updateMutation = useUpdateSkill();
  const isEditing = !!skill;

  const form = useForm({
    defaultValues: {
      name: "",
      category: "",
      proficiency: "beginner",
      notes: "",
    },
    schema: skillSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (skill) {
        setValues({
          name: skill.name,
          category: skill.category || "",
          proficiency: skill.proficiency,
          notes: skill.notes || "",
        });
      } else {
        setValues({
          name: "",
          category: "",
          proficiency: "beginner",
          notes: "",
        });
      }
    }
  }, [open, skill, setValues]);

  const onSubmit = (values: z.infer<typeof skillSchema>) => {
    const payload = {
      ...values,
      category: values.category || null,
      notes: values.notes || null,
    };

    if (isEditing && skill) {
      updateMutation.mutate(
        { id: skill.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Skill" : "Add New Skill"}</DialogTitle>
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
                  placeholder="e.g. React"
                  value={form.values.name}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="category">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Frontend"
                    value={form.values.category || ""}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, category: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="proficiency">
                <FormLabel>Proficiency</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.proficiency}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, proficiency: value as SkillProficiency }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select proficiency" />
                    </SelectTrigger>
                    <SelectContent>
                      {SkillProficiencyArrayValues.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="notes">
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Notes about this skill..."
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Skill"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}