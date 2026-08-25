# StudentDrive

StudentDrive is an academic resource and learning intelligence platform. The current phase establishes its React, Express, and MySQL foundation.

## The problem it solves

Students often have resources spread across WhatsApp, Google Classroom, email, local folders, and cloud drives. StudentDrive connects those resources to syllabus topics so students can see what they have covered, find knowledge gaps, and decide what to revise next.

## Features

- Dashboard with subject coverage, exam readiness, and revision priority
- Subject workspace and subject detail view
- Academic resource library with search, filters, folders, and resource actions
- Syllabus units and topic-level status
- AI Study Assistant UI prepared for a future REST API
- Knowledge-gap and learning-status analytics
- Mock concept quiz with submission state
- Responsive Bootstrap layout for desktop, tablet, and mobile

## Technology

- Frontend: React, Vite, React Router, Bootstrap, Bootstrap Icons
- Backend: Node.js, Express, mysql2, CORS
- Database: MySQL
- Future: authentication, document parsing, and LLM/RAG integration

## Project structure

```text
StudentDrive/
├── frontend/
│   └── src/
│       ├── components/   Shared layout and display components
│       ├── data/         Mock academic data
│       ├── pages/        Route-level screens
│       └── services/     API-shaped placeholder functions
├── backend/              Express server, routes, controllers, models, and middleware
├── database/schema.sql   Normalized MySQL schema
├── data/                 Development datasets, kept outside app logic
└── README.md
```

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

## Run the backend

In another terminal:

```bash
cd backend
npm install
npm run dev
```

Before starting it, copy the values in `backend/.env.example` to `backend/.env` and set the local MySQL password. Create the schema with:

```bash
mysql -u root -p < database/schema.sql
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health` for:

```json
{
  "success": true,
  "message": "StudentDrive API is running",
  "database": "connected"
}
```

## Foundation architecture

```text
React
  ↓
REST API
  ↓
Express
  ↓
mysql2 connection pool
  ↓
MySQL
```

The backend starts only after a `SELECT 1` connection test succeeds. The health endpoint repeats that test. Route modules are present for auth, subjects, resources, folders, tags, and syllabus, but their feature handlers intentionally return `501 Not Implemented` until the next phase.

The schema contains `users`, `subjects`, `folders`, `resources`, `tags`, `resource_tags`, and `syllabus_topics`. Foreign keys keep ownership relationships clear, while `resource_tags` models the resource/tag many-to-many relationship. Passwords are represented only by `password_hash`; files are represented by metadata and `file_path`, never stored as database blobs.

## Where to change things

- Add or change sample content in `frontend/src/data/mockData.js`.
- Add future fetch calls in `frontend/src/services/api.js`, not inside page components.
- Add Express routes, controllers, models, and services under the matching `backend/` folders.

## Connection test in the frontend

The dashboard includes a small development status section that calls `GET /api/health` through `frontend/src/services/api.js`. It reports whether the backend and database are connected. The existing academic UI and mock feature service remain unchanged.

## Future work

The next backend phase can add authentication, file uploads, document text extraction, and syllabus-topic mapping. The AI assistant can then use retrieval-augmented generation (RAG) to answer questions from a student's uploaded resources. Analytics can combine resource mapping, quiz outcomes, and revision history to calculate coverage and exam readiness.
