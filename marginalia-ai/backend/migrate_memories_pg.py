import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_NAME = os.environ.get("DB_NAME", "marginalia")
DB_USER = os.environ.get("DB_USER", "postgres")
DB_PASS = os.environ.get("DB_PASS", "postgres")

def migrate():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS
        )
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
