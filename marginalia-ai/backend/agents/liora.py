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

Return the result as a JSON object with two keys: 'memories' and 'books'.
- 'memories': An array of objects with 'memory_type' (e.g., 'preference', 'fact', 'dislike') and 'content' (a concise statement).
- 'books': An array of objects with 'title', 'author' (if mentioned, else null), and 'status' (must be either "Read" or "Currently Reading").

If there is nothing new or permanent to extract, return empty arrays.

Example output:
{
  "memories": [
    {"memory_type": "preference", "content": "Loves books with unreliable narrators."}
  ],
  "books": [
    {"title": "The Martian", "author": "Andy Weir", "status": "Read"}
  ]
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
                    
        except Exception as e:
            print("Error parsing memory extraction:", e)
