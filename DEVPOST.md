# Devpost Hackathon Project: Marginalia 📜✨
> **The emotionally intelligent AI reading companion that gets to know you.**

---

## Inspiration

For ten years, I worked as a freelance ghostwriter. Immersed in endless research for others, I found myself completely burned out on reading—books had begun to feel like work. On the other side of our living room was my partner: an avid fantasy reader, a collector of special editions, and someone who possessed a vast literary appetite but constantly struggled with the age-old dilemma of finding his next great read. 

One evening, I decided to pick up one of his books. To my surprise, I was absolutely hooked. That single book reignited a spark in me and bridged the gap between our two worlds. 

Initially, I had planned to build a generic code-generation agent app for the hackathon. But when I looked at my desk, I realized I wanted to build something personal. I wanted to build **Marginalia**: a luxury, immersive reading companion designed to serve both of us. For my partner, it would act as a highly perceptive librarian to help him discover obscure, tailored books; for me, it would provide a warm, emotionally supportive gateway back into the world of literature. 

---

## What it does

Unlike generic stateless recommender feeds or raw chat interfaces, **Marginalia** introduces **Liora**—an emotionally intelligent virtual librarian who sits at a digital desk with you. She reads along with you, understands your evolving literary tastes, synthesizes your reading notes, and provides deeply contextual, spoiler-free recommendations.

Key features include:
1. **The Interactive Desk**: Place books on your digital desk to read with Liora. As you share notes, she keeps track of your page progress, and dynamically updates your reading log.
2. **Multi-Tiered Cognitive Memory**: Liora doesn't just store chat history; she remembers facts about you (Profile Memory), your discrete reactions to specific books (Episodic Memory), and shifts in your preferred narrative styles (Taste Memory).
3. **Subconscious "Dreaming" Consolidation**: Just like a human, Liora consolidates her memories. Every 24 hours (or manually triggered), she enters a subconscious "Dream" state where she compresses chaotic, redundant, or contradictory chat notes into a clean, core memory graph.
4. **Anonymized Global Collective Insights**: Liora acts as a silent bridge between readers. When you discuss a book, she extracts your review, strips out personal details to preserve privacy, and stores it globally. When another reader places that book on their desk, Liora gracefully weaves these community insights into the conversation without spoilers.
5. **Interactive Chat Archives & Search**: An elegant, glassmorphic history drawer that automatically clusters flat chat logs into logical "conversational sessions" based on quiet gaps, offering full-text keyword search with glowing gold highlights.
6. **Luxury Aesthetic & Playback**: Features high-fidelity responsive styling, fluid scroll containment, and premium streaming Text-to-Speech (TTS) playback to listen to Liora's voice responses.

---

## How I built it

I built Marginalia using a modern, performant, and privacy-first tech stack:
* **Frontend**: **Next.js 15+** (App Router) using standard React, vanilla CSS, and a premium custom glassmorphic styling system themed in dark charcoal, cream, and glowing gold accents.
* **Backend**: **FastAPI** (Python 3.11+) implementing strict Pydantic schemas, SQLAlchemy ORM, and JWT authentication.
* **AI & Embedding Models**: Powered entirely by the **Alibaba Cloud DashScope API**:
  * **Qwen-Max / Qwen-Plus**: Drives Liora's highly sophisticated conversational dialogue, intent detection, and RAG reasoning.
  * **Qwen-Turbo / Qwen-Lite**: Powers the background cognitive processor for memory extraction and subconscious dreaming.
  * **text_embedding_v1**: Maps consolidated core memories into high-dimensional vector spaces for precise RAG search.
  * **Wanx (Text-to-Image)**: Generates dream-like, whimsical illustrations whenever a user expresses an exceptionally vivid emotional response to a book.
  * **CosyVoice / DashScope TTS**: Translates Liora's responses into incredibly warm, natural-sounding audio streams for an immersive dialogue experience.
* **Deployment & Hosting**: Hosted on an **Alibaba Cloud ECS instance**, reverse-proxied with **Nginx**, and managed continuously under **PM2** processes.

---

## Challenges I ran into

1. **Memory Decay & Redundancy**: In standard RAG pipelines, endless chat history causes context-stuffing, leading to high latencies and bloated costs. I solved this by developing a custom **"Dreamer" pipeline** in `backend/agents/dreamer.py` to synthesize raw episodic data into unified, higher-level memories.
2. **Unnatural Name Repetition**: During early testing, prompting the model to use the user's name caused Qwen to overcorrect, greeting the user by name at the start of *every single message*. I carefully calibrated the system prompt's cognitive instructions to enforce organic, occasional name-drops instead.
3. **Speech Latency**: Generating high-quality text-to-speech for long sentences introduced noticeable lag. I overcame this by setting strict, hardword-count cost constraints in Liora's system prompt, restricting responses to 2-3 natural sentences (max 50-60 words). This dramatically cut down synthesis times while keeping Liora's responses beautifully intimate and punchy.
4. **CSS Layout Containment**: Ensuring that the extensive conversational archives and memory sidebars stayed bounded strictly within the screen height without overflowing on various screen sizes required carefully wrapping elements with flexible, screen-capped CSS scroll boundaries.

---

## Accomplishments that I'm proud of

* **The Subconscious "Dream" Loop**: Building a mechanism that replicates human sleep patterns. Watching Liora take messy, contradictory chat inputs and compress them into clean, logical, and vector-searchable taste insights feels like magic.
* **Generative Art Protection**: Ensuring that while text memories are compressed and cleaned, Liora never deletes visual memories (illustrations generated via Wanx), preserving the user's emotional "scrapbook."
* **Full Responsive Glassmorphism**: Designing an immersive, tactile visual space that feels like a cozy, high-end private study on both desktop monitors and mobile screens.
* **Cost-Efficient Speed**: Optimizing prompt constraints to deliver rapid AI chats and near-instantaneous TTS voice streams on ECS.

---

## What I learned

* **Immersive Constraints are Strengths**: Restricting the AI's response length did more than save API and TTS credits—it forced Liora to sound much more human, punchy, and conversational. Short, reflective remarks are infinitely more engaging in a companion app than massive walls of text.
* **Separation of Cognitive Concerns**: Running heavy analysis tasks (like memory extraction, opinion anonymization, and dreaming) in background threads keeps the primary chat loop responsive and fast.
* **Memory is Multi-Layered**: True relationship-building requires separating static facts (Profile), immediate events (Episodic), and slow-moving trend lines (Taste). Structuring my agent's memory this way was crucial to avoiding "memory drift."

---

## What's next for Marginalia

* **Shared Reading Desks**: Expanding Marginalia to support invite-only desks, allowing partners, book clubs, or close friends to read books together and converse with Liora as a collective group.
* **Voice-to-Voice Real-time Streaming**: Migrating from transactional text-to-speech to a fully duplex, low-latency voice-to-voice stream, enabling readers to converse with Liora completely hands-free while reading physical books.
* **Audiobook Integration**: Allowing Liora to overlay on top of open-source audiobook streams, whispering margins, and emotional insights as you listen.
