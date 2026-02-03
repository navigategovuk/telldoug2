import { 
  User, 
  Linkedin, 
  FileText, 
  Mail, 
  Mic, 
  Sparkles, 
  Copy, 
  RefreshCw,
  Check
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "./Button";
import styles from "./CareerNarrativeDialog.module.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./Dialog";
import { Input } from "./Input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./Select";


import type { InputType } from "../endpoints/ai/career-narrative_POST.schema";


interface CareerNarrativeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NarrativeType = InputType["narrativeType"];
type ToneType = InputType["tone"];

export function CareerNarrativeDialog({
  open,
  onOpenChange,
}: CareerNarrativeDialogProps) {
  const [narrativeType, setNarrativeType] = useState<NarrativeType>("bio");
  const [targetRole, setTargetRole] = useState("");
  const [tone, setTone] = useState<ToneType>("professional");
  
  const [generatedText, setGeneratedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Optional: reset state on close, or keep it for persistence
      // setGeneratedText("");
      // setHasGenerated(false);
    }
  }, [open]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedText("");
    setHasGenerated(true);
    setIsCopied(false);

    try {
      const response = await fetch("/_api/ai/career-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          narrativeType,
          targetRole: targetRole || undefined,
          tone,
        }),
      });

      if (!response.ok) {throw new Error("Failed to generate narrative");}
      if (!response.body) {throw new Error("No response body");}

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) {break;}

        const chunk = decoder.decode(value, { stream: true });
        setGeneratedText((prev) => prev + chunk);
        
        // Auto-scroll to bottom as text generates
        if (contentRef.current) {
          contentRef.current.scrollTop = contentRef.current.scrollHeight;
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      toast.error("Failed to generate narrative. Please try again.");
      setHasGenerated(false); // Allow retry from initial state if failed immediately
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    setIsCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const getNarrativeIcon = (type: NarrativeType) => {
    switch (type) {
      case "bio": return <User size={16} />;
      case "linkedin_summary": return <Linkedin size={16} />;
      case "resume_summary": return <FileText size={16} />;
      case "cover_letter_intro": return <Mail size={16} />;
      case "elevator_pitch": return <Mic size={16} />;
    }
  };

  const getNarrativeLabel = (type: NarrativeType) => {
    switch (type) {
      case "bio": return "Professional Bio";
      case "linkedin_summary": return "LinkedIn Summary";
      case "resume_summary": return "Resume Summary";
      case "cover_letter_intro": return "Cover Letter Intro";
      case "elevator_pitch": return "Elevator Pitch";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.dialogContent}>
        <DialogHeader>
          <DialogTitle className={styles.title}>
            <Sparkles size={20} className={styles.sparkleIcon} />
            Career Narrative AI
          </DialogTitle>
          <DialogDescription>
            Generate professional bios, summaries, and pitches based on your career data.
          </DialogDescription>
        </DialogHeader>

        <div className={styles.container}>
          {/* Left Panel: Controls */}
          <div className={styles.controls}>
            <div className={styles.fieldGroup}>
              <label className={styles.label}>Narrative Type</label>
              <Select 
                value={narrativeType} 
                onValueChange={(v) => setNarrativeType(v as NarrativeType)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(["bio", "linkedin_summary", "resume_summary", "cover_letter_intro", "elevator_pitch"] as NarrativeType[]).map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className={styles.selectItemContent}>
                        {getNarrativeIcon(type)}
                        <span>{getNarrativeLabel(type)}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Target Role (Optional)</label>
              <Input 
                placeholder="e.g. Senior Product Manager" 
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Tone</label>
              <Select 
                value={tone} 
                onValueChange={(v) => setTone(v as ToneType)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="conversational">Conversational</SelectItem>
                  <SelectItem value="executive">Executive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className={styles.generateButton} 
              onClick={handleGenerate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>Generating...</>
              ) : hasGenerated ? (
                <><RefreshCw size={16} /> Regenerate</>
              ) : (
                <><Sparkles size={16} /> Generate Narrative</>
              )}
            </Button>
          </div>

          {/* Right Panel: Result */}
          <div className={styles.resultArea}>
            <div className={styles.resultHeader}>
              <span className={styles.resultLabel}>Generated Result</span>
              {hasGenerated && !isLoading && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopy}
                  className={styles.copyButton}
                >
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}
                  {isCopied ? "Copied" : "Copy"}
                </Button>
              )}
            </div>
            
            <div className={styles.resultContent} ref={contentRef}>
              {!hasGenerated && !isLoading ? (
                <div className={styles.emptyState}>
                  <p>Select your options and click Generate to create your narrative.</p>
                </div>
              ) : (
                <div className={styles.markdownText}>
                  {generatedText}
                  {isLoading && (
                    <span className={styles.cursor}>|</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}