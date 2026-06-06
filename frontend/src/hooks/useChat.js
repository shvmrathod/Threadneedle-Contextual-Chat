import { useCallback, useState } from "react";
import { sendChat } from "../api/chat.js";

// Single source of truth for conversation state.
// Each message: { id, role: "user" | "assistant", content: string,
//                 anchor?: { messageId, blockId } }
//
// `anchor` is purely for inline rendering — it is NEVER sent to the backend.
// The backend still receives a flat linear history.

let _id = 0;
const nextId = () => ++_id;

export function useChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Local mirror of how the backend renders the user turn into history.
  // (Mirrors backend prompts.render_user_turn_for_history — kept in sync.)
  const renderUserTurn = (input, selectedText, mode) => {
    if (mode === "explain" && selectedText) {
      return `✦ explanation`;
    }
    if (mode === "reply" && selectedText) {
      return `↳ ${input.trim()}`;
    }
    return input.trim();
  };

  const send = useCallback(
    async ({
      userInput,
      selectedText = null,
      mode = "normal",
      anchor = null, // { messageId, blockId } when triggered from a block
    }) => {
      setError(null);

      const userContent = renderUserTurn(userInput, selectedText, mode);
      const userMsg = {
        id: nextId(),
        role: "user",
        content: userContent,
        anchor,
      };

      // Optimistic append so the UI updates immediately.
      // Stripping to {role, content} ensures `anchor` is never sent.
      const historyForBackend = messages.map(({ role, content }) => ({
        role,
        content,
      }));
      setMessages((m) => [...m, userMsg]);
      setLoading(true);

      try {
        const { reply } = await sendChat({
          messages: historyForBackend,
          userInput,
          selectedText,
          mode,
        });
        setMessages((m) => [
          ...m,
          { id: nextId(), role: "assistant", content: reply, anchor },
        ]);
      } catch (e) {
        setError(e.message || "Something went wrong.");
        // Roll back the optimistic user message so they can retry cleanly.
        setMessages((m) => m.filter((msg) => msg.id !== userMsg.id));
      } finally {
        setLoading(false);
      }
    },
    [messages]
  );

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, loading, error, send, reset };
}
