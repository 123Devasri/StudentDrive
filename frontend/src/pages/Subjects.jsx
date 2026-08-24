import { useState } from 'react';
import SubjectCard from '../components/SubjectCard';
import { subjects } from '../data/mockData';
function Subjects() { const [showForm, setShowForm] = useState(false); return <div className="page-container"><div className="page-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Subjects</h1><p className="lead-copy">See how prepared you are for every subject.</p></div><button className="primary-button" onClick={() => setShowForm(!showForm)}><i className="bi bi-plus-lg" /> Add subject</button></div>{showForm && <form className="inline-form" onSubmit={(event) => event.preventDefault()}><input placeholder="Subject name" aria-label="Subject name" /><input type="date" aria-label="Exam date" /><button className="primary-button">Create subject</button></form>}<div className="subject-grid subject-grid-wide">{subjects.map((subject) => <SubjectCard key={subject.id} subject={subject} />)}</div></div>; }
export default Subjects;
