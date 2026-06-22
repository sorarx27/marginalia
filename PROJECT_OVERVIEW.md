Marginalia Project Overview
Marginalia is an AI reading companion designed to remember a user's reading life, understand evolving taste, and offer increasingly personalized recommendations over time. The project is positioned for the Qwen Cloud Global AI Hackathon under the MemoryAgent track, which emphasizes persistent, queryable memory across cross-session interactions and improving decisions based on accumulated user context.

The product vision is captured in the tagline: Marginalia — The reading companion that gets to know you. It is intended to feel less like a generic recommender and more like an emotionally intelligent librarian that learns what each reader loves, dislikes, avoids, and wants more of.

Core Concept
Marginalia is a multilingual, memory-driven librarian agent system focused on readers who want more meaningful book discovery than standard recommendation feeds can offer. Instead of only matching genres or popularity trends, the system builds a persistent understanding of a specific user's reading identity: favorite themes, emotional preferences, disliked tropes, reading goals, and the reasons behind prior reactions to books.

The app's first responsibility is recommendation quality. Over time, the platform can expand into a broader reading companion experience that includes reflective reading logs, mood-aware discovery, conversational book guidance, multilingual interaction, and eventually AI-generated story concepts tailored to a user's taste profile.

Hackathon Alignment
Marginalia fits the MemoryAgent track directly because that track calls for agents with persistent memory that autonomously accumulate experience, remember user preferences, and make increasingly accurate decisions across multi-turn and cross-session use.

The project also aligns with the hackathon's infrastructure requirements. Submissions must include a public open-source repository with a visible license, a functional demo, an architecture diagram, project instructions, and proof that the backend runs on Alibaba Cloud.

Product Experience
The user experience should feel conversational and personal. Users should interact with the app as though they are talking to a real reading companion rather than filling out forms for a recommendation engine.

Main Persona
The default assistant persona is Liora, a warm and perceptive librarian who is intelligent, lightly witty, supportive, and human-sounding. The tone should be emotionally aware and literary without drifting too far into fantasy roleplay, so the system remains broadly accessible while still feeling distinct.

Onboarding
Onboarding should be conversational rather than form-heavy. The system should ask about favorite books, genres, moods, disliked tropes, reading habits, language preferences, and the user's appetite for familiar versus adventurous recommendations, while making the interaction feel fun and natural.

Recommendation Style
Recommendations should not be presented as anonymous lists. Each recommendation should include an explanation of why it fits the user's known taste profile, such as tone, pacing, emotional texture, character focus, or thematic overlap with books the user has already enjoyed.

Version 1 Scope
The first full version of Marginalia should be a complete but tightly scoped product focused on the core MemoryAgent promise.

Included in v1
Conversational onboarding led by Liora.

Persistent user reading profile with language, genre, trope, and tone preferences.

Reading history and book memory log with ratings, notes, reactions, and reasons for liking or disliking a book.

Memory-aware recommendation engine that improves across sessions.

Multilingual text interaction, including support for users who prefer to communicate in their home language.

Recommendation feedback loop, allowing users to steer future suggestions with comments such as “more like this,” “less melodramatic,” or “shorter and more comforting.”

Live demo hosted on Alibaba Cloud and open-source code published in the marginalia-ai GitHub repository.

Deferred to later phases
Full voice-first experience.

Multiple fully developed librarian personas.

Long-form multi-agent story generation.

Community/social reading features.

Character marketplace or publishing features.

These ideas remain strong future extensions, but they should not dilute the first release's core promise: persistent personalized reading memory and high-quality recommendations.

Memory System Design
Marginalia should not be described as “just a RAG chatbot.” The stronger architecture is a user-scoped memory system with structured profile memory, episodic reading memory, taste inference memory, and retrieval layers that bring relevant memories into each recommendation request.

Memory Layers
Memory Layer	Purpose	Example Data
Profile memory	Stable user facts and preferences	Name, preferred language, favorite genres, disliked tropes, reading goals 
Episodic memory	Specific user experiences and reactions	“Loved the slow-burn romance in X,” “Stopped Y because it felt too dense” 
Taste inference memory	Higher-level patterns derived over time	“Prefers emotionally grounded romance to melodrama” 
Session memory	Temporary context for the current interaction	Current mood, current request, immediate comparison set 
Retrieval layer	Pulls the most relevant memory into the current prompt	Top preference facts, prior reactions, recent context 
Memory Strategy
The app should use selective long-term retention rather than saving everything forever. Strong MemoryAgent systems rely on durable signals, timely forgetting, memory summarization, and queryable recall rather than raw transcript accumulation.

RAG Role
RAG is still part of the design, but it should sit beneath the product promise rather than define it. Retrieval should be used to surface relevant prior memories for a specific user, while structured profile data and inferred taste patterns provide the durable backbone of personalization.

Recommended Alibaba Cloud Tech Stack
Marginalia can be hosted fully on Alibaba Cloud while remaining self-hostable for open-source users. Alibaba Cloud supports mainstream relational and NoSQL databases, managed identity services, and ECS-based deployment paths suitable for a production-style hackathon app.

Primary Stack
Layer	Recommendation	Reason
Frontend	Next.js	Strong fit for polished conversational UI, SSR support, and fast iteration.
Backend	FastAPI (Python)	Good for memory orchestration, recommendation logic, and agent workflows.
Hosting	Alibaba Cloud ECS	Easiest way to host both frontend and backend with a single demo URL and clear deployment proof.
Main database	ApsaraDB RDS for PostgreSQL	Best fit for users, books, logs, memory records, and relational queries.
Optional cache	Tair / Redis-compatible service	Useful later for session caching and temporary recommendation results.
Auth	Alibaba Cloud IDaaS or Supabase on Alibaba Cloud RDS	IDaaS is Alibaba-native; Supabase offers faster developer experience on PostgreSQL.
AI models	Qwen Cloud APIs	Required by the hackathon and aligned with the project's agent architecture.
Database Recommendation
The best primary database choice is ApsaraDB RDS for PostgreSQL. Alibaba Cloud explicitly supports PostgreSQL as part of its mainstream managed database offerings, and PostgreSQL is well-suited to user profiles, reading histories, memory entries, feedback records, and structured recommendation metadata.

For the first version, PostgreSQL alone should be enough. A separate caching or vector layer can be added later if retrieval depth or performance requires it, but starting with a simpler relational foundation will speed up implementation and reduce operational complexity.

Authentication Recommendation
Alibaba Cloud provides Identity as a Service (IDaaS) for centralized authentication, authorization, MFA, and external identity integration.

There are two strong options for Marginalia:

Alibaba-native path: ECS + ApsaraDB RDS PostgreSQL + IDaaS.

Developer-speed path: ECS + ApsaraDB RDS PostgreSQL + Supabase capabilities layered on PostgreSQL, including authentication and backend services.

For a hackathon-focused build, the second path may provide the best speed-to-value if setup time matters more than pure Alibaba-native identity architecture. For a more enterprise-style architecture story, IDaaS is the cleaner fit.

Hosting Architecture
The simplest deployment for the demo is a fully Alibaba-hosted stack using a single ECS instance, with a reverse proxy routing traffic to the frontend and backend. Alibaba Cloud deployment examples show ECS as a practical target for running Next.js-style applications and related web stacks.

Suggested Deployment Pattern
Nginx on ECS as the public entry point.

Next.js frontend running on an internal app port.

FastAPI backend running on a separate internal app port.

Nginx routes / to the frontend and /api to the backend.

Backend connects to ApsaraDB RDS PostgreSQL.

Backend calls Qwen Cloud APIs for reasoning, memory synthesis, and recommendation generation.

This approach gives the project one public demo URL, makes deployment proof easier to record, and keeps the architecture simple enough for a five-day build while still looking production-ready.

Proposed Data Model
A strong initial schema for Marginalia could include the following core entities:

Entity	Purpose
users	Account information, language, account metadata
reader_profiles	Stable reading preferences, favorite genres, disliked tropes, reading goals
books	Canonical book records and metadata
user_books	User-specific history such as read status, rating, notes, and reactions
memory_entries	Episodic memory records tied to the user
taste_inferences	Higher-level derived patterns about the user's taste
recommendations	Recommendation outputs and why they were shown
recommendation_feedback	User reactions to past recommendations
sessions	Short-term conversational session context
This schema supports both structured preference management and richer memory retrieval. It also leaves room for multilingual support, future voice features, and eventual creative story-generation extensions.

Agent Architecture
Marginalia can be framed as a small multi-agent system, even if the first implementation keeps the orchestration lightweight.

Suggested Agents
Liora (Head Librarian): main conversational surface for the user.

Memory Keeper: extracts stable long-term signals from conversations and book feedback.

Recommendation Curator: selects and explains the best next reads using profile + memory context.

Story Weaver: optional later-stage agent for personalized story prompts or short fiction concepts tailored to the user's known taste.

This agent structure gives the project a clear architecture diagram and helps distinguish conversational behavior, memory management, and recommendation reasoning.

Open-Source Release Plan
The public repository should be named marginalia-ai and must include enough source code, assets, and instructions for the project to be functional, along with a visible open-source license as required by the hackathon.

Suggested Repository Structure
README.md — project overview, features, quick start, screenshots, demo link.

LICENSE — visible open-source license file.

docs/architecture.md — system architecture and data flow.

docs/deploy-alibaba-cloud.md — self-hosting guide for Alibaba Cloud ECS + RDS.

docs/proof-of-deployment.md — links and evidence for Alibaba Cloud deployment proof.

frontend/ — Next.js application.

backend/ — FastAPI application.

infra/ — optional deployment scripts, Nginx config, environment examples.

License Recommendation
A permissive license such as Apache 2.0 is a strong fit for an open-source portfolio project that may later evolve into a product or business. The broader Qwen ecosystem uses Apache 2.0 in public repositories, making it a reasonable choice for alignment and future flexibility.

Demo Narrative
The demo should prove one central point: Marginalia becomes a better reading companion the more it knows you. That is the clearest expression of the MemoryAgent track's value proposition.

A strong demo flow would be:

A user completes conversational onboarding and shares favorite reads.

Marginalia recommends books with personal reasoning rather than generic similarity.

The user provides feedback such as “too dramatic” or “more emotionally grounded.”

On a later session, the app remembers those preferences and improves its recommendations automatically.

That sequence clearly shows persistent memory, cross-session retrieval, and more accurate personalized decisions over time.

Strategic Strengths
Marginalia has several advantages as a hackathon project and long-term open-source portfolio piece:

It solves a relatable real-world problem rather than a narrow developer-only workflow.

It aligns tightly with the MemoryAgent track's requirements for persistent memory across sessions.

It has clear emotional appeal through books, language, taste, and companionship.

It has strong room for future expansion into voice, multilingual reading support, and custom story generation using multi-agent collaboration.

It is well suited to a public GitHub portfolio because it combines product design, AI memory systems, cloud deployment, and open-source documentation.

Final Definition
Marginalia is an open-source AI librarian built for the Qwen Cloud Global AI Hackathon's MemoryAgent track. It uses persistent, user-specific memory to understand a reader's preferences across sessions, improve book recommendations over time, and create a more human, conversational reading experience than conventional recommendation tools.

Hosted fully on Alibaba Cloud, backed by PostgreSQL, and published through the marginalia-ai repository, the project is designed to be both a compelling live demo and a self-hostable open-source portfolio asset.