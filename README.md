# StudentDrive

StudentDrive is an academic resource and learning intelligence platform. It brings study material, syllabus coverage, revision priorities, quizzes, analytics, and an AI study assistant into one focused workspace.

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
- Backend: Node.js, Express, CORS
- Future: MongoDB, document parsing, LLM/RAG integration

## Project structure

```text
StudentDrive/
├── frontend/
│   └── src/
│       ├── components/   Shared layout and display components
│       ├── data/         Mock academic data
│       ├── pages/        Route-level screens
│       └── services/     API-shaped placeholder functions
├── backend/              Express server and future API modules
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
npm start
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health` for:

```json
{
  "success": true,
  "message": "StudentDrive API is running"
}
```

## Where to change things

- Add or change sample content in `frontend/src/data/mockData.js`.
- Add future fetch calls in `frontend/src/services/api.js`, not inside page components.
- Add Express routes, controllers, models, and services under the matching `backend/` folders.

## Future work

The next backend phase can add authentication, MongoDB persistence, file uploads, document text extraction, and syllabus-topic mapping. The AI assistant can then use retrieval-augmented generation (RAG) to answer questions from a student's uploaded resources. Analytics can combine resource mapping, quiz outcomes, and revision history to calculate coverage and exam readiness.
