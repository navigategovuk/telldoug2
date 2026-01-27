/**
 * ResumeShareDialog Component
 * Allows users to create, manage, and share public links to their resume
 */

import React, { useState, useEffect } from "react";
import { z } from "zod";
import {
  Link2,
  Copy,
  Trash2,
  ShieldOff,
  Lock,
  ExternalLink,
  Plus,
  CheckCircle,
  LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./Dialog";
import { Button } from "./Button";
import { Input } from "./Input";
import { Switch } from "./Switch";
import { Spinner } from "./Spinner";
import { useShareLinkManager } from "../helpers/useShareApi";
import type { Selectable } from "kysely";
import type { PublicShareLinks } from "../helpers/schema";
import styles from "./ResumeShareDialog.module.css";

interface ResumeShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  variantId: string;
  variantName?: string;
}

export function ResumeShareDialog({
  open,
  onOpenChange,
  variantId,
  variantName,
}: ResumeShareDialogProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkPassword, setNewLinkPassword] = useState("");
  const [usePassword, setUsePassword] = useState(false);

  const shareManager = useShareLinkManager(variantId);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setShowCreateForm(false);
      setNewLinkLabel("");
      setNewLinkPassword("");
      setUsePassword(false);
    }
  }, [open]);

  // Auto-clear copied state
  useEffect(() => {
    if (copiedId) {
      const timer = setTimeout(() => setCopiedId(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [copiedId]);

  const handleQuickShare = async () => {
    try {
      await shareManager.createAndCopy({
        resumeVariantId: variantId,
        label: `Quick share - ${new Date().toLocaleDateString()}`,
      });
      setCopiedId("quick");
    } catch (error) {
      console.error("Quick share failed:", error);
    }
  };

  const handleCreateLink = async () => {
    try {
      await shareManager.createShareLink({
        resumeVariantId: variantId,
        label: newLinkLabel || `Share link - ${new Date().toLocaleDateString()}`,
        password: usePassword && newLinkPassword ? newLinkPassword : undefined,
      });
      setShowCreateForm(false);
      setNewLinkLabel("");
      setNewLinkPassword("");
      setUsePassword(false);
    } catch (error) {
      console.error("Create link failed:", error);
    }
  };

  const handleCopyLink = async (link: Selectable<PublicShareLinks>) => {
    const url = `${window.location.origin}/r/${link.token}`;
    await shareManager.copyToClipboard(link.token);
    setCopiedId(link.id);
  };

  const handleRevokeLink = async (linkId: string) => {
    await shareManager.revokeShareLink({ id: linkId });
  };

  const handleDeleteLink = async (linkId: string) => {
    await shareManager.deleteShareLink({ id: linkId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const activeLinks = shareManager.shareLinks.filter((l) => !l.isRevoked);
  const revokedLinks = shareManager.shareLinks.filter((l) => l.isRevoked);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "550px" }}>
        <DialogHeader>
          <DialogTitle>
            Share Resume {variantName && `- ${variantName}`}
          </DialogTitle>
        </DialogHeader>

        <div className={styles.dialogContent}>
          {/* Quick Share */}
          <div className={styles.quickShareSection}>
            <h3 className={styles.sectionTitle}>
              <Link2 className="w-4 h-4" />
              Quick Share
            </h3>
            <div className={styles.quickShareActions}>
              <Button onClick={handleQuickShare} disabled={shareManager.isPending}>
                {shareManager.isPending ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    Creating...
                  </>
                ) : copiedId === "quick" ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Create & Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Existing Links */}
          <div className={styles.linksSection}>
            <div className={styles.linksHeader}>
              <h3 className={styles.sectionTitle}>Your Share Links</h3>
              <span className={styles.linkCount}>
                {activeLinks.length} active
              </span>
            </div>

            {shareManager.isLoading ? (
              <div className={styles.emptyState}>
                <Spinner />
                <span>Loading links...</span>
              </div>
            ) : shareManager.shareLinks.length === 0 ? (
              <div className={styles.emptyState}>
                <LinkIcon className={styles.emptyIcon} />
                <span className={styles.emptyText}>No share links yet</span>
                <span className={styles.emptyHint}>
                  Create a link to share your resume with anyone
                </span>
              </div>
            ) : (
              <div className={styles.linksList}>
                {/* Active links first */}
                {activeLinks.map((link) => (
                  <LinkItem
                    key={link.id}
                    link={link}
                    copiedId={copiedId}
                    onCopy={() => handleCopyLink(link)}
                    onRevoke={() => handleRevokeLink(link.id)}
                    onDelete={() => handleDeleteLink(link.id)}
                    formatDate={formatDate}
                  />
                ))}
                {/* Revoked links */}
                {revokedLinks.map((link) => (
                  <LinkItem
                    key={link.id}
                    link={link}
                    copiedId={copiedId}
                    onCopy={() => handleCopyLink(link)}
                    onRevoke={() => handleRevokeLink(link.id)}
                    onDelete={() => handleDeleteLink(link.id)}
                    formatDate={formatDate}
                    revoked
                  />
                ))}
              </div>
            )}
          </div>

          {/* Create New Link Form */}
          {showCreateForm ? (
            <div className={styles.createLinkSection}>
              <h3 className={styles.sectionTitle}>Create New Link</h3>

              <div className={styles.formRow}>
                <label className={styles.formLabel}>Label (optional)</label>
                <Input
                  value={newLinkLabel}
                  onChange={(e) => setNewLinkLabel(e.target.value)}
                  placeholder="e.g., For Google Application"
                  className={styles.formInput}
                />
                <span className={styles.formHelp}>
                  A name to help you identify this link
                </span>
              </div>

              <div className={styles.optionRow}>
                <div className={styles.optionLabel}>
                  <span className={styles.optionTitle}>Password Protection</span>
                  <span className={styles.optionDescription}>
                    Require a password to view
                  </span>
                </div>
                <Switch checked={usePassword} onCheckedChange={setUsePassword} />
              </div>

              {usePassword && (
                <div className={styles.formRow}>
                  <label className={styles.formLabel}>Password</label>
                  <Input
                    type="password"
                    value={newLinkPassword}
                    onChange={(e) => setNewLinkPassword(e.target.value)}
                    placeholder="Enter password"
                    className={styles.formInput}
                  />
                </div>
              )}

              <div className={styles.formActions}>
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateLink}
                  disabled={shareManager.isPending}
                >
                  {shareManager.isPending ? "Creating..." : "Create Link"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowCreateForm(true)}
              style={{ alignSelf: "flex-start" }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Custom Link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Extracted Link Item Component
interface LinkItemProps {
  link: Selectable<PublicShareLinks>;
  copiedId: string | null;
  onCopy: () => void;
  onRevoke: () => void;
  onDelete: () => void;
  formatDate: (date: Date | string) => string;
  revoked?: boolean;
}

function LinkItem({
  link,
  copiedId,
  onCopy,
  onRevoke,
  onDelete,
  formatDate,
  revoked,
}: LinkItemProps) {
  const hasPassword = !!link.passwordHash;

  return (
    <div className={`${styles.linkItem} ${revoked ? styles.revoked : ""}`}>
      <div className={`${styles.linkIcon} ${revoked ? styles.revoked : styles.live}`}>
        {revoked ? <ShieldOff className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
      </div>

      <div className={styles.linkInfo}>
        <span className={styles.linkLabel}>{link.label || "Untitled Link"}</span>
        <div className={styles.linkMeta}>
          <span>Created {link.createdAt ? formatDate(link.createdAt) : 'N/A'}</span>
          {revoked ? (
            <span className={`${styles.linkBadge} ${styles.revoked}`}>Revoked</span>
          ) : (
            <span className={`${styles.linkBadge} ${styles.live}`}>Active</span>
          )}
          {hasPassword && (
            <span className={`${styles.linkBadge} ${styles.protected}`}>
              <Lock className="w-3 h-3" />
            </span>
          )}
        </div>
      </div>

      <div className={styles.linkActions}>
        {!revoked && (
          <>
            <button
              type="button"
              className={styles.actionButton}
              onClick={onCopy}
              title="Copy link"
            >
              {copiedId === link.id ? (
                <CheckCircle className="w-4 h-4" style={{ color: "var(--color-success)" }} />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <a
              href={`/share/${link.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.actionButton}
              title="Open in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              type="button"
              className={`${styles.actionButton} ${styles.danger}`}
              onClick={onRevoke}
              title="Revoke link"
            >
              <ShieldOff className="w-4 h-4" />
            </button>
          </>
        )}
        <button
          type="button"
          className={`${styles.actionButton} ${styles.danger}`}
          onClick={onDelete}
          title="Delete link"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default ResumeShareDialog;
