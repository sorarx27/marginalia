import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine
import models

print("Creating new tables...")
models.Base.metadata.create_all(bind=engine)
print("Done!")
