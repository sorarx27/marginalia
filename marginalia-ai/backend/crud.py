from sqlalchemy.orm import Session
import models, schemas

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_all_users(db: Session):
    return db.query(models.User).all()

def create_user(db: Session, user: schemas.UserCreate):
    import auth
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(username=user.username, email=user.email, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Initialize an empty taste profile for the new user
    db_profile = models.TasteProfile(user_id=db_user.id)
    db.add(db_profile)
    db.commit()
    
    return db_user

def update_user(db: Session, user_id: int, user_update: schemas.UserUpdate):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if db_user:
        update_data = user_update.model_dump(exclude_unset=True)
        if "password" in update_data:
            import auth
            hashed = auth.get_password_hash(update_data.pop("password"))
            db_user.hashed_password = hashed
        for key, value in update_data.items():
            setattr(db_user, key, value)
        db.commit()
        db.refresh(db_user)
    return db_user

# --- Book CRUD ---
def get_books(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Book).filter(models.Book.owner_id == user_id).offset(skip).limit(limit).all()

def get_book_by_title_and_user(db: Session, title: str, user_id: int):
    return db.query(models.Book).filter(
        models.Book.owner_id == user_id,
        models.Book.title.ilike(f"%{title}%")
    ).first()

def create_book(db: Session, book: schemas.BookCreate, user_id: int):
    db_book = models.Book(**book.model_dump(), owner_id=user_id)
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

def update_book_progress(db: Session, book_id: int, user_id: int, book_update: schemas.BookUpdate):
    db_book = db.query(models.Book).filter(models.Book.id == book_id, models.Book.owner_id == user_id).first()
    if db_book:
        update_data = book_update.model_dump(exclude_unset=True)
        if "note" in update_data:
            update_data.pop("note")
        for key, value in update_data.items():
            setattr(db_book, key, value)
        db.commit()
        db.refresh(db_book)
    return db_book

def delete_book(db: Session, book_id: int, user_id: int) -> bool:
    db_book = db.query(models.Book).filter(models.Book.id == book_id, models.Book.owner_id == user_id).first()
    if db_book:
        db.delete(db_book)
        db.commit()
        return True
    return False

# --- Memory CRUD ---
def get_memories(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Memory).filter(models.Memory.user_id == user_id).order_by(models.Memory.timestamp.desc()).offset(skip).limit(limit).all()

import math
def cosine_similarity(v1, v2):
    if not v1 or not v2 or len(v1) != len(v2): return 0.0
    dot_product = sum(x * y for x, y in zip(v1, v2))
    norm_v1 = math.sqrt(sum(x * x for x in v1))
    norm_v2 = math.sqrt(sum(x * x for x in v2))
    if norm_v1 == 0 or norm_v2 == 0: return 0.0
    return dot_product / (norm_v1 * norm_v2)

def get_rag_memories(db: Session, user_id: int, query_embedding: list[float], limit: int = 5):
    # Fetch all memories with embeddings
    memories = db.query(models.Memory).filter(models.Memory.user_id == user_id).filter(models.Memory.embedding.isnot(None)).all()
    if not memories:
        return []
        
    # Calculate similarities and sort
    scored_memories = []
    for mem in memories:
        sim = cosine_similarity(query_embedding, mem.embedding)
        scored_memories.append((sim, mem))
        
    scored_memories.sort(key=lambda x: x[0], reverse=True)
    
    # Return top K memories, ignoring scores below a certain threshold to avoid garbage
    return [m[1] for m in scored_memories[:limit] if m[0] > 0.3]

def create_memory(db: Session, memory: schemas.MemoryCreate, user_id: int):
    db_memory = models.Memory(**memory.model_dump(), user_id=user_id)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

def delete_memories(db: Session, memory_ids: list[int], user_id: int):
    db.query(models.Memory).filter(models.Memory.id.in_(memory_ids), models.Memory.user_id == user_id).delete(synchronize_session=False)
    db.commit()

# --- Taste Profile CRUD ---
def update_taste_profile(db: Session, user_id: int, profile_update: schemas.TasteProfileCreate):
    db_profile = db.query(models.TasteProfile).filter(models.TasteProfile.user_id == user_id).first()
    if db_profile:
        update_data = profile_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_profile, key, value)
        db.commit()
        db.refresh(db_profile)
    return db_profile

# --- Message Log CRUD ---
def get_recent_messages(db: Session, user_id: int, limit: int = 10):
    # Fetch ordered by timestamp desc to get most recent, then reverse to chronological order
    messages = db.query(models.MessageLog).filter(models.MessageLog.user_id == user_id).order_by(models.MessageLog.timestamp.desc()).limit(limit).all()
    return list(reversed(messages))

def create_message_log(db: Session, user_id: int, role: str, content: str):
    db_message = models.MessageLog(user_id=user_id, role=role, content=content)
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

# --- Global Book Notes CRUD ---
def create_global_note(db: Session, note: schemas.GlobalBookNoteCreate):
    db_note = models.GlobalBookNote(**note.model_dump())
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def get_global_notes_by_title(db: Session, title: str, limit: int = 3):
    return db.query(models.GlobalBookNote).filter(
        models.GlobalBookNote.book_title.ilike(f"%{title}%")
    ).order_by(models.GlobalBookNote.timestamp.desc()).limit(limit).all()
