import os
import dashscope
from dashscope import Generation, ImageSynthesis, TextEmbedding
from sqlalchemy.orm import Session
from http import HTTPStatus
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

The user you are chatting with is named '{username}'. You MUST address them as '{username}' naturally and warmly during your chats, instead of using generic terms like "user" or "reader" (unless contextually appropriate).

Here is what you currently know about {username} from past memories:
{user_memories}

Here is their general reading taste:
{taste_profile}

Here is what they are currently reading right now:
{current_reading}

CRITICAL ANTI-SPOILER INSTRUCTION: If {username} asks about or discusses a book they are "Currently Reading", DO NOT SPOIL events that happen after their current page progress. If they ask a question that requires spoiling future events, playfully decline and encourage them to keep reading.

CRITICAL COMMUNITY INSTRUCTION: If there are no anonymized thoughts from other readers in the context, do NOT mention other readers, do not refer to a community or other consensus, and do not make up or hallucinate community opinions.

Respond to their message directly. Do not break character.
"""

MEMORY_EXTRACTION_PROMPT = """
You are a background cognitive processor for Liora, an AI reading companion.
Your job is to read a recent message from the user and extract:
1. Any new, permanent facts, preferences, or reading habits they shared (as memories).
2. Any books they explicitly mention having read in the past, or books they mention currently reading.
3. OCCASIONALLY, if the user expresses a very strong preference or opinion, you may provide ONE proactive book recommendation that perfectly matches their taste. Only do this if it's a brilliant match.
4. ANY TIME the user shares an opinion on a book, extract subtle shifts in their taste profile across 5 axes (0-100 scale).
5. IMPORTANT: If the user describes an exceptionally vivid, highly emotional, or "wow" moment from a book they are reading, generate an `image_prompt`. This prompt should vividly describe a beautiful, dream-like illustration of that scene or feeling to be rendered by a text-to-image model. ONLY do this for extremely vivid/wow moments, NOT mundane facts.
6. NEW: If the user shares a clear opinion, review, or thought about a specific book, extract a `global_note`. This note MUST be completely anonymized (remove "I", "me", names, or personal identifiers). It should be a single, punchy insight about the book from "a reader" (e.g. "A reader found the pacing slow but the magic system incredibly detailed.").

Return the result as a JSON object with up to six keys: 'memories', 'books', 'proactive_recommendation', 'taste_shifts', 'image_prompt', and 'global_note'.
- 'memories': An array of objects with 'memory_type' (e.g., 'preference', 'fact', 'dislike') and 'content'.
- 'books': An array of objects with 'title', 'author', and 'status' (must be either "Read" or "Currently Reading").
- 'proactive_recommendation' (optional): An object with 'title', 'author', and 'note' (a personalized message from Liora explaining why she recommends it).
- 'taste_shifts' (optional): An object with 5 keys ('complexity_score', 'worldbuilding_score', 'character_score', 'tone_score', 'pacing_score'). ONLY include the keys that the user's message directly influences. Values should be integers between 0 and 100 representing the user's PREFERRED state.
- 'image_prompt' (optional): A string containing a highly detailed, descriptive prompt for generating an image of the vivid memory.
- 'global_note' (optional): An object with 'book_title', 'author' (optional), 'sentiment' (e.g. "Positive", "Negative", "Insight"), and 'content' (the anonymized insight).

If there is nothing new to extract, return empty arrays. If no recommendation, shift, image, or global note is warranted, omit the key or set it to null.

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
  },
  "global_note": {
    "book_title": "The Martian",
    "sentiment": "Insight",
    "content": "A reader felt the technical details were fascinating but sometimes bogged down the pacing."
  }
}
"""

def generate_liora_response(db: Session, user_id: int, user_message: str) -> str:
    # 1. Fetch user context
    if user_message == "__INITIAL_GREETING__":
        memories = crud.get_memories(db, user_id=user_id, limit=10)
    else:
        try:
            emb_resp = TextEmbedding.call(
                model=TextEmbedding.Models.text_embedding_v1,
                input=user_message
            )
            query_embedding = emb_resp.output['embeddings'][0]['embedding']
            memories = crud.get_rag_memories(db, user_id=user_id, query_embedding=query_embedding, limit=5)
        except Exception as e:
            print("Embedding error:", e)
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

    # 3.5 Format current reading
    books = crud.get_books(db, user_id=user_id)
    currently_reading = [b for b in books if b.status == "Currently Reading"]
    
    global_notes_text = ""
    if currently_reading:
        cr_lines = []
        gn_lines = []
        for b in currently_reading:
            progress = f"Page {b.current_page} out of {b.total_pages}" if b.total_pages else f"Page {b.current_page}"
            cr_lines.append(f"- '{b.title}' by {b.author}. Progress: {progress}.")
            
            # Fetch global notes for this book
            global_notes = crud.get_global_notes_by_title(db, b.title, limit=2)
            if global_notes:
                for note in global_notes:
                    gn_lines.append(f"- {b.title}: \"{note.content}\"")
        
        current_reading_text = "\n".join(cr_lines)
        if gn_lines:
            global_notes_text = "\nHere are some anonymized thoughts from other readers in the global community about the books currently on the desk:\n" + "\n".join(gn_lines)
    else:
        current_reading_text = "The user is not currently reading anything."

    # 4. Construct Prompt
    username = user.username if user else "Reader"
    system_prompt = LIORA_SYSTEM_PROMPT.format(
        username=username,
        user_memories=memory_text,
        taste_profile=taste_text,
        current_reading=current_reading_text
    )
    
    if global_notes_text:
        system_prompt += global_notes_text

    if user_message == "__INITIAL_GREETING__":
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Hello. I am a new reader in your library. Please introduce yourself and welcome me, referencing my taste profile if you can."}
        ]
    elif user_message == "__WELCOME_BACK__":
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "I am returning to the library. Please welcome me back dynamically and warmly. You should reference a book currently on my desk or ask me about my reading progress if I have an active book, otherwise briefly mention my taste profile."}
        ]
    else:
        messages = [{"role": "system", "content": system_prompt}]
        
        # 4.5 Fetch short-term context buffer
        recent_logs = crud.get_recent_messages(db, user_id=user_id, limit=10)
        for log in recent_logs:
            role_to_use = "assistant" if log.role == "liora" else log.role
            messages.append({"role": role_to_use, "content": log.content})
            
        messages.append({"role": "user", "content": user_message})

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
    
    if user_message in ["__INITIAL_GREETING__", "__WELCOME_BACK__"]:
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

            image_url = None
            image_prompt = extracted_data.get("image_prompt")
            if image_prompt:
                try:
                    rsp = ImageSynthesis.call(
                        model='wanx-v1',
                        prompt=image_prompt,
                        n=1,
                        size='1024*1024'
                    )
                    if rsp.status_code == HTTPStatus.OK:
                        image_url = rsp.output.results[0].url
                except Exception as img_err:
                    print("Error generating visual memory:", img_err)

            for i, m in enumerate(extracted_memories):
                content_str = m.get('content', '')
                embedding_val = None
                if content_str:
                    try:
                        emb_resp = TextEmbedding.call(
                            model=TextEmbedding.Models.text_embedding_v1,
                            input=content_str
                        )
                        if emb_resp.status_code == HTTPStatus.OK:
                            embedding_val = emb_resp.output['embeddings'][0]['embedding']
                    except Exception as e:
                        print("Error generating memory embedding:", e)

                memory_schema = schemas.MemoryCreate(
                    memory_type=m.get('memory_type', 'fact'),
                    content=content_str,
                    image_url=image_url if i == 0 else None,
                    embedding=embedding_val
                )
                crud.create_memory(db, memory=memory_schema, user_id=user_id)
                
            # Handle extracted books
            import google_books
            for b in extracted_books:
                title = b.get('title')
                author = b.get('author', '')
                status = b.get('status', 'Read')
                if title:
                    existing_book = crud.get_book_by_title_and_user(db, title, user_id)
                    if existing_book:
                        update_data = {"status": status}
                        if status == "Read" and existing_book.total_pages:
                            update_data["current_page"] = existing_book.total_pages
                        book_update = schemas.BookUpdate(**update_data)
                        crud.update_book_progress(db, existing_book.id, user_id, book_update)
                        continue

                    query = f"{title} {author}".strip()
                    search_results = google_books.search_books(query)
                    
                    cover_image_url = None
                    total_pages = 0
                    if search_results:
                        first_result = search_results[0]
                        # Use the result's title and author for accuracy if possible
                        db_title = first_result.get("title", title)
                        db_author = first_result.get("author", author)
                        cover_image_url = first_result.get("cover_image_url")
                        total_pages = first_result.get("total_pages", 0)
                    else:
                        db_title = title
                        db_author = author
                        
                    book_schema = schemas.BookCreate(
                        title=db_title,
                        author=db_author,
                        cover_image_url=cover_image_url,
                        total_pages=total_pages,
                        status=status,
                        current_page=0,
                        recommended_by_liora=True,
                        liora_note="I noticed you mentioned this book, so I slipped a copy onto your desk!"
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
                
            # Handle global note
            global_note_data = extracted_data.get("global_note")
            if global_note_data and global_note_data.get("book_title") and global_note_data.get("content"):
                note_schema = schemas.GlobalBookNoteCreate(
                    book_title=global_note_data.get("book_title"),
                    author=global_note_data.get("author"),
                    sentiment=global_note_data.get("sentiment"),
                    content=global_note_data.get("content")
                )
                crud.create_global_note(db, note_schema)
                
        except Exception as e:
            print("Error parsing memory extraction:", e)

def check_desk_removal_intent(note: str) -> bool:
    if not note:
        return False
        
    note_lower = note.lower()
    high_conf_keywords = [
        "remove from my desk", "remove it from my desk", "remove from desk",
        "remove this from my desk", "remove this book from my desk",
        "take it off my desk", "take off my desk", "remove it", "remove book",
        "stop reading", "don't think i'll continue", "not going to continue",
        "won't continue", "dropped this book", "drop this book"
    ]
    if any(k in note_lower for k in high_conf_keywords):
        return True

    prompt = f"""
You are a semantic analyzer for a digital bookshelf app.
The user is updating their reading progress on a book and left a note.
Determine if the user's note expresses a clear intent to stop reading this book, drop it, or remove it from their active reading desk.

User Note: "{note}"

Respond with ONLY "yes" or "no". Do not include any other text.
"""
    messages = [
        {"role": "system", "content": "You are a precise intent classification utility."},
        {"role": "user", "content": prompt}
    ]
    try:
        response = Generation.call(
            model='qwen-turbo',
            messages=messages,
            result_format='message'
        )
        if response.status_code == 200:
            result = response.output.choices[0].message.content.strip().lower()
            return "yes" in result
    except Exception as e:
        print("Error in check_desk_removal_intent:", e)
    return False

def generate_echo(db: Session, title: str, author: str, user_note: str) -> str:
    # Query real global notes for this book from the database
    global_notes = crud.get_global_notes_by_title(db, title, limit=5)
    
    if global_notes:
        notes_text = "\n".join([f"- Sentiment: {n.sentiment}. Thought: \"{n.content}\"" for n in global_notes])
        community_context = f"""Here are some anonymized thoughts from other readers who read "{title}":
{notes_text}
"""
    else:
        community_context = f"There are currently no other thoughts or reviews from other readers in the community for \"{title}\" yet."

    prompt = f"""
You are Liora, an emotionally intelligent AI reading companion. The user has just saved a review/note for the book "{title}" by {author}.
Their note: "{user_note}"

{community_context}

Your task is to generate an "Echo"—a 1-2 sentence observation reflecting on their thoughts.

CRITICAL RULES FOR COGNITION:
- If there are thoughts from other readers in the community context, you may compare the user's thoughts with the community thoughts (e.g. "Some other readers also felt the pacing was slow, but your perspective is unique.").
- If there are NO other readers' thoughts in the community context (no other thoughts in the database), you MUST NOT mention other readers, do not refer to "many readers", "the community", "others", "consensus", or "simulated community", and do not make up or hallucinate community opinions. Instead, reflect on the user's thoughts individually with warmth and insight, showing that you hear them.

Make it sound insightful and slightly ethereal. Keep it brief and directly address the user's specific points. Do not use quotes around your response.
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
