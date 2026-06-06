# Contributing to Contextual Chat

Thanks for your interest in contributing. This is a focused portfolio project, but issues and PRs are welcome.

## Getting started

1. Fork the repository and clone your fork.
2. Follow the setup instructions in [README.md](./README.md).
3. Create a branch: `git checkout -b your-feature-name`.

## What to work on

Check the **Roadmap** section in the README for planned features. Issues labeled `good first issue` are good starting points.

## Code style

**Backend (Python):**
- Follow the existing patterns in `openai_service.py` — type hints, docstrings, explicit error handling.
- Run `ruff check .` before submitting (install with `pip install ruff`).

**Frontend (JavaScript/JSX):**
- No TypeScript — keeping the stack minimal is intentional.
- Match the existing component patterns: named exports, props documented via JSDoc comments on complex shapes.
- Run `npm run build` to catch any obvious errors before submitting.

## Submitting a PR

- Keep PRs focused — one feature or fix per PR.
- Add a clear description of what changed and why.
- If your change touches the API contract (`schemas.py`), update the README architecture section too.

## Reporting issues

Open a GitHub issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your OS, Python version, and Node version
