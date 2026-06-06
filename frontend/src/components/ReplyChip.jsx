import React from "react";

// Compact context anchor shown above the input bar when replying/explaining.

export default function ReplyChip({ text, onClear }) {
  const preview = text ? clean(text) : null;
  return (
    <div className="chip" role="status" aria-live="polite">
      <div className="chip__body">
        <span className="chip__text">
          {preview ? `↳ ${preview}` : <span style={{ opacity: 0.4 }}>↳ type your reply…</span>}
        </span>
      </div>
      <button
        type="button"
        className="chip__close"
        onClick={onClear}
        aria-label="Clear reply context"
      >
        ×
      </button>
    </div>
  );
}

function clean(s) {
  const stripped = s
    .replace(/```[\s\S]*?```/g, "")   // fenced code blocks
    .replace(/`[^`]*`/g, "")          // inline code
    .replace(/#{1,6}\s*/g, "")        // headings
    .replace(/\*{1,3}([^*]*)\*{1,3}/g, "$1") // bold / italic
    .replace(/_{1,3}([^_]*)_{1,3}/g, "$1")   // underscore italic/bold
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → label only
    .replace(/^[\s>*\-+]+/gm, "")     // blockquotes, bullets, list markers
    .replace(/\s+/g, " ")             // collapse whitespace
    .trim();
  return stripped.length > 32 ? stripped.slice(0, 32) + "…" : stripped;
}
