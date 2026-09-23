from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict



class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: "UserOut"


class TokenData(BaseModel):
    user_id: Optional[str] = None
    username: Optional[str] = None
    role: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class UserBase(BaseModel):
    username: str
    email: EmailStr
    full_name: str
    role: str = "operator"
    is_active: bool = True


class UserCreate(UserBase):
    password: str


class UserOut(UserBase):
    id: str
    model_config = ConfigDict(from_attributes=True)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

