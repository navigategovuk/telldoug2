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
import { useCreateCompensation, useUpdateCompensation } from "../helpers/useCompensationApi";
import { useJobsList } from "../helpers/useJobsApi";
import { Compensation } from "../helpers/schema";
import { Selectable } from "kysely";

const compensationSchema = z.object({
  jobId: z.string().min(1, "Job is required"),
  effectiveDate: z.date(),
  baseSalary: z.number().min(0, "Base salary must be positive"),
  currency: z.string().default("GBP"),
  bonus: z.number().optional(),
  equityValue: z.number().optional(),
  benefitsNote: z.string().optional(),
});

interface CompensationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  compensation?: Selectable<Compensation> | null;
}

export function CompensationDialog({ open, onOpenChange, compensation }: CompensationDialogProps) {
  const createMutation = useCreateCompensation();
  const updateMutation = useUpdateCompensation();
  const { data: jobsData } = useJobsList();
  const isEditing = !!compensation;

  const form = useForm({
    defaultValues: {
      jobId: "",
      effectiveDate: new Date(),
      baseSalary: 0,
      currency: "GBP",
      bonus: 0,
      equityValue: 0,
      benefitsNote: "",
    },
    schema: compensationSchema,
  });

  useEffect(() => {
    if (open) {
      if (compensation) {
        form.setValues({
          jobId: compensation.jobId,
          effectiveDate: new Date(compensation.effectiveDate),
          baseSalary: Number(compensation.baseSalary),
          currency: compensation.currency,
          bonus: compensation.bonus ? Number(compensation.bonus) : 0,
          equityValue: compensation.equityValue ? Number(compensation.equityValue) : 0,
          benefitsNote: compensation.benefitsNote || "",
        });
      } else {
        form.setValues({
          jobId: "",
          effectiveDate: new Date(),
          baseSalary: 0,
          currency: "GBP",
          bonus: 0,
          equityValue: 0,
          benefitsNote: "",
        });
      }
    }
  }, [open, compensation, form.setValues]);

  const onSubmit = (values: z.infer<typeof compensationSchema>) => {
    const payload = {
      ...values,
      bonus: values.bonus || null,
      equityValue: values.equityValue || null,
      benefitsNote: values.benefitsNote || null,
    };

    if (isEditing && compensation) {
      updateMutation.mutate(
        { id: compensation.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Compensation" : "Add New Compensation"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            <FormItem name="jobId">
              <FormLabel>Job</FormLabel>
              <FormControl>
                <Select
                  value={form.values.jobId}
                  onValueChange={(val: string) =>
                    form.setValues((prev) => ({ ...prev, jobId: val }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select job" />
                  </SelectTrigger>
                  <SelectContent>
                    {jobsData?.jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title} at {job.company}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="effectiveDate">
                <FormLabel>Effective Date</FormLabel>
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
                        {form.values.effectiveDate ? (
                          form.values.effectiveDate.toLocaleDateString()
                        ) : (
                          "Pick a date"
                        )}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent removeBackgroundAndPadding align="start">
                    <Calendar
                      mode="single"
                      selected={form.values.effectiveDate}
                      onSelect={(date: Date | undefined) =>
                        date && form.setValues((prev) => ({ ...prev, effectiveDate: date }))
                      }
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>

              <FormItem name="currency">
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. GBP"
                    value={form.values.currency}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, currency: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="baseSalary">
              <FormLabel>Base Salary</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  value={form.values.baseSalary}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, baseSalary: Number(e.target.value) }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="bonus">
                <FormLabel>Bonus (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.values.bonus || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, bonus: Number(e.target.value) }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="equityValue">
                <FormLabel>Equity Value (Optional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="0"
                    value={form.values.equityValue || ""}
                    onChange={(e) =>
                      form.setValues((prev) => ({ ...prev, equityValue: Number(e.target.value) }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="benefitsNote">
              <FormLabel>Benefits Note (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g. Health insurance, gym membership..."
                  value={form.values.benefitsNote || ""}
                  onChange={(e) =>
                    form.setValues((prev) => ({ ...prev, benefitsNote: e.target.value }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Compensation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
