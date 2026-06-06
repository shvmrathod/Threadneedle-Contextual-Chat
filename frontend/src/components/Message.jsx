import React, { useMemo } from "react";
import { splitBlocks } from "../utils/splitBlocks.js";
import AssistantBlock from "./AssistantBlock.jsx";

// Maximum visible nesting depth for inline threads.
// depth 0 = top-level message; depth 1, 2 = nested threads.
// Further replies keep being added but stop indenting further (see childDepth).
const MAX_DEPTH = 2;

// Recursive renderer.
// Each assistant message — top-level or inline reply — is rendered through
// AssistantBlock so Reply/Explain are always available. Handlers bind to the
// *current* message id, so inline replies anchor under the reply they target,
// not the top-level message.
export default function Message({
  message,
  inlineByParent,
  loadingAnchor = null,
  onReply,
  onExplain,
  depth = 0,
}) {
  const isUser = message.role === "user";

  // Only assistant messages are split into reply-able blocks.
  const blocks = useMemo(
    () => (isUser ? null : splitBlocks(message.content)),
    [isUser, message.content]
  );

  // Children that anchor to *this* message (top-level OR a nested reply).
  const inlineChildren = useMemo(
    () => inlineByParent.get(message.id) ?? [],
    [inlineByParent, message.id]
  );

  // Group inline children by the block id they're anchored to.
  const childrenByBlock = useMemo(() => {
    const m = new Map();
    for (const c of inlineChildren) {
      const k = c.anchor?.blockId;
      if (k == null) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(c);
    }
    return m;
  }, [inlineChildren]);

  // Reply count per block — drives the small "N" chip next to actions.
  // Counts only finished assistant replies (so the chip doesn't flicker
  // mid-request).
  const replyCounts = useMemo(() => {
    const counts = new Map();
    for (const c of inlineChildren) {
      if (c.role !== "assistant") continue;
      const k = c.anchor?.blockId;
      if (k == null) continue;
      counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [inlineChildren]);

  // Bind handlers to this message's id so AssistantBlock can stay generic.
  const handleReply = (text, blockId) => onReply(text, message.id, blockId);
  const handleExplain = (text, blockId) =>
    onExplain(text, message.id, blockId);

  const showInlineLoaderUnder = (blockId) =>
    loadingAnchor &&
    loadingAnchor.messageId === message.id &&
    loadingAnchor.blockId === blockId;

  if (isUser) {
    return (
      <div className={`msg msg--user${depth > 0 ? " msg--thread" : ""}`}>
        <div className="msg__bubble">
          {message.content.split("\n").map((line, i) => (
            <div key={i}>{line || " "}</div>
          ))}
        </div>
      </div>
    );
  }

  // Cap visible nesting at MAX_DEPTH — beyond that, render flat at MAX_DEPTH.
  const childDepth = Math.min(depth + 1, MAX_DEPTH);

  return (
    <div className={`msg msg--assistant${depth > 0 ? " msg--thread" : ""}`}>
      <div className="msg__bubble">
        {blocks.map((b) => {
          const blockChildren = childrenByBlock.get(b.id) ?? [];
          const showLoader = showInlineLoaderUnder(b.id);
          return (
            <React.Fragment key={b.id}>
              <AssistantBlock
                block={b}
                replyCount={replyCounts.get(b.id) ?? 0}
                onReply={handleReply}
                onExplain={handleExplain}
              />

              {(blockChildren.length > 0 || showLoader) && (
                <div
                  className={`block__inline block__inline--depth-${childDepth}`}
                >
                  {blockChildren.map((child) => (
                    <Message
                      key={child.id}
                      message={child}
                      inlineByParent={inlineByParent}
                      loadingAnchor={loadingAnchor}
                      onReply={onReply}
                      onExplain={onExplain}
                      depth={childDepth}
                    />
                  ))}
                  {showLoader && (
                    <div
                      className="block__inline-loading"
                      aria-label="Thinking"
                    >
                      <span className="dot" />
                      <span className="dot" />
                      <span className="dot" />
                    </div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
