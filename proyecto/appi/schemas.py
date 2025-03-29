from pydantic import BaseModel, EmailStr
from typing import Optional, List

class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(UsuarioBase):
    id: int

    class Config:
        orm_mode = True

class ProductoBase(BaseModel):
    nombre: str
    description: Optional[str] = None
    precio: float

class ProductoCreate(ProductoBase):
    user_id: int

class ProductoResponse(ProductoBase):
    id: int
    user_id: int

    class Config:
        orm_mode = True

class LoginRequest(BaseModel):
    email: str
    password: str