from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List
import io
import models, schemas, crud, auth, google_books, tts
from database import engine, get_db, SessionLocal
from agents import liora, dreamer
from fastapi.security import OAuth2PasswordRequestForm
from datetime import timedelta
from contextlib import asynccontextmanager
import asyncio

# Create the database tables
models.Base.metadata.create_all(bind=engine)

async def scheduled_dreaming():
    while True:
        await asyncio.sleep(86400) # 24 hours
        print("Running scheduled memory consolidation...")
        db = SessionLocal()
        try:
            users = crud.get_all_users(db)
            for user in users:
                try:
                    result = dreamer.trigger_dream(db, user_id=user.id)
                    print(f"Dream result for user {user.id}: {result}")
                except Exception as e:
                    print(f"Error dreaming for user {user.id}: {e}")
        finally:
            db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(scheduled_dreaming())
    yield
    # Shutdown
    task.cancel()

app = FastAPI(title="Marginalia AI Backend", description="Core API for Liora the reading companion", lifespan=lifespan)

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

# --- Auth Endpoints ---
@app.post("/token", response_model=schemas.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- User Endpoints ---
@app.post("/users/", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = crud.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db=db, user=user)

@app.get("/users/me", response_model=schemas.UserResponse)
def read_user_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# --- Book Endpoints ---
@app.post("/users/me/books/", response_model=schemas.BookResponse)
def create_book_for_user(book: schemas.BookCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_book(db=db, book=book, user_id=current_user.id)

@app.get("/users/me/books/", response_model=List[schemas.BookResponse])
def read_books_for_user(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_books(db, user_id=current_user.id, skip=skip, limit=limit)

@app.put("/users/me/books/{book_id}", response_model=schemas.BookResponse)
def update_book_for_user(book_id: int, book_update: schemas.BookUpdate, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_book = crud.update_book_progress(db=db, book_id=book_id, user_id=current_user.id, book_update=book_update)
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    echo_msg = None
    if book_update.note:
        if db_book.status == "Read":
            context_msg = f"I just finished reading {db_book.title}. My thoughts: {book_update.note}"
        else:
            context_msg = f"I just read up to page {db_book.current_page} of {db_book.title}. My thoughts: {book_update.note}"
        background_tasks.add_task(liora.extract_and_store_memory, db, current_user.id, context_msg, "Thank you for sharing your thoughts on this book.")
        echo_msg = liora.generate_echo(db_book.title, db_book.author or "Unknown Author", book_update.note)
        
    # Convert ORM object to Pydantic model so we can attach the echo
    response_data = schemas.BookResponse.model_validate(db_book)
    response_data.echo = echo_msg
    return response_data

@app.get("/books/search")
def search_books_api(q: str, current_user: models.User = Depends(auth.get_current_user)):
    results = google_books.search_books(q)
    return {"results": results}

# --- Memory Endpoints ---
@app.post("/users/me/memories/", response_model=schemas.MemoryResponse)
def create_memory_for_user(memory: schemas.MemoryCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_memory(db=db, memory=memory, user_id=current_user.id)

@app.get("/users/me/memories/", response_model=List[schemas.MemoryResponse])
def read_memories_for_user(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_memories(db, user_id=current_user.id, skip=skip, limit=limit)

# --- Taste Profile Endpoints ---
@app.put("/users/me/taste_profile/", response_model=schemas.TasteProfileResponse)
def update_user_taste_profile(profile: schemas.TasteProfileCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    db_profile = crud.update_taste_profile(db=db, user_id=current_user.id, profile_update=profile)
    if not db_profile:
        raise HTTPException(status_code=404, detail="Taste profile not found")
    return db_profile

# --- AI Chat Endpoints ---
@app.post("/users/me/chat/", response_model=schemas.ChatResponse)
def chat_with_liora(chat_request: schemas.ChatRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Generate response via DashScope
    reply = liora.generate_liora_response(db=db, user_id=current_user.id, user_message=chat_request.message)
    
    # Schedule memory extraction in the background
    background_tasks.add_task(liora.extract_and_store_memory, db, current_user.id, chat_request.message, reply)
    
    # Save messages to short-term buffer
    if chat_request.message != "__INITIAL_GREETING__":
        crud.create_message_log(db, user_id=current_user.id, role="user", content=chat_request.message)
        crud.create_message_log(db, user_id=current_user.id, role="liora", content=reply)
    
    return {"reply": reply}

@app.get("/users/me/chat/history", response_model=List[schemas.MessageLogResponse])
def read_chat_history(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    # Fetch all historical chat messages ordered chronologically (ascending)
    return db.query(models.MessageLog).filter(
        models.MessageLog.user_id == current_user.id
    ).order_by(models.MessageLog.timestamp.asc()).all()

@app.post("/users/me/dream")
def trigger_memory_consolidation(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    result = dreamer.trigger_dream(db, user_id=current_user.id)
    return result

# --- Speech Endpoints ---
@app.post("/users/me/speak")
def liora_speak(speak_request: schemas.SpeakRequest, current_user: models.User = Depends(auth.get_current_user)):
    try:
        audio_data = tts.synthesize_speech(speak_request.text)
        return StreamingResponse(io.BytesIO(audio_data), media_type="audio/mpeg")
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Speech synthesis failed: {str(e)}"
        )

