import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Button } from "./Button";
import { Skeleton } from "./Skeleton";
import { useGenerateDraft } from "../helpers/useAiApi";
import { PenTool, AlertCircle, Copy, RefreshCw, ArrowLeft } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "./Form";
import { Input } from "./Input";
import { Textarea } from "./Textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { schema as apiSchema } from "../endpoints/ai/draft-content_POST.schema";
import { toast } from "sonner";
import styles from "./ContentDraftDialog.module.css";

interface ContentDraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Reuse the API schema for the form
const formSchema = apiSchema;

type FormValues = z.infer<typeof formSchema>;

export function ContentDraftDialog({
  open,
  onOpenChange,
}: ContentDraftDialogProps) {
  const [phase, setPhase] = useState<"form" | "result">("form");
  const { mutate, data, isPending, isError, error, reset } = useGenerateDraft();

  const form = useForm({
    defaultValues: {
      content_type: "linkedin_post",
      topic: "",
      context_notes: "",
    },
    schema: formSchema,
  });

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      const timer = setTimeout(() => {
        setPhase("form");
        reset();
        form.setValues({
          content_type: "linkedin_post",
          topic: "",
          context_notes: "",
        });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open, reset, form]);

  const onSubmit = (values: FormValues) => {
    setPhase("result");
    mutate(values);
  };

  const handleCopy = () => {
    if (data?.draft) {
      navigator.clipboard.writeText(data.draft);
      toast.success("Draft copied to clipboard");
    }
  };

  const handleStartOver = () => {
    setPhase("form");
    reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <PenTool size={20} className={styles.icon} />
            AI Content Drafter
          </DialogTitle>
          <DialogDescription>
            Generate professional content based on your career history and context.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.contentArea}>
          {phase === "form" && (
            <Form {...form}>
              <form
                id="draft-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className={styles.formContainer}
              >
                <FormItem name="content_type">
                  <FormLabel>Content Type</FormLabel>
                  <Select
                    value={form.values.content_type}
                    onValueChange={(val) =>
                      form.setValues((prev) => ({
                        ...prev,
                        content_type: val as FormValues["content_type"],
                      }))
                    }
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="linkedin_post">LinkedIn Post</SelectItem>
                      <SelectItem value="article">Article / Blog Post</SelectItem>
                      <SelectItem value="email">Professional Email</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>

                <FormItem name="topic">
                  <FormLabel>Topic</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., My recent promotion, Thoughts on AI in tech..."
                      value={form.values.topic}
                      onChange={(e) =>
                        form.setValues((prev) => ({
                          ...prev,
                          topic: e.target.value,
                        }))
                      }
                    />
                  </FormControl>
                  <FormDescription>
                    What should this content be about?
                  </FormDescription>
                  <FormMessage />
                </FormItem>

                <FormItem name="context_notes">
                  <FormLabel>Additional Context (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Any specific points to include or tone preferences..."
                      value={form.values.context_notes}
                      onChange={(e) =>
                        form.setValues((prev) => ({
                          ...prev,
                          context_notes: e.target.value,
                        }))
                      }
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              </form>
            </Form>
          )}

          {phase === "result" && (
            <div className={styles.resultContainer}>
              {isPending ? (
                <div className={styles.loadingState}>
                  <div className={styles.loadingHeader}>
                    <RefreshCw className={`${styles.spinIcon} ${styles.mutedIcon}`} size={24} />
                    <p className={styles.loadingText}>Drafting your content...</p>
                  </div>
                  <Skeleton className={styles.skeletonLine} style={{ width: "40%" }} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "90%" }} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "95%" }} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "85%" }} />
                  <div className={styles.spacer} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "92%" }} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "88%" }} />
                  <Skeleton className={styles.skeletonLine} style={{ width: "60%" }} />
                </div>
              ) : isError ? (
                <div className={styles.errorState}>
                  <AlertCircle size={32} className={styles.errorIcon} />
                  <p>Failed to generate draft.</p>
                  <p className={styles.errorMessage}>{error?.message}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => mutate(form.values)}
                    className={styles.retryButton}
                  >
                    Retry
                  </Button>
                </div>
              ) : data ? (
                <div className={styles.draftContent}>
                  {data.draft.split("\n").map((line, i) => (
                    <p key={i} className={styles.draftLine}>
                      {line}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          {phase === "form" ? (
            <>
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" form="draft-form">
                Generate Draft
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={handleStartOver} disabled={isPending}>
                <ArrowLeft size={16} /> Start Over
              </Button>
              <div style={{ flex: 1 }} />
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button onClick={handleCopy} disabled={!data || isPending}>
                <Copy size={16} /> Copy to Clipboard
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}