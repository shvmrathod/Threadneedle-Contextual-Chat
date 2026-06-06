"""POST /api/chat — single endpoint for normal / reply / explain."""
from fastapi import APIRouter, HTTPException, status

from ..config import settings
from ..prompts import build_messages, render_user_turn_for_history
from ..schemas import ChatRequest, ChatResponse, Message, Role
from ..services.openai_service import get_openai_service
from ..services.openrouter_service import get_openrouter_service

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        messages = build_messages(
            history=req.messages,
            user_input=req.user_input,
            selected_text=req.selected_text,
            mode=req.mode,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(e)
        )

    # Provider selection
    if settings.ai_provider == "openrouter":
        service = get_openrouter_service()
    else:
        service = get_openai_service()

    try:
        reply = await service.complete(messages)
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(e)
        )

    return ChatResponse(reply=reply, model=service.model)


@router.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@router.post("/render-user-turn")
async def render_user_turn(req: ChatRequest) -> dict:
    return {
        "content": render_user_turn_for_history(
            req.user_input,
            req.selected_text,
            req.mode
        )
    }


