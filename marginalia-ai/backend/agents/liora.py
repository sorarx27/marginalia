import os
import dashscope
from dashscope import Generation
from sqlalchemy.orm import Session
import crud

dashscope.api_key = os.getenv("DASHSCOPE_API_KEY")
if os.getenv("DASHSCOPE_BASE_URL"):
    dashscope.base_http_api_url = os.getenv("DASHSCOPE_BASE_URL")

LIORA_SYSTEM_PROMPT = """
You are Liora, an emotionally intelligent, multilingual AI reading companion.
Your personality is warm, literary, observant, and deeply insightful. You love discussing books
not just on a plot level, but on an emotional and thematic level.
You speak clearly, concisely, and sometimes use elegant or poetic metaphors, but without sounding artificial.
You remember what the user tells you.

Here is what you currently know about this reader from past memories:
{user_memories}

Here is their general reading taste:
{taste_profile}

Respond to their message directly. Do not break character.
"""

MEMORY_EXTRACTION_PROMPT = """
You are a background cognitive processor for Liora, an AI reading companion.
Your job is to read a recent message from the user and extract:
1. Any new, permanent facts, preferences, or reading habits they shared (as memories).
2. Any books they explicitly mention having read in the past, or books they mention currently reading.
3. OCCASIONALLY, if the user expresses a very strong preference or opinion, you may provide ONE proactive book recommendation that perfectly matches their taste. Only do this if it's a brilliant match.
4. ANY TIME the user shares an opinion on a book, extract subtle shifts in their taste profile across 5 axes (0-100 scale).

Return the result as a JSON object with up to four keys: 'memories', 'books', 'proactive_recommendation', and 'taste_shifts'.
- 'memories': An array of objects with 'memory_type' (e.g., 'preference', 'fact', 'dislike') and 'content'.
- 'books': An array of objects with 'title', 'author', and 'status' (must be either "Read" or "Currently Reading").
- 'proactive_recommendation' (optional): An object with 'title', 'author', and 'note' (a personalized message from Liora explaining why she recommends it).
- 'taste_shifts' (optional): An object with 5 keys ('complexity_score', 'worldbuilding_score', 'character_score', 'tone_score', 'pacing_score'). ONLY include the keys that the user's message directly influences. Values should be integers between 0 and 100 representing the user's PREFERRED state (e.g. if they say "I love complex magic systems", 'worldbuilding_score' might be 85).

If there is nothing new to extract, return empty arrays. If no recommendation or shift is warranted, omit the key or set it to null.

Example output:
{
  "memories": [{"memory_type": "preference", "content": "Loves hard sci-fi with political intrigue."}],
  "books": [],
  "proactive_recommendation": {
    "title": "The Expanse",
    "author": "James S.A. Corey",
    "note": "Based on your love for hard sci-fi and politics, I pulled this from the archives. I think you'll find the solar system dynamics fascinating."
  },
  "taste_shifts": {
    "complexity_score": 80,
    "worldbuilding_score": 90
  }
}
"""

def generate_liora_response(db: Session, user_id: int, user_message: str) -> str:
    # 1. Fetch user context
    memories = crud.get_memories(db, user_id=user_id, limit=10)
    user = crud.get_user(db, user_id=user_id)
    
    # 2. Format memories
    if memories:
        memory_text = "\n".join([f"- {m.content}" for m in memories])
    else:
        memory_text = "No specific memories recorded yet. Start learning about them!"
        
    # 3. Format taste profile
    if user and user.taste_profile:
        tp = user.taste_profile
        taste_text = f"Favorites: {tp.favorite_genres or 'Unknown'}. Dislikes: {tp.dislikes or 'Unknown'}."
    else:
        taste_text = "No taste profile established yet."

    # 4. Construct Prompt
    system_prompt = LIORA_SYSTEM_PROMPT.format(
        user_memories=memory_text,
        taste_profile=taste_text
    )

    if user_message == "__INITIAL_GREETING__":
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Hello. I am a new reader in your library. Please introduce yourself and welcome me, referencing my taste profile if you can."}
        ]
    else:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ]

    # 5. Call Qwen (Tongyi Qianwen)
    response = Generation.call(
        model='qwen-turbo', # or qwen-plus/qwen-max depending on trial
        messages=messages,
        result_format='message'
    )

    if response.status_code == 200:
        return response.output.choices[0].message.content
    else:
        return f"*(Liora seems lost in thought...)* Error {response.code}: {response.message}"

def extract_and_store_memory(db: Session, user_id: int, user_message: str, liora_reply: str):
    import json
    import schemas
    
    if user_message == "__INITIAL_GREETING__":
        return

    messages = [
        {"role": "system", "content": MEMORY_EXTRACTION_PROMPT},
        {"role": "user", "content": f"User's message: {user_message}\nLiora's reply: {liora_reply}"}
    ]

    response = Generation.call(
        model='qwen-turbo',
        messages=messages,
        result_format='message'
    )

    if response.status_code == 200:
        content = response.output.choices[0].message.content
        try:
            # Clean up markdown code blocks if any
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            extracted_data = json.loads(content)
            
            # Handle old array format fallback or new object format
            if isinstance(extracted_data, list):
                extracted_memories = extracted_data
                extracted_books = []
            else:
                extracted_memories = extracted_data.get("memories", [])
                extracted_books = extracted_data.get("books", [])

            for m in extracted_memories:
                memory_schema = schemas.MemoryCreate(
                    memory_type=m.get('memory_type', 'fact'),
                    content=m.get('content', '')
                )
                crud.create_memory(db, memory=memory_schema, user_id=user_id)
                
            # Handle extracted books
            import google_books
            for b in extracted_books:
                title = b.get('title')
                author = b.get('author', '')
                status = b.get('status', 'Read')
                if title:
                    query = f"{title} {author}".strip()
                    search_results = google_books.search_books(query)
                    
                    cover_image_url = None
                    total_pages = 0
                    if search_results:
                        first_result = search_results[0]
                        # Use the result's title and author for accuracy if possible
                        db_title = first_result.get("title", title)
                        db_author = ", ".join(first_result.get("authors", [])) or author
                        cover_image_url = first_result.get("cover_image_url")
                        total_pages = first_result.get("page_count", 0)
                    else:
                        db_title = title
                        db_author = author
                        
                    book_schema = schemas.BookCreate(
                        title=db_title,
                        author=db_author,
                        cover_image_url=cover_image_url,
                        total_pages=total_pages,
                        status=status,
                        current_page=0
                    )
                    crud.create_book(db, book=book_schema, user_id=user_id)
                    
                    
            # Handle proactive recommendation
            proactive_rec = extracted_data.get("proactive_recommendation")
            if proactive_rec and proactive_rec.get("title"):
                title = proactive_rec.get("title")
                author = proactive_rec.get("author", "")
                note = proactive_rec.get("note", "I thought you might enjoy this.")
                
                query = f"{title} {author}".strip()
                search_results = google_books.search_books(query)
                
                cover_image_url = None
                total_pages = 0
                if search_results:
                    first_result = search_results[0]
                    db_title = first_result.get("title", title)
                    db_author = ", ".join(first_result.get("authors", [])) or author
                    cover_image_url = first_result.get("cover_image_url")
                    total_pages = first_result.get("page_count", 0)
                else:
                    db_title = title
                    db_author = author
                    
                book_schema = schemas.BookCreate(
                    title=db_title,
                    author=db_author,
                    cover_image_url=cover_image_url,
                    total_pages=total_pages,
                    status="To Read",
                    current_page=0,
                    recommended_by_liora=True,
                    liora_note=note
                )
                crud.create_book(db, book=book_schema, user_id=user_id)
                
            # Handle taste shifts
            taste_shifts = extracted_data.get("taste_shifts")
            if taste_shifts:
                user = crud.get_user(db, user_id=user_id)
                if user and user.taste_profile:
                    update_data = {}
                    for key in ["complexity_score", "worldbuilding_score", "character_score", "tone_score", "pacing_score"]:
                        if key in taste_shifts:
                            current_val = getattr(user.taste_profile, key, 50)
                            shift_val = taste_shifts[key]
                            # Blend the new value with the old value (e.g. 70% old, 30% new) to make it gradual
                            new_val = int((current_val * 0.7) + (shift_val * 0.3))
                            # Ensure it stays within bounds
                            new_val = max(0, min(100, new_val))
                            update_data[key] = new_val
                    
                    if update_data:
                        profile_schema = schemas.TasteProfileCreate(**update_data)
                        crud.update_taste_profile(db, user_id=user_id, profile_update=profile_schema)
                
        except Exception as e:
            print("Error parsing memory extraction:", e)

def generate_echo(title: str, author: str, user_note: str) -> str:
    prompt = f"""
You are Liora, an AI reading companion. The user has just saved a review/note for the book "{title}" by {author}.
Their note: "{user_note}"

Your task is to generate an "Echo"—a 1-2 sentence observation comparing their thoughts to a simulated global reading community consensus.
Make it sound insightful and slightly ethereal. For example: "Many readers also found the middle chapters slow, but your take on the protagonist's motives is quite unique."
Keep it brief and directly address the user's specific points. Do not use quotes around your response.
"""
    messages = [
        {"role": "system", "content": "You are Liora, an insightful AI reading companion."},
        {"role": "user", "content": prompt}
    ]
    response = Generation.call(
        model='qwen-turbo',
        messages=messages,
        result_format='message'
    )
    if response.status_code == 200:
        return response.output.choices[0].message.content.strip()
    return ""
