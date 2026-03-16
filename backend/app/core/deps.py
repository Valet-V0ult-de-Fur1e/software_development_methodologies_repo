from fastapi import Depends, HTTPException, status
from app.core.security import verify_token, oauth2_scheme
from app.schemas.auth import TokenData
from app.models.user import UserRole

def get_current_user(token: str = Depends(oauth2_scheme)) -> TokenData:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token_data = verify_token(token)
    if token_data is None:
        raise credentials_exception
    return token_data

def require_role(required_role: UserRole):
    def role_checker(current_user: TokenData = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Insufficient permissions."
            )
        return current_user
    return role_checker

def require_any_role(*roles: UserRole):
    def role_checker(current_user: TokenData = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: Insufficient permissions."
            )
        return current_user
    return role_checker
