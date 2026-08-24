import express from 'express';
import cors from 'cors';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (request, response) => {
  response.json({ success: true, message: 'StudentDrive API is running' });
});

app.listen(port, () => {
  console.log(`StudentDrive API running at http://localhost:${port}`);
});
