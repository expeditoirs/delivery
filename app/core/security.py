from datetime import datetime, timedelta, timezone
from typing import Literal

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings

TokenRole = Literal['user', 'store', 'admin']

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='/api/v1/usuario/login')


def criar_token(entity_id: int, role: TokenRole = 'user') -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.TOKEN_EXPIRE_HOURS)
    payload = {'sub': str(entity_id), 'role': role, 'exp': expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        entity_id = payload.get('sub')
        role = payload.get('role')
        if entity_id is None or role not in {'user', 'store', 'admin'}:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido')
        return {'entity_id': int(entity_id), 'role': role}
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Token inválido') from exc


def get_current_auth(token: str = Depends(oauth2_scheme)) -> dict:
    return decode_token(token)


def get_current_user_id(auth: dict = Depends(get_current_auth)) -> int:
    return auth['entity_id']


def require_role(*allowed_roles: TokenRole):
    def dependency(auth: dict = Depends(get_current_auth)) -> dict:
        if auth['role'] not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Você não tem permissão para acessar este recurso')
        return auth

    return dependency


def require_user(auth: dict = Depends(require_role('user'))):
    return auth


def require_store(auth: dict = Depends(require_role('store'))):
    return auth


def require_admin(auth: dict = Depends(require_role('admin'))):
    return auth
