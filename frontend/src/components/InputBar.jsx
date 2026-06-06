import React, { useEffect, useRef, useState } from "react";
import ReplyChip from "./ReplyChip.jsx";

export default function InputBar({
  replyContext,
  onClearReply,
  onSubmit,
  disabled,
}) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  // Focus input when reply context appears — small UX win.
  useEffect(() => {
    if (replyContext) ref.current?.focus();
  }, [replyContext]);

  const submit = (e) => {
    e?.preventDefault();
    const text = value.trim();
    if (!text || disabled) return;
    onSubmit(text);
    setValue("");
  };

  const onKeyDown = (e) => {
    // Enter to send, Shift+Enter for newline.
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form className="inputbar" onSubmit={submit}>
      {replyContext != null && <ReplyChip text={value} onClear={onClearReply} />}
      <div className="inputbar__row">
        <textarea
          ref={ref}
          className="inputbar__textarea"
          placeholder={
            replyContext
              ? "Ask a follow-up about the selected part…"
              : "Message the assistant…"
          }
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          disabled={disabled}
        />
        <button
          type="submit"
          className="inputbar__send"
          disabled={disabled || !value.trim()}
        >
          Send
        </button>
      </div>
    </form>
  );
}
