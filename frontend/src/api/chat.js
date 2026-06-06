// Thin fetch wrapper. One place to add auth headers / retries later.

const BASE = "/api";

export async function sendChat({ messages, userInput, selectedText, mode }) {
  const res = await fetch(`${BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages,
      user_input: userInput,
      selected_text: selectedText ?? null,
      mode,
    }),
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch (_) {}
    throw new Error(detail);
  }
  return res.json(); // { reply, model }
}
