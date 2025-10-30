from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import json
import time
from .core.errors import LLMError, ErrorBody
from .api.routers.chat import router as chat_router


def create_app() -> FastAPI:
    app = FastAPI(title="LLM Bridge API", version="0.1.0")

    @app.exception_handler(LLMError)
    async def llm_error_handler(request: Request, exc: LLMError):
        # structured log (stdout)
        try:
            payload = await request.body()
        except Exception:
            payload = b""
        log = {
            "ts": time.time(),
            "level": "error",
            "path": request.url.path,
            "method": request.method,
            "provider": exc.provider,
            "code": exc.code,
            "status": exc.status_code,
            "detail": exc.detail,
        }
        print(json.dumps(log, ensure_ascii=False))
        body = ErrorBody(code=exc.code, message=str(exc), provider=exc.provider, detail=exc.detail)
        return JSONResponse(status_code=exc.status_code, content=body.model_dump())

    @app.exception_handler(Exception)
    async def unhandled_error_handler(request: Request, exc: Exception):
        try:
            payload = await request.body()
        except Exception:
            payload = b""
        log = {
            "ts": time.time(),
            "level": "error",
            "path": request.url.path,
            "method": request.method,
            "provider": None,
            "code": "unhandled_exception",
            "status": 500,
            "detail": {"type": type(exc).__name__, "message": str(exc)[:500]},
        }
        print(json.dumps(log, ensure_ascii=False))
        body = ErrorBody(code="provider_api_error", message="Internal Server Error", provider=None, detail={"type": type(exc).__name__})
        return JSONResponse(status_code=500, content=body.model_dump())

    app.include_router(chat_router)
    return app


app = create_app()


