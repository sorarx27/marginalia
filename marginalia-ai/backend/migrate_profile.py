import sqlite3
import sys

def migrate():
    try:
        conn = sqlite3.connect("marginalia.db")
        cursor = conn.cursor()
        
        columns = [
            "complexity_score INTEGER DEFAULT 50",
            "worldbuilding_score INTEGER DEFAULT 50",
            "character_score INTEGER DEFAULT 50",
            "tone_score INTEGER DEFAULT 50",
            "pacing_score INTEGER DEFAULT 50"
        ]
        
        for col in columns:
            try:
                cursor.execute(f"ALTER TABLE taste_profiles ADD COLUMN {col}")
                print(f"Added {col.split()[0]} column.")
            except Exception as e:
                print(f"{col.split()[0]} might already exist:", e)
            
        conn.commit()
        conn.close()
        print("Migration complete.")
    except Exception as e:
        print("Migration failed:", e)
        sys.exit(1)

if __name__ == "__main__":
    migrate()
