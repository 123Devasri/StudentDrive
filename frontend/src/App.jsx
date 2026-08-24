import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Subjects from './pages/Subjects';
import SubjectDetails from './pages/SubjectDetails';
import Resources from './pages/Resources';
import Syllabus from './pages/Syllabus';
import StudyAssistant from './pages/StudyAssistant';
import Analytics from './pages/Analytics';
import Quiz from './pages/Quiz';
import Settings from './pages/Settings';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/subjects/:id" element={<SubjectDetails />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/syllabus" element={<Syllabus />} />
        <Route path="/assistant" element={<StudyAssistant />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/quiz" element={<Quiz />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
