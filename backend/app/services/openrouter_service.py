"""Thin OpenRouter wrapper. One responsibility: send messages, return text."""
from typing import List

from openai import APIError, AsyncOpenAI, OpenAIError

from ..config import get_settings


class OpenRouterService:
    def __init__(self) -> None:
        settings = get_settings()
        if not settings.openrouter_api_key:
            raise RuntimeError(
                "OPENROUTER_API_KEY is not set. Copy .env.example to .env."
            )
        self._client = AsyncOpenAI(
            api_key=settings.openrouter_api_key,
            base_url="https://openrouter.ai/api/v1",
        )
        self._model = settings.openrouter_model

    @property
    def model(self) -> str:
        return self._model

    async def complete(self, messages: List[dict]) -> str:
        try:
            response = await self._client.chat.completions.create(
                model=self._model,
                messages=messages,
            )
        except APIError as e:
            raise RuntimeError(f"OpenRouter API error: {e.message}") from e
        except OpenAIError as e:
            raise RuntimeError(f"OpenRouter client error: {e}") from e

        return (response.choices[0].message.content or "").strip()


_service: OpenRouterService | None = None


def get_openrouter_service() -> OpenRouterService:
    """Lazy singleton so import-time doesn't blow up without an API key."""
    global _service
    if _service is None:
        _service = OpenRouterService()
    return _service
