from typing import Any, Dict, Optional

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, EmailStr, Field

from . import auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterStartBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: str = ""


class RegisterVerifyBody(BaseModel):
    email: EmailStr
    code: str = Field(..., min_length=6, max_length=6)


class LoginSendCodeBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class LoginVerifyBody(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)
    code: str = Field(..., min_length=6, max_length=6)


@router.post("/register/start")
def register_start(body: RegisterStartBody) -> Dict[str, Any]:
    ok, msg, dev_code = auth_service.register_start(
        body.email, body.password, body.full_name
    )
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    out: Dict[str, Any] = {"message": msg}
    if dev_code:
        out["dev_code"] = dev_code
    return out


@router.post("/register/verify")
def register_verify(body: RegisterVerifyBody) -> Dict[str, str]:
    ok, msg = auth_service.register_verify(body.email, body.code)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}


@router.post("/login/send-code")
def login_send_code(body: LoginSendCodeBody) -> Dict[str, Any]:
    ok, msg, dev_code = auth_service.login_send_code(body.email, body.password)
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    out: Dict[str, Any] = {"message": msg}
    if dev_code:
        out["dev_code"] = dev_code
    return out


@router.post("/login/verify")
def login_verify(body: LoginVerifyBody) -> Dict[str, Any]:
    ok, msg, data = auth_service.login_verify(body.email, body.password, body.code)
    if not ok or not data:
        raise HTTPException(status_code=400, detail=msg)
    return data


@router.get("/me")
def auth_me(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ", 1)[1].strip()
    payload = auth_service.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"email": payload.get("sub"), "uid": payload.get("uid")}