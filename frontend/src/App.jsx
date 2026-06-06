import React, { useState } from "react";
import ChatWindow from "./components/ChatWindow.jsx";
import InputBar from "./components/InputBar.jsx";
import { useChat } from "./hooks/useChat.js";

export default function App() {
  const { messages, loading, error, send, reset } = useChat();
  const [replyContext, setReplyContext] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // replyContext now carries the anchor so the resulting messages can be
  // rendered inline under the source block.
  // Shape: { text, messageId, blockId } | null
  const handleReply = (text, messageId, blockId) =>
    setReplyContext({ text, messageId, blockId });

  const handleExplain = (text, messageId, blockId) => {
    // Explain is a one-shot action — no user input required.
    send({
      userInput: "",
      selectedText: text,
      mode: "explain",
      anchor: { messageId, blockId },
    });
  };

  const handleSubmit = (text) => {
    if (replyContext) {
      send({
        userInput: text,
        selectedText: replyContext.text,
        mode: "reply",
        anchor: {
          messageId: replyContext.messageId,
          blockId: replyContext.blockId,
        },
      });
      setReplyContext(null);
    } else {
      send({ userInput: text, mode: "normal" });
    }
  };

  const handleNewChat = () => {
    reset();
    setReplyContext(null);
    setSidebarOpen(false);
  };

  return (
    <div className={`app${sidebarOpen ? " app--sidebar-open" : ""}`}>
      <aside className="sidebar" aria-label="Conversations">
        <div className="sidebar__top">
          <button
            type="button"
            className="sidebar__newchat"
            onClick={handleNewChat}
          >
            <span className="sidebar__newchat-icon" aria-hidden="true">＋</span>
            <span>New chat</span>
          </button>
        </div>

        <div className="sidebar__history" aria-label="Chat history">
          <div className="sidebar__section-label">Today</div>
          <div className="sidebar__item sidebar__item--active">
            Current conversation
          </div>
        </div>

        <div className="sidebar__footer">
          <div className="sidebar__user">
            <span className="sidebar__avatar" aria-hidden="true">T</span>
            <span className="sidebar__user-name">Threadneedle</span>
          </div>
        </div>
      </aside>

      <button
        type="button"
        className="sidebar__scrim"
        aria-label="Close sidebar"
        onClick={() => setSidebarOpen(false)}
        tabIndex={sidebarOpen ? 0 : -1}
      />

      <div className="main">
        <header className="topbar" aria-label="App bar">
          <button
            type="button"
            className="topbar__icon"
            aria-label="Toggle sidebar"
            onClick={() => setSidebarOpen((v) => !v)}
          >
            <span />
            <span />
            <span />
          </button>
          <div className="topbar__title">Threadneedle</div>
          <button
            type="button"
            className="topbar__icon"
            aria-label="New chat"
            onClick={handleNewChat}
          >
            ＋
          </button>
        </header>

        <main className="scrollarea">
          <ChatWindow
            messages={messages}
            loading={loading}
            error={error}
            onReply={handleReply}
            onExplain={handleExplain}
          />
        </main>

        <footer className="composer">
          <InputBar
            replyContext={replyContext?.text ?? null}
            onClearReply={() => setReplyContext(null)}
            onSubmit={handleSubmit}
            disabled={loading}
          />
          <div className="composer__hint">
            Hover any part of an answer to reply or explain just that part.
          </div>
        </footer>
      </div>
    </div>
  );
}
