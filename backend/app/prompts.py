"""Prompt builders.

The frontend is dumb on purpose: it sends `mode` + optional `selected_text`,
and this module turns that into the right system+user messages for the LLM.

Adding a new mode = adding a new branch here, no API changes.
"""
from typing import List

from .schemas import ChatMode, Message, Role

SYSTEM_PROMPT = (
    "You are a helpful, concise assistant. "
    "When the user is replying to a specific part of an earlier answer, "
    "stay tightly focused on that part. Do not re-explain unrelated content. "
    "Prefer short paragraphs and numbered steps so the user can ask follow-ups."
)


def _quote(text: str) -> str:
    """Render selected text as a blockquote so the model can clearly see it."""
    return "\n".join(f"> {line}" for line in text.strip().splitlines())


def build_messages(
    history: List[Message],
    user_input: str,
    selected_text: str | None,
    mode: ChatMode,
) -> List[dict]:
    """Return an OpenAI-format messages list."""
    messages: List[dict] = [{"role": Role.system.value, "content": SYSTEM_PROMPT}]

    for m in history:
        messages.append({"role": m.role.value, "content": m.content})

    if mode == ChatMode.explain:
        if not selected_text:
            raise ValueError("explain mode requires selected_text")
        user_turn = (
            "Explain this part of your previous answer in more detail. "
            "Assume I understand the rest. Keep it focused.\n\n"
            f"{_quote(selected_text)}"
        )

    elif mode == ChatMode.reply:
        if not selected_text:
            raise ValueError("reply mode requires selected_text")
        if not user_input.strip():
            raise ValueError("reply mode requires user_input")
        user_turn = (
            "I'm replying to this specific part of your previous answer:\n\n"
            f"{_quote(selected_text)}\n\n"
            "My question:\n"
            f"{user_input.strip()}\n\n"
            "Answer naturally and conversationally, focused on that part."
        )

    else:  # normal
        if not user_input.strip():
            raise ValueError("normal mode requires user_input")
        user_turn = user_input.strip()

    messages.append({"role": Role.user.value, "content": user_turn})
    return messages


def render_user_turn_for_history(
    user_input: str, selected_text: str | None, mode: ChatMode
) -> str:
    """What we echo back to the frontend as the canonical user message.

    The frontend appends this to its history so future turns include the
    same context the model saw. Keeps history and prompt in sync.
    """
    if mode == ChatMode.explain and selected_text:
        return f'Explain: "{selected_text.strip()}"'
    if mode == ChatMode.reply and selected_text:
        return f'Re: "{selected_text.strip()}"\n\n{user_input.strip()}'
    return user_input.strip()
