"""Authenticated local ML inference API pinned to published MLflow artifacts."""

import logging
import os
import jwt
from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from serving.schemas import InferenceRequest
from serving.predictors import infer

app = FastAPI(title="HGC · Model inference", version="1.0.0")
auth = HTTPBearer(auto_error=False)
OPS = {"CEO", "COO", "GERENTE_REGIONAL", "JEFE_LOGISTICA", "ADMIN_TIENDA"}
ROLES = {
    "sales": OPS,
    "profit": OPS,
    "expansion": OPS,
    "efficiency": {"CEO", "CFO"},
    "margin": {"CEO", "CFO"},
    "clv": {"CEO", "COO", "CMO", "GERENTE_REGIONAL", "GERENTE_MARKETING"},
    "churn": {"CEO", "COO", "CMO", "GERENTE_REGIONAL", "GERENTE_MARKETING"},
}


def user(credentials: HTTPAuthorizationCredentials | None = Depends(auth)):
    if credentials is None:
        raise HTTPException(401, "Autenticación requerida")
    try:
        return jwt.decode(
            credentials.credentials, os.environ["JWT_SECRET"], algorithms=["HS256"]
        )
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesión inválida o expirada") from None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/v1/infer/{module}")
def inference(module: str, request: InferenceRequest, principal: dict = Depends(user)):
    if module not in ROLES:
        raise HTTPException(404, "Módulo desconocido")
    if principal.get("cargo") not in ROLES[module]:
        raise HTTPException(403, "Sin acceso al módulo")
    try:
        return infer(module, request)
    except ValueError as error:
        raise HTTPException(422, str(error)) from None
    except Exception:
        logging.exception("Inference failed for module %s", module)
        raise HTTPException(
            503,
            "No se pudo cargar el modelo publicado. Revisa el servicio ML y su publicación.",
        ) from None
