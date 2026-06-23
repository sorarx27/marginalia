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
