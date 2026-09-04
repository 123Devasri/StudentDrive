# StudentDrive - Ollama AI Study Assistant & Academic Platform

StudentDrive is an academic resource and learning intelligence platform built with React, Express, MySQL, FAISS, and a NotebookLM-style grounded **Ollama AI Study Assistant** (Retrieval-Augmented Generation pipeline).

## The Problem It Solves

Students often have study materials spread across WhatsApp, Google Classroom, email, local folders, and cloud drives. StudentDrive organizes these resources by subject and unit, connecting them directly to a local, closed-knowledge **Ollama AI Assistant** that answers questions strictly grounded in the student's uploaded notes.

## Features

- **Dashboard**: Subject coverage, exam readiness, and revision priority.
- **Academic Resource Library**: Multi-criteria search, filters, folders, unit assignment, tag chips, and document upload/download.
- **Syllabus Tracking**: Unit-level topic progress tracking (`Not Started`, `In Progress`, `Covered`).
- **NotebookLM-Style Ollama AI Study Assistant**:
  - Answers questions **ONLY** using notes uploaded for the student's selected **Subject** and **Unit**.
  - Documents (PDF, PPTX, DOCX, TXT) are processed, chunked, embedded, and indexed **ONCE** upon upload — no repeated extraction or slow re-reading during question answering.
  - Cross-user, cross-subject, and cross-unit document retrieval is strictly forbidden.
  - If no notes exist or evidence is insufficient, returns `"I couldn't find this information in the notes provided for this unit."` without using general LLM knowledge.
  - Displays file, page, and slide source citations (`Filename.pdf — Page X`, `Presentation.pptx — Slide Y`).
- **Hybrid Retrieval RAG Pipeline**:
  - Document extraction (PDF, PPTX, DOCX, TXT) via Python (`PyMuPDF`, `python-pptx`, `python-docx`).
  - Slide-level (PPTX) and page-level (PDF) chunking with metadata tracking.
  - 384-dimensional vector embeddings via `SentenceTransformer('all-MiniLM-L6-v2')`.
  - **MySQL Chunk Persistence**: Chunks stored in MySQL `document_chunks` table.
  - **FAISS Vector Index**: Fast inner-product vector similarity search via `faiss-cpu`.
  - **Hybrid Search**: Combines FAISS vector similarity and keyword term matching for technical terms (e.g., "Banker's Algorithm", "TCP", "deadlock").
  - **Real-Time SSE Token Streaming**: Token-by-token streaming from Ollama API to the UI.
  - **Automatic Model Resolution & Health Check**: Auto-detects local models via `GET /api/tags` and warns cleanly if `llama3.2` is not installed.
- **Responsive Academic UI**: Clean Bootstrap 5 interface for desktop, tablet, and mobile.

## Technology Stack

- **Frontend**: React 18, Vite, React Router v6, Bootstrap 5, Bootstrap Icons
- **Backend**: Node.js (ES Modules), Express, mysql2 (Connection Pooling), Multer, JWT, bcryptjs
- **Database**: MySQL 8.x (`resources`, `document_chunks`, `subjects`, `folders`, `users`)
- **Local AI Engine**: Python 3.11, FAISS (`faiss-cpu`), SentenceTransformers (`all-MiniLM-L6-v2`), PyMuPDF, python-pptx, python-docx, Ollama Local REST API

## Project Structure

```text
StudentDrive/
├── frontend/             # React SPA with Vite, Bootstrap 5 & API client
│   └── src/
│       ├── components/   # ResourceCard, SubjectCard, Modal, Layout, Navbar, Sidebar
│       ├── pages/        # Dashboard, Resources, Subjects, Syllabus, StudyAssistant, Settings
│       └── services/     # Centralized Fetch API client with SSE streaming support
├── backend/              # Express server, controllers, models, middleware & routes
│   ├── config/           # MySQL connection pool
│   ├── controllers/      # assistantController, resourceController, authController, etc.
│   ├── models/           # Resource, document_chunks, Folder, Subject, User Data Access Layer
│   ├── services/         # aiService (Local RAG search, FAISS integration & Ollama interface)
│   └── uploads/          # Physical file uploads store
├── ai/                   # Standalone Python Local RAG & Vector Embedding Engine
│   ├── chunker.py        # Sliding-window document text chunking (slide/page preserved)
│   ├── document_processor.py # PDF/PPTX/DOCX/TXT text extractors
│   ├── embeddings.py     # SentenceTransformer ('all-MiniLM-L6-v2') vectorizer
│   ├── vector_store.py   # FAISS IndexFlatIP + Hybrid Search engine
│   └── rag_service.py    # CLI entry point for document ingestion and hybrid vector search
├── database/schema.sql   # Relational MySQL DDL script (includes document_chunks)
├── data/                 # Local FAISS vector store persistence directory
└── README.md
```

## Running the Application

### 1. Start Local Ollama AI Server
Ensure **Ollama** is installed and running locally on your machine:
```bash
# Start the local Ollama daemon
ollama serve

# Pull the default LLM model (in a separate terminal)
ollama pull llama3.2
```

### 2. Database Setup
Import the DDL script into your local MySQL server:
```bash
mysql -u root -p < database/schema.sql
```

### 3. Backend Server
```bash
cd backend
npm install
npm run dev
```
Make sure `backend/.env` is configured with your database credentials and Ollama settings:
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=studentdrive
JWT_SECRET=your_jwt_secret
OLLAMA_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2
```

### 4. Frontend Application
```bash
cd frontend
npm install
npm run dev
```
Open the URL shown in terminal (usually `http://localhost:5173`).

## Grounded RAG Architecture Flow

```text
Student Question + Selected Subject + Selected Unit
                  │
                  ▼
         JWT Authentication (userId)
                  │
                  ▼
         Subject & Unit Ownership Check
                  │
                  ▼
         Check Uploaded Notes in MySQL / FAISS
            ├── (No notes) ──► Return: "There are no notes available for this unit yet."
            └── (Notes exist)
                  │
                  ▼
         Hybrid Retrieval (FAISS Vector Search + Keyword Term Match)
         Filter: userId + subjectId + unitId
                  │
                  ▼
         Validate Retrieved Chunks
            ├── (Below Threshold / Empty) ──► Return: "I couldn't find this information in the notes provided for this unit."
            └── (Relevant Chunks Found)
                  │
                  ▼
         NotebookLM Grounded System Prompt Construction
                  │
                  ▼
         Ollama Local HTTP REST API (http://127.0.0.1:11434)
                  │
                  ▼
         Real-Time Token Streaming (SSE) + Slide/Page Citations
```
