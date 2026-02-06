import React, { useState } from "react";
import { useCurrentApplication } from "../helpers/useApplications";
import { useMessageThread, useSendMessage } from "../helpers/useMessages";
import { moderationPresentation, moderationToneColor } from "../helpers/moderationPresentation";

export default function ApplicantMessagesPage() {
  const { data: applicationData } = useCurrentApplication();
  const applicationId = applicationData?.application?.id;
  const { data: messageData } = useMessageThread(applicationId);
  const sendMessage = useSendMessage(applicationId);

  const [body, setBody] = useState("");
  const [lastDecision, setLastDecision] = useState<"approved" | "pending_review" | "blocked" | null>(
    null
  );

  const handleSend = async () => {
    if (!applicationId) return;
    const result = await sendMessage.mutateAsync({
      applicationId,
      body,
    });
    setLastDecision(result.moderationDecision);
    setBody("");
  };

  const latest = lastDecision ? moderationPresentation(lastDecision, "Your message") : null;

  return (
    <div style={{ maxWidth: 920 }}>
      <h1>Messages</h1>
      <p>All messages are pre-publish moderated before caseworker visibility.</p>
      {!applicationId ? <p>Create an application draft first.</p> : null}

      <form
        style={{ marginBottom: 12 }}
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend();
        }}
      >
        <label htmlFor="message-body">Write a message to your caseworker</label>
        <textarea
          id="message-body"
          rows={4}
          style={{ width: "100%" }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Provide details about your case update or question"
        />
        <button
          type="submit"
          disabled={!applicationId || sendMessage.isPending || !body.trim()}
        >
          Send
        </button>
      </form>

      <div aria-live="polite" aria-atomic="true">
        {sendMessage.isPending ? <p>Sending message...</p> : null}
        {latest ? (
          <p style={{ color: moderationToneColor(latest.tone) }}>
            <strong>{latest.label}:</strong> {latest.nextStep}
          </p>
        ) : null}
      </div>

      <ul>
        {messageData?.messages.map((message) => (
          <li key={message.id}>
            {new Date(message.createdAt as any).toLocaleString()} - {message.body} (
            {moderationPresentation(message.moderationDecision, "Message").label})
          </li>
        ))}
      </ul>
    </div>
  );
}
