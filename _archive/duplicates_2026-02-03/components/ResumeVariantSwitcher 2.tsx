/**
 * ResumeVariantSwitcher Component
 * Allows users to switch between resume variants, create new ones, and manage existing variants
 */

import { Plus, Copy, Star, Trash2, MoreVertical, FileText } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./Button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "./Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./DropdownMenu";
import { Input } from "./Input";
import styles from "./ResumeVariantSwitcher.module.css";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./Select";
import { Textarea } from "./Textarea";
import { useVariants, useCreateVariant, useDeleteVariant, useDuplicateVariant, useSetPrimaryVariant } from "../helpers/useVariantsApi";

import type { VariantOutput } from "../endpoints/variants/variants.schema";


interface ResumeVariantSwitcherProps {
  profileId?: string;
  selectedVariantId?: string;
  onVariantChange?: (variantId: string) => void;
  showCreateButton?: boolean;
  className?: string;
}

export function ResumeVariantSwitcher({
  profileId,
  selectedVariantId,
  onVariantChange,
  showCreateButton = true,
  className,
}: ResumeVariantSwitcherProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [variantToDuplicate, setVariantToDuplicate] = useState<VariantOutput | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [variantToDelete, setVariantToDelete] = useState<VariantOutput | null>(null);

  // Form state for create dialog
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTargetRole, setNewTargetRole] = useState("");

  // Form state for duplicate dialog
  const [duplicateName, setDuplicateName] = useState("");

  const { data, isLoading } = useVariants({ profileId }, { enabled: !!profileId });
  const createVariant = useCreateVariant();
  const deleteVariant = useDeleteVariant();
  const duplicateVariant = useDuplicateVariant();
  const setPrimaryVariant = useSetPrimaryVariant();

  const variants = data?.variants ?? [];

  const handleCreateSubmit = () => {
    if (!newName.trim()) {return;}
    createVariant.mutate(
      { 
        profileId, 
        name: newName.trim(),
        isPrimary: false,
        description: newDescription || null,
        targetRole: newTargetRole || null,
      },
      {
        onSuccess: (result) => {
          setCreateDialogOpen(false);
          setNewName("");
          setNewDescription("");
          setNewTargetRole("");
          if (onVariantChange) {
            onVariantChange(result.variant.id);
          }
        },
      }
    );
  };

  const handleDuplicateSubmit = () => {
    if (!variantToDuplicate || !duplicateName.trim()) {return;}
    duplicateVariant.mutate(
      { id: variantToDuplicate.id, name: duplicateName.trim() },
      {
        onSuccess: (result) => {
          setDuplicateDialogOpen(false);
          setVariantToDuplicate(null);
          setDuplicateName("");
          if (onVariantChange) {
            onVariantChange(result.variant.id);
          }
        },
      }
    );
  };

  const handleDelete = () => {
    if (!variantToDelete) {return;}
    deleteVariant.mutate(
      { id: variantToDelete.id },
      {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setVariantToDelete(null);
          // Switch to primary variant if current was deleted
          if (selectedVariantId === variantToDelete.id && onVariantChange) {
            const primary = variants.find(v => v.isPrimary && v.id !== variantToDelete.id);
            if (primary) {
              onVariantChange(primary.id);
            }
          }
        },
      }
    );
  };

  const handleSetPrimary = (variant: VariantOutput) => {
    if (variant.isPrimary) {return;}
    setPrimaryVariant.mutate({ id: variant.id });
  };

  const openDuplicateDialog = (variant: VariantOutput) => {
    setVariantToDuplicate(variant);
    setDuplicateName(`${variant.name} (Copy)`);
    setDuplicateDialogOpen(true);
  };

  const openDeleteDialog = (variant: VariantOutput) => {
    setVariantToDelete(variant);
    setDeleteConfirmOpen(true);
  };

  if (isLoading) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.selectWrapper}>
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder="Loading..." />
            </SelectTrigger>
          </Select>
        </div>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className={`${styles.container} ${className || ""}`}>
        <div className={styles.emptyState}>
          <FileText className={styles.emptyIcon} />
          <span>No resume variants</span>
        </div>
        {showCreateButton && (
          <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Create First Variant
          </Button>
        )}
        {/* Create Dialog reused from main component */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Variant</DialogTitle>
            </DialogHeader>
            <div className={styles.dialogForm}>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Name *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g., Software Engineer - Google"
                  className={styles.formInput}
                />
              </div>
              <div className={styles.formRow}>
                <label className={styles.formLabel}>Target Role</label>
                <Input
                  value={newTargetRole}
                  onChange={(e) => setNewTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className={styles.formInput}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSubmit} disabled={createVariant.isPending || !newName.trim()}>
                  {createVariant.isPending ? "Creating..." : "Create Variant"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  const selectedVariant = variants.find(v => v.id === selectedVariantId);

  return (
    <div className={`${styles.container} ${className || ""}`}>
      <div className={styles.selectWrapper}>
        <Select
          value={selectedVariantId || ""}
          onValueChange={(value) => onVariantChange?.(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select variant" />
          </SelectTrigger>
          <SelectContent>
            {variants.map((variant) => (
              <SelectItem key={variant.id} value={variant.id}>
                <div className={styles.variantOption}>
                  <span className={styles.variantName}>{variant.name}</span>
                  {variant.isPrimary && (
                    <span className={styles.primaryBadge}>Primary</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedVariant && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className={styles.actionButton}>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => openDuplicateDialog(selectedVariant)}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            {!selectedVariant.isPrimary && (
              <DropdownMenuItem onClick={() => handleSetPrimary(selectedVariant)}>
                <Star className="w-4 h-4 mr-2" />
                Set as Primary
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className={styles.dangerItem}
              onClick={() => openDeleteDialog(selectedVariant)}
              disabled={selectedVariant.isPrimary ?? false}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {showCreateButton && (
        <Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Variant</DialogTitle>
          </DialogHeader>
          <div className={styles.dialogForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Name *</label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g., Software Engineer - Google"
                className={styles.formInput}
              />
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Target Role</label>
              <Input
                value={newTargetRole}
                onChange={(e) => setNewTargetRole(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
                className={styles.formInput}
              />
              <p className={styles.formHelp}>The job title you&apos;re targeting with this variant</p>
            </div>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>Description</label>
              <Textarea
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Notes about this variant..."
                className={styles.formInput}
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateSubmit} disabled={createVariant.isPending || !newName.trim()}>
                {createVariant.isPending ? "Creating..." : "Create Variant"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Duplicate Dialog */}
      <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Duplicate Variant</DialogTitle>
          </DialogHeader>
          <div className={styles.dialogForm}>
            <div className={styles.formRow}>
              <label className={styles.formLabel}>New Name</label>
              <Input
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                placeholder="Enter name for the copy"
                className={styles.formInput}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleDuplicateSubmit} disabled={duplicateVariant.isPending || !duplicateName.trim()}>
                {duplicateVariant.isPending ? "Duplicating..." : "Duplicate"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Variant</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{variantToDelete?.name}&quot;? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteVariant.isPending}
            >
              {deleteVariant.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ResumeVariantSwitcher;
