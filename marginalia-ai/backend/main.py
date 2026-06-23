from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
import models
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
        # Simple query to ensure DB is connected
        db.execute(text("SELECT 1"))
        return {"status": "healthy", "database": "connected"}
    except Exception as e:
        return {"status": "unhealthy", "database": "disconnected", "error": str(e)}

@app.get("/status")
def status_info():
    return {
        "agent": "Liora",
        "status": "Awaiting Library",
        "memory_systems": "Offline",
        "qwen_integration": "Pending"
    }
