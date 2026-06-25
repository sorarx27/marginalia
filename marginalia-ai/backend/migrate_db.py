import sqlite3
import sys

def migrate():
    try:
        conn = sqlite3.connect("marginalia.db")
        cursor = conn.cursor()
        try:
            cursor.execute("ALTER TABLE books ADD COLUMN recommended_by_liora BOOLEAN DEFAULT 0")
            print("Added recommended_by_liora column.")
        except Exception as e:
            print("recommended_by_liora might already exist:", e)
            
        try:
            cursor.execute("ALTER TABLE books ADD COLUMN liora_note TEXT")
            print("Added liora_note column.")
        except Exception as e:
            print("liora_note might already exist:", e)
            
        conn.commit()
        conn.close()
        print("Migration complete.")
    except Exception as e:
        print("Migration failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    migrate()
