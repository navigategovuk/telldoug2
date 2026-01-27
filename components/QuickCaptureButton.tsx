import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Users, 
  MessageSquare, 
  CalendarDays, 
  Lightbulb, 
  MessageCircle, 
  Target 
} from "lucide-react";
import { Button } from "./Button";
import { Popover, PopoverContent, PopoverTrigger } from "./Popover";
import { PeopleDialog } from "./PeopleDialog";
import { InteractionDialog } from "./InteractionDialog";
import { EventDialog } from "./EventDialog";
import { SkillDialog } from "./SkillDialog";
import { FeedbackDialog } from "./FeedbackDialog";
import { GoalDialog } from "./GoalDialog";
import { useAIChatState } from "../helpers/useAIChatState";
import styles from "./QuickCaptureButton.module.css";

interface QuickCaptureButtonProps {
  className?: string;
}

export function QuickCaptureButton({ className }: QuickCaptureButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isOpen: isChatOpen } = useAIChatState();
  
  // Dialog states
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [interactionOpen, setInteractionOpen] = useState(false);
  const [eventOpen, setEventOpen] = useState(false);
  const [skillOpen, setSkillOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  // Keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "n" &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSelect = (setter: (open: boolean) => void) => {
    setIsOpen(false);
    setter(true);
  };

  return (
    <>
      <div 
        className={`${styles.container} ${isChatOpen ? styles.chatOpen : ""} ${className || ""}`}
      >
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button 
              size="icon-lg" 
              className={styles.fab} 
              aria-label="Quick Capture (Press 'n')"
            >
              <Plus size={24} />
            </Button>
          </PopoverTrigger>
          <PopoverContent 
            align="end" 
            side="top" 
            sideOffset={16} 
            className={styles.menu}
          >
            <div className={styles.menuGrid}>
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setPeopleOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--chart-color-1)" }}>
                  <Users size={20} />
                </div>
                <span>Person</span>
              </button>
              
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setInteractionOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--chart-color-2)" }}>
                  <MessageSquare size={20} />
                </div>
                <span>Interaction</span>
              </button>
              
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setEventOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--chart-color-3)" }}>
                  <CalendarDays size={20} />
                </div>
                <span>Event</span>
              </button>
              
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setSkillOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--chart-color-4)" }}>
                  <Lightbulb size={20} />
                </div>
                <span>Skill</span>
              </button>
              
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setFeedbackOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--chart-color-5)" }}>
                  <MessageCircle size={20} />
                </div>
                <span>Feedback</span>
              </button>
              
              <button 
                className={styles.menuItem} 
                onClick={() => handleSelect(setGoalOpen)}
              >
                <div className={styles.iconWrapper} style={{ backgroundColor: "var(--primary)" }}>
                  <Target size={20} />
                </div>
                <span>Goal</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* Dialogs */}
      <PeopleDialog open={peopleOpen} onOpenChange={setPeopleOpen} />
      <InteractionDialog open={interactionOpen} onOpenChange={setInteractionOpen} />
      <EventDialog open={eventOpen} onOpenChange={setEventOpen} />
      <SkillDialog open={skillOpen} onOpenChange={setSkillOpen} />
      <FeedbackDialog open={feedbackOpen} onOpenChange={setFeedbackOpen} />
      <GoalDialog open={goalOpen} onOpenChange={setGoalOpen} />
    </>
  );
}