from fastapi import status
from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    message: str
    provider: str | None = None
    detail: dict | None = None


class LLMError(Exception):
    status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    code = "llm_internal_error"
    provider: str | None = None
    detail: dict | None = None

    def __init__(self, message: str, provider: str | None = None, detail: dict | None = None):
        super().__init__(message)
        self.provider = provider
        self.detail = detail


class BadRequestError(LLMError):
    status_code = status.HTTP_400_BAD_REQUEST
    code = "bad_request"


class AuthError(LLMError):
    status_code = status.HTTP_401_UNAUTHORIZED
    code = "auth_error"


class RateLimitError(LLMError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    code = "rate_limited"


class ProviderAPIError(LLMError):
    status_code = status.HTTP_502_BAD_GATEWAY
    code = "provider_api_error"


