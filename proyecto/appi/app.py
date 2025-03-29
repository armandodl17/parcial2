from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import create_engine, Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

DATABASE_URL = "mysql+pymysql://root:@localhost/tienda_db"  
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Usuario(Base):
    __tablename__ = "usuario"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50))
    email = Column(String(100), unique=True, index=True)
    password = Column(String(100))

class Producto(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100))
    description = Column(Text)
    precio = Column(Float)
    user_id = Column(Integer, ForeignKey("usuario.id"))

Base.metadata.create_all(bind=engine)


class UsuarioBase(BaseModel):
    nombre: str
    email: str

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


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == login_data.email).first()
    if usuario and usuario.password == login_data.password:
        return {
            "mensaje": "Login exitoso",
            "usuario": {
                "id": usuario.id,
                "nombre": usuario.nombre,
                "email": usuario.email,
            }
        }
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Email o contraseña incorrectos"
    )

@app.post("/usuarios/", response_model=UsuarioResponse)
def crear_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")
    try:
        db_usuario = Usuario(**usuario.dict())
        db.add(db_usuario)
        db.commit()
        db.refresh(db_usuario)
        return db_usuario
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al crear usuario")

@app.get("/usuarios/", response_model=List[UsuarioResponse])
def listar_usuarios(db: Session = Depends(get_db)):
    return db.query(Usuario).all()

@app.post("/productos/", response_model=ProductoResponse)
def crear_producto(producto: ProductoCreate, db: Session = Depends(get_db)):
    if not db.query(Usuario).filter(Usuario.id == producto.user_id).first():
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    try:
        db_producto = Producto(**producto.dict())
        db.add(db_producto)
        db.commit()
        db.refresh(db_producto)
        return db_producto
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al crear producto")

@app.get("/productos/", response_model=List[ProductoResponse])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(Producto).all()

@app.get("/productos/usuario/{user_id}", response_model=List[ProductoResponse])
def productos_por_usuario(user_id: int, db: Session = Depends(get_db)):
    return db.query(Producto).filter(Producto.user_id == user_id).all()

@app.put("/productos/{producto_id}", response_model=ProductoResponse)
def actualizar_producto(producto_id: int, producto: ProductoCreate, db: Session = Depends(get_db)):
    db_producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not db_producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    try:
        for key, value in producto.dict().items():
            setattr(db_producto, key, value)
        db.commit()
        return db_producto
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al actualizar producto")

@app.delete("/productos/{producto_id}")
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    try:
        db.delete(producto)
        db.commit()
        return {"mensaje": "Producto eliminado correctamente"}
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar producto")