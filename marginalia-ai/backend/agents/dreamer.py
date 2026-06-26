import json
from sqlalchemy.orm import Session
from dashscope import Generation, TextEmbedding
from http import HTTPStatus
import crud
import schemas

DREAM_PROMPT = """You are Liora's subconscious "Dreaming" process. 
Your task is to review all of the raw, chronological memory fragments she has collected about the user over time, and consolidate them into a clean, unified knowledge graph.

RULES:
1. Synthesize multiple related fragments into single, overarching core insights.
2. Remove any duplicate facts or noise.
3. Resolve contradictions by favoring newer, more recent facts over older ones.
4. Output your consolidated insights as a JSON list of objects, where each object has:
   - "memory_type": a string categorizing the insight (e.g., "taste_preference", "personal_fact", "reading_habit")
   - "content": the refined, descriptive string of the fact.

Return ONLY the raw JSON array. No markdown blocks, no other text."""

def trigger_dream(db: Session, user_id: int):
    # Fetch all memories (up to a reasonable bound for hackathon, e.g. 1000)
    memories = crud.get_memories(db, user_id=user_id, limit=1000)
    if not memories:
        return {"status": "No memories to consolidate."}
        
    # We want to protect visual memories (ones with image_url) from being deleted
    memories_to_delete = [m.id for m in memories if not m.image_url]
    
    # Format memories chronologically for the LLM
    # Reverse them because get_memories returns desc, and we want oldest to newest so the LLM knows what is "recent"
    chronological_memories = list(reversed(memories))
    memory_text = "\n".join([f"[{m.timestamp}] [{m.memory_type}] {m.content}" for m in chronological_memories])
    
    messages = [
        {"role": "system", "content": DREAM_PROMPT},
        {"role": "user", "content": f"RAW MEMORIES:\n{memory_text}"}
    ]
    
    response = Generation.call(
        model='qwen-turbo',
        messages=messages,
        result_format='message'
    )
    
    if response.status_code == 200:
        content = response.output.choices[0].message.content
        
        # Clean up JSON
        try:
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            elif "```" in content:
                content = content.split("```")[1].split("```")[0].strip()
                
            consolidated_memories = json.loads(content)
            
            # Generate embeddings and save new consolidated memories
            for m in consolidated_memories:
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
                        print("Error generating embedding in dream:", e)
                        
                memory_schema = schemas.MemoryCreate(
                    memory_type=m.get('memory_type', 'consolidated_fact'),
                    content=content_str,
                    embedding=embedding_val
                )
                crud.create_memory(db, memory=memory_schema, user_id=user_id)
                
            # Now that new consolidated memories are saved, delete the old messy ones
            # (excluding those with image_url which we protected)
            if memories_to_delete:
                crud.delete_memories(db, memory_ids=memories_to_delete, user_id=user_id)
                
            return {
                "status": "Dreaming complete",
                "old_memories_deleted": len(memories_to_delete),
                "new_insights_created": len(consolidated_memories)
            }
            
        except Exception as e:
            return {"status": "Error parsing LLM JSON output.", "error": str(e)}
    else:
        return {"status": "DashScope LLM call failed.", "error": response.message}
