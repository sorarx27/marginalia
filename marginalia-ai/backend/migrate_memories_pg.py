import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.environ.get("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL is not set.")
        return
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Adding image_url column to memories table...")
        try:
            cur.execute("ALTER TABLE memories ADD COLUMN image_url VARCHAR(1000);")
            print("Successfully added image_url column.")
        except psycopg2.errors.DuplicateColumn:
            print("image_url column already exists.")
            
        cur.close()
        conn.close()
        print("Migration complete!")
    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    migrate()
