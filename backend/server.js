import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './config/db.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import resourceRoutes from './routes/resourceRoutes.js';
import folderRoutes from './routes/folderRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import syllabusRoutes from './routes/syllabusRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import assistantRoutes from './routes/assistantRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import { errorMiddleware, notFoundMiddleware } from './middleware/errorMiddleware.js';

const app = express();
const port = Number(process.env.PORT) || 5000;

console.log('LLM API configured:', Boolean(process.env.LLM_API_KEY));

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/syllabus', syllabusRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/quiz', quizRoutes);
app.use(notFoundMiddleware);
app.use(errorMiddleware);

async function startServer() {
  try {
    await pool.query('SELECT 1');
    console.log('MySQL database connection established.');
    app.listen(port, () => console.log(`StudentDrive API running at http://localhost:${port}`));
  } catch (error) {
    console.error('Unable to connect to MySQL database.');
    process.exitCode = 1;
  }
}

startServer();

export default app;
