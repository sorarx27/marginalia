import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

# Fallback to local SQLite if not provided, for easy testing before linking PostgreSQL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./marginalia.db")

# SQLite needs check_same_thread=False, PostgreSQL doesn't care
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
