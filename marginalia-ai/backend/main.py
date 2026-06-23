from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import models, schemas, crud
from database import engine, get_db

# Create the database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Marginalia AI Backend", description="Core API for Liora the reading companion")

@app.get("/")
def read_root():
    return {"message": "Welcome to the Marginalia API"}

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.get("/status")
def status_info():
    return {
        "agent": "Liora",
        "status": "Awaiting Library",
        "memory_systems": "Online",
        "qwen_integration": "Pending"
    }

# --- User Endpoints ---
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/{user_id}", response_model=schemas.UserResponse)
def read_user(user_id: int, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

# --- Book Endpoints ---
@app.post("/users/{user_id}/books/", response_model=schemas.BookResponse)
def create_book_for_user(user_id: int, book: schemas.BookCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_book(db=db, book=book, user_id=user_id)

@app.get("/users/{user_id}/books/", response_model=List[schemas.BookResponse])
def read_books_for_user(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_books(db, user_id=user_id, skip=skip, limit=limit)

# --- Memory Endpoints ---
@app.post("/users/{user_id}/memories/", response_model=schemas.MemoryResponse)
def create_memory_for_user(user_id: int, memory: schemas.MemoryCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user(db, user_id=user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    return crud.create_memory(db=db, memory=memory, user_id=user_id)

@app.get("/users/{user_id}/memories/", response_model=List[schemas.MemoryResponse])
def read_memories_for_user(user_id: int, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_memories(db, user_id=user_id, skip=skip, limit=limit)

# --- Taste Profile Endpoints ---
@app.put("/users/{user_id}/taste_profile/", response_model=schemas.TasteProfileResponse)
def update_user_taste_profile(user_id: int, profile: schemas.TasteProfileCreate, db: Session = Depends(get_db)):
    db_profile = crud.update_taste_profile(db=db, user_id=user_id, profile_update=profile)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Taste profile not found")
    return db_profile
