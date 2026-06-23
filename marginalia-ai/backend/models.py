from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    books = relationship("Book", back_populates="owner")
    memories = relationship("Memory", back_populates="user")
    taste_profile = relationship("TasteProfile", back_populates="user", uselist=False)

class TasteProfile(Base):
    """Liora's aggregated understanding of a user's reading preferences"""
    __tablename__ = "taste_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    favorite_genres = Column(String(200)) # Stored as comma-separated
    dislikes = Column(Text)
    pacing_preference = Column(String(50))
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="taste_profile")

class Book(Base):
    __tablename__ = "books"
    
    id = Column(Integer, primary_key=True, index=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String(200), index=True, nullable=False)
    author = Column(String(100), index=True)
    isbn = Column(String(20))
    cover_image_url = Column(String(255))
    total_pages = Column(Integer)
    current_page = Column(Integer, default=0)
    status = Column(String(50), default="To Read") # To Read, Reading, Finished
    rating = Column(Float, nullable=True)
    
    owner = relationship("User", back_populates="books")
    reading_sessions = relationship("ReadingSession", back_populates="book")

class ReadingSession(Base):
    """A specific conversation/session with Liora about a book"""
    __tablename__ = "reading_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("books.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    pages_read = Column(Integer, default=0)
    
    book = relationship("Book", back_populates="reading_sessions")
    messages = relationship("ChatMessage", back_populates="session")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("reading_sessions.id"))
    role = Column(String(20), nullable=False) # 'user' or 'liora'
    content = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("ReadingSession", back_populates="messages")

class Memory(Base):
    """Explicitly extracted memory fragments for the MemoryAgent architecture"""
    __tablename__ = "memories"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    book_id = Column(Integer, ForeignKey("books.id"), nullable=True) # Optional, can be a general memory
    memory_type = Column(String(50)) # e.g. "plot_theory", "character_reaction", "emotional_state"
    content = Column(Text, nullable=False)
    importance_score = Column(Float, default=1.0) # Used for RAG retrieval weighing
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="memories")
    # Note: We won't map book relationship backwards to avoid clutter, just query by book_id when needed
