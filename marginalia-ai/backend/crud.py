from sqlalchemy.orm import Session
import models, schemas

# --- User CRUD ---
def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

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

# --- Book CRUD ---
def get_books(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Book).filter(models.Book.owner_id == user_id).offset(skip).limit(limit).all()

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

# --- Memory CRUD ---
def get_memories(db: Session, user_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Memory).filter(models.Memory.user_id == user_id).order_by(models.Memory.timestamp.desc()).offset(skip).limit(limit).all()

def create_memory(db: Session, memory: schemas.MemoryCreate, user_id: int):
    db_memory = models.Memory(**memory.model_dump(), user_id=user_id)
    db.add(db_memory)
    db.commit()
    db.refresh(db_memory)
    return db_memory

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
