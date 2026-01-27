import React, { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Sparkles, Minimize2 } from "lucide-react";
import { useAIChatState } from "../helpers/useAIChatState";
import { Button } from "./Button";
import { Input } from "./Input";
import { Skeleton } from "./Skeleton";

import styles from "./AIChatPanel.module.css";

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

export function AIChatPanel() {
  const { isOpen, setIsOpen } = useAIChatState();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hi! I'm Doug. I can help you query your career data. What would you like to know?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) {return;}

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // Prepare history for context (exclude the initial greeting if it wasn't from API)
      const history = messages.filter(m => m.role !== "system");

      const response = await fetch("/_api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: history,
        }),
      });

      if (!response.ok) {throw new Error("Failed to send message");}
      if (!response.body) {throw new Error("No response body");}

      // Add placeholder for assistant response
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {break;}

        const chunk = decoder.decode(value, { stream: true });
        assistantMessage += chunk;

        setMessages((prev) => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage.role === "assistant") {
            lastMessage.content = assistantMessage;
          }
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I encountered an error processing your request." },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <div className={`${styles.triggerContainer} ${isOpen ? styles.hidden : ""}`}>
        <Button
          size="icon-lg"
          className={styles.triggerButton}
          onClick={() => setIsOpen(true)}
        >
          <MessageCircle size={28} />
        </Button>
      </div>

      {/* Chat Panel */}
      <div className={`${styles.panel} ${isOpen ? styles.open : ""}`}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <Sparkles size={18} className={styles.sparkleIcon} />
            <span>Tell Doug</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsOpen(false)}
            className={styles.closeButton}
          >
            <Minimize2 size={18} />
          </Button>
        </div>

        <div className={styles.messagesArea}>
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`${styles.messageRow} ${
                msg.role === "user" ? styles.userRow : styles.assistantRow
              }`}
            >
              <div
                className={`${styles.messageBubble} ${
                  msg.role === "user" ? styles.userBubble : styles.assistantBubble
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className={`${styles.messageRow} ${styles.assistantRow}`}>
              <div className={`${styles.messageBubble} ${styles.assistantBubble}`}>
                <div className={styles.typingIndicator}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form className={styles.inputArea} onSubmit={handleSubmit}>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your career..."
            className={styles.chatInput}
            disabled={isLoading}
          />
          <Button
            type="submit"
            size="icon-md"
            disabled={!input.trim() || isLoading}
            className={styles.sendButton}
          >
            <Send size={18} />
          </Button>
        </form>
      </div>
    </>
  );
}