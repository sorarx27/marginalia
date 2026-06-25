from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# --- Memory Schemas ---
class MemoryBase(BaseModel):
    memory_type: str
    content: str
    book_id: Optional[int] = None
    importance_score: float = 1.0

class MemoryCreate(MemoryBase):
    pass

class MemoryResponse(MemoryBase):
    id: int
    user_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

# --- Book Schemas ---
class BookBase(BaseModel):
    title: str
    author: Optional[str] = None
    isbn: Optional[str] = None
    cover_image_url: Optional[str] = None
    total_pages: Optional[int] = None
    current_page: int = 0
    status: str = "To Read"
    rating: Optional[float] = None
    recommended_by_liora: bool = False
    liora_note: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    current_page: Optional[int] = None
    status: Optional[str] = None
    rating: Optional[float] = None
    note: Optional[str] = None
    recommended_by_liora: Optional[bool] = None

class BookResponse(BookBase):
    id: int
    owner_id: int
    echo: Optional[str] = None

    class Config:
        from_attributes = True

# --- Taste Profile Schemas ---
class TasteProfileBase(BaseModel):
    favorite_genres: Optional[str] = None
    dislikes: Optional[str] = None
    pacing_preference: Optional[str] = None
    complexity_score: int = 50
    worldbuilding_score: int = 50
    character_score: int = 50
    tone_score: int = 50
    pacing_score: int = 50

class TasteProfileCreate(TasteProfileBase):
    pass

class TasteProfileResponse(TasteProfileBase):
    id: int
    user_id: int
    last_updated: datetime

    class Config:
        from_attributes = True

# --- User Schemas ---
class UserBase(BaseModel):
    username: str
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime
    taste_profile: Optional[TasteProfileResponse] = None
    books: List[BookResponse] = []
    memories: List[MemoryResponse] = []

    class Config:
        from_attributes = True

# --- Chat Schemas ---
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# --- Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
