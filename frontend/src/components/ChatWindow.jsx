import React, { useEffect, useMemo, useRef } from "react";
import Message from "./Message.jsx";

export default function ChatWindow({
  messages,
  loading,
  error,
  onReply,
  onExplain,
}) {
  const endRef = useRef(null);

  // Two views over the same linear array:
  //   - topLevel: messages with no anchor (rendered at chat level)
  //   - inlineByParent: messages with an anchor, grouped by source message id
  //                     (rendered inline by <Message>, under the matching block)
  const { topLevel, inlineByParent } = useMemo(() => {
    const topLevel = [];
    const inlineByParent = new Map();
    for (const m of messages) {
      if (m.anchor?.messageId != null) {
        const list = inlineByParent.get(m.anchor.messageId) ?? [];
        list.push(m);
        inlineByParent.set(m.anchor.messageId, list);
      } else {
        topLevel.push(m);
      }
    }
    return { topLevel, inlineByParent };
  }, [messages]);

  // Loading anchor: when an anchored user message was just appended and
  // we're waiting on the assistant, render the dots inline (not at the bottom).
  const loadingAnchor = useMemo(() => {
    if (!loading) return null;
    const last = messages[messages.length - 1];
    if (last?.role !== "user" || !last?.anchor) return null;
    return last.anchor;
  }, [loading, messages]);

  useEffect(() => {
    // Skip auto-scroll when activity is happening inline — keeps the user
    // anchored to the block they're conversing with.
    const last = messages[messages.length - 1];
    if (last?.anchor) return;
    if (loadingAnchor) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading, loadingAnchor]);

  return (
    <div className="chat">
      {messages.length === 0 && !loading && (
        <div className="chat__empty">
          <h2>What can I help with?</h2>
          <p>Hover any part of an answer to reply or explain just that part.</p>
        </div>
      )}

      {topLevel.map((m) => (
        <Message
          key={m.id}
          message={m}
          inlineByParent={inlineByParent}
          loadingAnchor={loadingAnchor}
          onReply={onReply}
          onExplain={onExplain}
          depth={0}
        />
      ))}

      {loading && !loadingAnchor && (
        <div className="msg msg--assistant">
          <div className="msg__bubble msg__bubble--loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
          </div>
        </div>
      )}

      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}

      <div ref={endRef} />
    </div>
  );
}
