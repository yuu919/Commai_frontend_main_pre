import importlib.metadata as md
from typing import Dict, Type
from .provider_base import LLMProvider


def load_providers() -> Dict[str, Type[LLMProvider]]:
    providers: Dict[str, Type[LLMProvider]] = {}
    # Preferred: discover via entry points when installed as a distribution
    for ep in md.entry_points(group="llm_gateway.providers"):
        try:
            cls = ep.load()
            providers[cls.name] = cls
        except Exception:
            continue
    if providers:
        return providers
    # Fallback: direct imports when vendored inside the repository
    try:
        from ..providers.openai.client import OpenAIProvider  # type: ignore
        providers[OpenAIProvider.name] = OpenAIProvider
    except Exception:
        pass
    try:
        from ..providers.anthropic.client import AnthropicProvider  # type: ignore
        providers[AnthropicProvider.name] = AnthropicProvider
    except Exception:
        pass
    try:
        from ..providers.gemini.client import GeminiProvider  # type: ignore
        providers[GeminiProvider.name] = GeminiProvider
    except Exception:
        pass
    # Dev mock provider (no external API keys required)
    try:
        from ..providers.mock.client import MockProvider  # type: ignore
        providers[MockProvider.name] = MockProvider
    except Exception:
        pass
    return providers


PROVIDERS = load_providers()


