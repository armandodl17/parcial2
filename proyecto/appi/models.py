from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from db import engine

Base = declarative_base()

class Usuario(Base):
    __tablename__ = 'usuario'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50))
    email = Column(String(100))
    password = Column(String(100))

class Producto(Base):
    __tablename__ = 'products'
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100))
    description = Column(Text)
    precio = Column(Float)
    user_id = Column(Integer, ForeignKey('usuario.id'))

Base.metadata.create_all(engine)