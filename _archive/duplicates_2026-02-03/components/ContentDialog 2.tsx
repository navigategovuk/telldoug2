import { format } from "date-fns";
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
import { ContentTypeArrayValues } from "../helpers/schema";
import { useCreateContent, useUpdateContent } from "../helpers/useContentApi";

import type { Content, ContentType } from "../helpers/schema";
import type { Selectable } from "kysely";

const contentSchema = z.object({
  title: z.string().min(1, "Title is required"),
  contentType: z.enum(ContentTypeArrayValues),
  publicationDate: z.string().min(1, "Publication date is required"), // Using string for date input
  platform: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional(),
  engagementMetrics: z.string().optional(),
});

interface ContentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  content?: Selectable<Content> | null;
}

export function ContentDialog({ open, onOpenChange, content }: ContentDialogProps) {
  const createMutation = useCreateContent();
  const updateMutation = useUpdateContent();
  const isEditing = !!content;

  const form = useForm({
    defaultValues: {
      title: "",
      contentType: "article",
      publicationDate: format(new Date(), "yyyy-MM-dd"),
      platform: "",
      url: "",
      description: "",
      engagementMetrics: "",
    },
    schema: contentSchema,
  });

  const { setValues } = form;

  useEffect(() => {
    if (open) {
      if (content) {
        setValues({
          title: content.title,
          contentType: content.contentType,
          publicationDate: format(new Date(content.publicationDate), "yyyy-MM-dd"),
          platform: content.platform || "",
          url: content.url || "",
          description: content.description || "",
          engagementMetrics: content.engagementMetrics || "",
        });
      } else {
        setValues({
          title: "",
          contentType: "article",
          publicationDate: format(new Date(), "yyyy-MM-dd"),
          platform: "",
          url: "",
          description: "",
          engagementMetrics: "",
        });
      }
    }
  }, [open, content, setValues]);

  const onSubmit = (values: z.infer<typeof contentSchema>) => {
    const payload = {
      title: values.title,
      contentType: values.contentType,
      publicationDate: new Date(values.publicationDate),
      platform: values.platform || null,
      url: values.url || null,
      description: values.description || null,
      engagementMetrics: values.engagementMetrics || null,
    };

    if (isEditing && content) {
      updateMutation.mutate(
        { id: content.id, ...payload },
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
          <DialogTitle>{isEditing ? "Edit Content" : "Add New Content"}</DialogTitle>
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
                  placeholder="e.g. How to build a career OS"
                  value={form.values.title}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormItem name="contentType">
                <FormLabel>Type</FormLabel>
                <FormControl>
                  <Select
                    value={form.values.contentType}
                    onValueChange={(value: string) =>
                      setValues((prev) => ({ ...prev, contentType: value as ContentType }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {ContentTypeArrayValues.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem name="publicationDate">
                <FormLabel>Publication Date</FormLabel>
                <FormControl>
                  <Input
                    type="date"
                    value={form.values.publicationDate}
                    onChange={(e) =>
                      setValues((prev) => ({ ...prev, publicationDate: e.target.value }))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            </div>

            <FormItem name="platform">
              <FormLabel>Platform</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Medium, LinkedIn, YouTube"
                  value={form.values.platform || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, platform: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="url">
              <FormLabel>URL</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://..."
                  value={form.values.url || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, url: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="engagementMetrics">
              <FormLabel>Engagement Metrics</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. 500 views, 50 likes"
                  value={form.values.engagementMetrics || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, engagementMetrics: e.target.value }))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>

            <FormItem name="description">
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the content..."
                  value={form.values.description || ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, description: e.target.value }))
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Content"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}