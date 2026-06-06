"""Thin OpenAI wrapper. One responsibility: send messages, return text."""
from typing import List

from openai import APIError, AsyncOpenAI, OpenAIError

from ..config import get_settings


class OpenAIService:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openai_api_key:
            raise RuntimeError(
                "OPENAI_API_KEY is not set. Copy .env.example to .env."
            )
        self._client = AsyncOpenAI(api_key=settings.openai_api_key)
        self._model = settings.openai_model

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, messages: List[dict]) -> str:
        try:
            resp = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
                temperature=0.4,
            )
        except APIError as e:
            # Upstream returned a structured error
            raise RuntimeError(f"OpenAI API error: {e.message}") from e
        except OpenAIError as e:
            raise RuntimeError(f"OpenAI client error: {e}") from e

        choice = resp.choices[0]
        return (choice.message.content or "").strip()


_service: OpenAIService | None = None


def get_openai_service() -> OpenAIService:
    """Lazy singleton so import-time doesn't blow up without an API key."""
    global _service
    if _service is None:
        _service = OpenAIService()
    return _service
