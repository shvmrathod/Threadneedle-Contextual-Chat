import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

// Exact token palette (VSCode Dark+ spec, tuned for contrast on #171717)
const syntaxTheme = {
  ...vscDarkPlus,
  'pre[class*="language-"]': {
    ...vscDarkPlus['pre[class*="language-"]'],
    background: "transparent",
    color: "#D4D4D4",
  },
  'code[class*="language-"]': {
    ...vscDarkPlus['code[class*="language-"]'],
    background: "transparent",
    color: "#D4D4D4",
  },
  comment:              { color: "#6A9955", fontStyle: "italic" },
  prolog:               { color: "#6A9955" },
  doctype:              { color: "#6A9955" },
  cdata:                { color: "#6A9955" },
  keyword:              { color: "#C586C0" },
  "control-flow":       { color: "#C586C0" },
  "rule":               { color: "#C586C0" },
  builtin:              { color: "#C586C0" },
  "class-name":         { color: "#4EC9B0" },
  function:             { color: "#DCDCAA" },
  "function-variable":  { color: "#DCDCAA" },
  string:               { color: "#CE9178" },
  "attr-value":         { color: "#CE9178" },
  "template-string":    { color: "#CE9178" },
  variable:             { color: "#9CDCFE" },
  parameter:            { color: "#9CDCFE" },
  "attr-name":          { color: "#9CDCFE" },
  number:               { color: "#B5CEA8" },
  boolean:              { color: "#B5CEA8" },
  operator:             { color: "#D4D4D4" },
  punctuation:          { color: "#D4D4D4" },
  tag:                  { color: "#569CD6" },
  "tag .punctuation":   { color: "#808080" },
  property:             { color: "#9CDCFE" },
  "maybe-class-name":   { color: "#4EC9B0" },
  imports:              { color: "#9CDCFE" },
  constant:             { color: "#9CDCFE" },
  regex:                { color: "#D16969" },
  "regex-delimiter":    { color: "#D16969" },
};

// One block of an assistant message + per-block actions.
// Buttons appear on hover (desktop) and are always visible on touch (mobile).
//
// Rendering split:
//   - kind === "code"  → CodeBlock (header + syntax-highlighted body)
//   - everything else  → ReactMarkdown + remark-gfm (tables, task lists, etc.)

export default function AssistantBlock({
  block,
  replyCount = 0,
  onReply,
  onExplain,
}) {
  const { kind, text } = block;
  const hasThread = replyCount > 0;

  return (
    <div
      className={`block block--${kind}`}
      data-has-thread={hasThread || undefined}
    >
      <div className="block__body">
        {kind === "code" ? (
          <CodeBlockFromRaw raw={text} />
        ) : (
          <div className="block__text">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {text}
            </ReactMarkdown>
          </div>
        )}
      </div>

      <div className="block__actions" role="group" aria-label="Block actions">
        <button
          type="button"
          className="block__btn"
          onClick={() => onReply(text, block.id)}
          title="Reply to this part"
        >
          Reply
        </button>

        <button
          type="button"
          className="block__btn block__btn--ghost"
          onClick={() => onExplain(text, block.id)}
          title="Explain this part"
        >
          Explain
        </button>

        {hasThread && (
          <span
            className="block__count"
            title={`${replyCount} ${
              replyCount === 1 ? "reply" : "replies"
            }`}
          >
            {replyCount}
          </span>
        )}
      </div>
    </div>
  );
}

// react-markdown component overrides.
// We unwrap <pre> so our CodeBlock isn't double-wrapped, and we route
// fenced code into the same CodeBlock used by splitBlocks "code" kind.
const markdownComponents = {
  pre({ children }) {
    return <>{children}</>;
  },
  code({ className, children, ...rest }) {
    const match = /language-(\w+)/.exec(className || "");
    const value = String(children).replace(/\n$/, "");
    if (match) {
      return <CodeBlock language={match[1]} value={value} />;
    }
    return (
      <code className={className} {...rest}>
        {children}
      </code>
    );
  },
};

// Wrapper for the splitBlocks "code" kind, which still arrives with fences.
function CodeBlockFromRaw({ raw }) {
  const { language, code } = parseFenced(raw);
  return <CodeBlock language={language} value={code} />;
}

function CodeBlock({ language, value }) {
  const lang = (language || "text").toLowerCase();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (_) {
      // best-effort — clipboard may be unavailable in some contexts.
    }
  };

  return (
    <div className="codeblock">
      <div className="codeblock__header">
        <span className="codeblock__lang">{lang}</span>
        <button
          type="button"
          className="codeblock__copy"
          onClick={copy}
          aria-label="Copy code"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="codeblock__body">
        <SyntaxHighlighter
          language={lang}
          style={syntaxTheme}
          PreTag="div"
          wrapLongLines={false}
          customStyle={{
            margin: 0,
            padding: "18px 20px",
            background: "transparent",
            fontSize: "14px",
            lineHeight: 1.65,
          }}
          codeTagProps={{
            style: {
              fontFamily:
                'SFMono-Regular, ui-monospace, Menlo, Consolas, "Liberation Mono", monospace',
              background: "transparent",
            },
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

function parseFenced(text) {
  const m = text.match(/^\s*```([^\n]*)\n([\s\S]*?)```\s*$/);
  if (m) return { language: m[1].trim(), code: m[2] };
  // Best-effort fallback for malformed fences.
  return {
    language: "",
    code: text.replace(/^\s*```[^\n]*\n?/, "").replace(/```\s*$/, ""),
  };
}
