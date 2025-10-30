from app.clients.llm_gateway.core.schemas import ChatRequest, ChatResponse
from app.clients.llm_gateway.core.registry import PROVIDERS
from app.clients.llm_gateway.core.errors import BadRequestError
from app.clients.llm_gateway.core.config import settings


class ChatService:
    def __init__(self):
        self._providers = PROVIDERS  # name -> class

    def _get_provider_cls(self, name: str):
        prov_cls = self._providers.get(name)
        if prov_cls is None:
            raise BadRequestError(f"Provider '{name}' is not available")
        return prov_cls

    def _merge_model_defaults(self, req: ChatRequest) -> ChatRequest:
        prov = (req.provider or settings.default_provider).lower()
        # priority: models_config > env-based model_defaults
        prov_cfg = settings.models_config.get(prov, {})
        defaults = prov_cfg.get(req.model, {}) or settings.model_defaults.get(prov, {}).get(req.model, {})
        # canonical model mapping (e.g., 4o-mini -> gpt-4o-mini)
        canonical = defaults.get("canonical_model") if isinstance(defaults, dict) else None
        if canonical:
            req.model = canonical
            defaults = prov_cfg.get(canonical, defaults)
        if defaults:
            # client-provided values have priority
            if req.temperature is None and "temperature" in defaults:
                req.temperature = defaults["temperature"]
            if req.top_p is None and "top_p" in defaults:
                req.top_p = defaults["top_p"]
            if req.max_tokens is None and "max_tokens" in defaults:
                req.max_tokens = defaults["max_tokens"]
        return req

    async def chat(self, req: ChatRequest) -> ChatResponse:
        provider_name = (req.provider or settings.default_provider).lower()
        prov_cls = self._get_provider_cls(provider_name)
        req = self._merge_model_defaults(req)
        prov = prov_cls()
        return await prov.chat(req)


