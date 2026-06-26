# Marginalia 📜✨
> **The emotionally intelligent AI reading companion that gets to know you.**

[![Alibaba Cloud](https://img.shields.io/badge/Hosted%20On-Alibaba%20Cloud-orange?style=flat-square)](https://www.alibabacloud.com/)
[![Qwen API](https://img.shields.io/badge/Powered%20By-Qwen%20AI-blue?style=flat-square)](https://github.com/QwenLM/Qwen)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

Marginalia is a luxury, multilingual, memory-driven reading companion built for the **Qwen Cloud Global AI Hackathon (MemoryAgent Track)**. 

Unlike generic recommender feeds or stateless chatbots, Marginalia features **Liora**, an emotionally intelligent, warm, and perceptive virtual librarian who actively reads with you, remembers your thoughts, understands your evolving literary tastes, and makes increasingly personalized, contextual recommendations over time.

🔗 **Live Public Demo:** [http://47.84.81.242/](http://47.84.81.242/)

---

## 🏛️ System Architecture

Marginalia's architecture is built for high-performance retrieval and absolute data privacy. It routes traffic through Nginx to Next.js and FastAPI services running securely under PM2, backed by a persistent relational database and Alibaba's DashScope API.

```mermaid
graph TD
    %% Define styles
    classDef client fill:#3a2f1b,stroke:#d4af37,stroke-width:1px,color:#f3efe0;
    classDef server fill:#161314,stroke:#555,stroke-width:1px,color:#e6dfd5;
    classDef database fill:#0c0a0b,stroke:#d4af37,stroke-width:2px,color:#f3efe0;
    classDef ai fill:#22152b,stroke:#a855f7,stroke-width:2px,color:#f3efe0;

    %% Nodes
    Client["Client Web App (Next.js & React)"]:::client
    Nginx["Nginx Reverse Proxy"]:::server
    FastAPI["FastAPI Backend (Python)"]:::server
    DB[("PostgreSQL / Database Storage")]:::database
    DashScope["Alibaba DashScope (Qwen AI Engine)"]:::ai
    Dreamer["Dreamer Engine (Subconscious Consolidation)"]:::server

    %% Connections
    Client <-->|"HTTPS / WSS"| Nginx
    Nginx <-->|"Port 3000 / 8000"| FastAPI
    FastAPI <-->|"SQLAlchemy ORM"| DB
    FastAPI <-->|"JWT Auth & Profile Data"| Client
    FastAPI <-->|"SDK / REST API"| DashScope
    Dreamer -->|"Scheduled Cron (24h) / Trigger"| DB
    Dreamer <-->|"Consolidation Requests"| DashScope
    
    subgraph "Alibaba Cloud ECS Instance (47.84.81.242)"
        Nginx
        FastAPI
        Dreamer
    end
```

---

## 🧠 Core MemoryAgent Innovation

Marginalia goes far beyond standard RAG context stuffing, utilizing a structured, multi-tiered memory space designed to store, compress, and search information over time:

### 1. Multi-Layered Memory Space
* **Profile Memory**: Stable, structured facts about the reader (preferred language, rated genres, favorite tropes, reading goals, and disliked clichés).
* **Episodic Memory**: Discrete, structured reactions to specific books (e.g., "The slow-burn romance in Book X was stunning, but the pacing dragged in chapter 3").
* **Taste Inference Memory**: Dynamically inferred higher-level patterns extracted from cumulative chats (e.g., "Reader prefers emotionally grounded romance over high-drama fantasy").
* **Session Context**: Temporary conversational memory (current request, immediate comparison set, current mood).

### 2. Subconscious Memory "Dreaming" & Consolidation
As a user chats with Liora, their raw episodic memory fragments can grow cluttered, redundant, or contradictory. 
* Once every 24 hours (or manually triggered via `POST /users/me/dream`), a background **Dreamer Agent** (`backend/agents/dreamer.py`) runs.
* It passes fragmented facts to Qwen, instructs it to resolve contradictions (prioritizing newer data), merges redundant insights, and deletes the clutter.
* Crucially, **visual memories** (images generated via Wanx) are protected from deletion.
* The synthesized core insights are re-run through DashScope's `text_embedding_v1` vector space so they remain fully searchable for real-time RAG context injection.

### 3. Anonymized Global Collective Insights
Liora acts as a bridge between readers. When a user chats about a book, Liora's background cognitive parser extracts their review, strips personal pronouns/identifiable tags, and saves an anonymous third-person summary (e.g., *"A reader felt the prose was whimsical but the ending was abrupt"*).
When another user adds that book to their desk, Liora queries this anonymous database and weaving community context naturally into the conversation: 
> *"Another reader in the archive mentioned they loved the whimsical atmosphere but felt the romance lacked momentum. I'm so curious to hear what you think as you read further..."*

### 4. Interactive Chat History Archives
* **Logical Session Grouping**: Chats are saved as a flat chronological stream. The frontend groups them dynamically into discrete "sessions" based on a **30-minute quiet gap**.
* **Keyword Search & Glowing Highlights**: A slide-over glassmorphic history drawer supports real-time keyword search, highlighting matches inside the transcript in a glowing gold container.
* **Read-Aloud TTS**: Supports streaming text-to-speech directly from the transcript history to listen to Liora's prior voice responses.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15+ (App Router, Static Route Optimization, React, Tailwind CSS, Playfair Display serif typography, custom glassmorphism styling).
* **Backend**: FastAPI (Python 3.11+, SQLAlchemy ORM, JWT Authentication, fully typed schemas).
* **Database**: PostgreSQL (ApsaraDB RDS locally/remotely) or SQLite for development.
* **Core AI**: Alibaba Cloud DashScope (Qwen Models for chat/dreaming, Wanx for visual memory synthesis, `text_embedding_v1` for vector embeddings).
* **Hosting**: Alibaba Cloud ECS, reverse-proxied with Nginx, process-managed with PM2.

---

## 🚀 Local Installation & Setup

### Prerequisites
* Python 3.11+
* Node.js 18+
* An Alibaba Cloud DashScope API Key

### 1. Clone the Repository
```bash
git clone https://github.com/sorarx27/marginalia.git
cd marginalia
```

### 2. Backend Setup
```bash
cd marginalia-ai/backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt  # FastAPI, SQLAlchemy, psycopg2-binary, python-dotenv, dashscope

# Create configuration environment file (.env)
cat <<EOT >> .env
DASHSCOPE_API_KEY=your_alibaba_dashscope_api_key
DATABASE_URL=sqlite:///./marginalia.db  # Or postgresql://user:password@host/db
SECRET_KEY=your_jwt_signing_secret
EOT

# Run local database migrations
python migrate_db.py

# Start the server
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view Marginalia locally.

---

## ☁️ Alibaba Cloud Production Deployment Details

Marginalia is fully deployed and configured to run continuously on an Alibaba Cloud ECS instance at **47.84.81.242**.

### Reverse Proxy (Nginx) Configuration
Nginx handles incoming requests on Port 80 and routes them as follows:
* `http://47.84.81.242/` $\rightarrow$ Routes to Port `3000` (Next.js Frontend)
* `http://47.84.81.242/api/` $\rightarrow$ Routes to Port `8000` (FastAPI Backend)

### Process Management (PM2)
PM2 ensures the servers restart automatically in case of crashes or system restarts:
```bash
# pm2 status
┌────┬────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┐
│ id │ name                   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │
├────┼────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┤
│ 1  │ marginalia-backend     │ default     │ N/A     │ fork    │ 7485     │ 2h     │ 19   │ online    │
│ 0  │ marginalia-frontend    │ default     │ N/A     │ fork    │ 8674     │ 2h     │ 7    │ online    │
└────┴────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┘
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
