import { useEffect, useState } from 'react';
import {
    createSyllabusTopic,
    deleteSyllabusTopic,
    getSubjects,
    getSyllabusProgress,
    getSyllabusTopics,
    updateSyllabusTopic,
} from '../services/api';

const emptyTopic = { unit: '', topic: '', status: 'Not Started' };

function Syllabus() {
    const [subjects, setSubjects] = useState([]);
    const [selectedSubjectId, setSelectedSubjectId] = useState('');
    const [topics, setTopics] = useState([]);
    const [progress, setProgress] = useState(null);
    const [form, setForm] = useState(emptyTopic);
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        async function loadSubjects() {
            try {
                const response = await getSubjects();
                setSubjects(response.subjects);
                setSelectedSubjectId(response.subjects[0]?.id || '');
            } catch (error) {
                setMessage({ type: 'danger', text: 'Unable to load subjects.' });
            } finally {
                setLoading(false);
            }
        }
        loadSubjects();
    }, []);

    useEffect(() => {
        if (!selectedSubjectId) return;
        async function loadSyllabus() {
            setLoading(true);
            try {
                const [topicResponse, progressResponse] = await Promise.all([getSyllabusTopics(selectedSubjectId), getSyllabusProgress(selectedSubjectId)]);
                setTopics(topicResponse.topics);
                setProgress(progressResponse.progress);
            } catch (error) {
                setMessage({ type: 'danger', text: 'Unable to load syllabus.' });
            } finally {
                setLoading(false);
            }
        }
        loadSyllabus();
    }, [selectedSubjectId]);

    function handleChange(event) {
        setForm({ ...form, [event.target.name]: event.target.value });
    }

    function startEdit(topic) {
        setEditingId(topic.id);
        setForm({ unit: topic.unit, topic: topic.topic, status: topic.status });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const response = editingId
                ? await updateSyllabusTopic(editingId, form)
                : await createSyllabusTopic({ ...form, subjectId: selectedSubjectId });
            setTopics((previousTopics) => editingId
                ? previousTopics.map((topic) => topic.id === editingId ? { ...topic, ...response.topic } : topic)
                : [...previousTopics, response.topic]);
            const progressResponse = await getSyllabusProgress(selectedSubjectId);
            setProgress(progressResponse.progress);
            setForm(emptyTopic);
            setEditingId(null);
            setMessage({ type: 'success', text: 'Syllabus topic saved successfully.' });
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(topic) {
        if (!window.confirm(`Delete ${topic.topic}?`)) return;
        try {
            await deleteSyllabusTopic(topic.id);
            setTopics((previousTopics) => previousTopics.filter((item) => item.id !== topic.id));
            const progressResponse = await getSyllabusProgress(selectedSubjectId);
            setProgress(progressResponse.progress);
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleStatusChange(topic, status) {
        try {
            const response = await updateSyllabusTopic(topic.id, { unit: topic.unit, topic: topic.topic, status });
            setTopics((items) => items.map((item) => item.id === topic.id ? { ...item, ...response.topic } : item));
            const progressResponse = await getSyllabusProgress(selectedSubjectId);
            setProgress(progressResponse.progress);
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    const groupedTopics = topics.reduce((groups, topic) => {
        groups[topic.unit] = groups[topic.unit] || [];
        groups[topic.unit].push(topic);
        return groups;
    }, {});

    return (
        <div className="page-container">
            <div className="page-heading">
                <div><p className="eyebrow">STUDY PLAN</p><h1>Syllabus</h1><p className="lead-copy">Track your progress topic by topic.</p></div>
                <select aria-label="Select subject" value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
            </div>
            {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
            {loading && <p className="text-muted">Loading syllabus...</p>}
            {!loading && !selectedSubjectId && <div className="panel"><h2>No subjects yet.</h2><p>Create a subject before adding syllabus topics.</p></div>}
            {!loading && selectedSubjectId && <>
                <section className="panel mb-3">
                    <div className="coverage-pill"><strong>{progress?.coverage || 0}%</strong><span>covered</span></div>
                    <p>Covered: {progress?.coveredTopics || 0} | In Progress: {progress?.inProgressTopics || 0} | Not Started: {progress?.notStartedTopics || 0}</p>
                    <div className="progress mt-3"><div className="progress-bar" style={{ width: `${progress?.coverage || 0}%` }} /></div>
                </section>
                <form className="inline-form" onSubmit={handleSubmit}>
                    <input name="unit" type="number" min="1" placeholder="Unit" required value={form.unit} onChange={handleChange} />
                    <input name="topic" placeholder="Topic" required value={form.topic} onChange={handleChange} />
                    <select name="status" value={form.status} onChange={handleChange}><option>Not Started</option><option>In Progress</option><option>Covered</option></select>
                    <button className="primary-button" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Save topic' : 'Add topic'}</button>
                    {editingId && <button type="button" className="secondary-button" onClick={() => { setEditingId(null); setForm(emptyTopic); }}>Cancel</button>}
                </form>
                {topics.length === 0 && <div className="panel"><h2>No syllabus topics yet.</h2><p>Add the first topic for this subject.</p></div>}
                {Object.entries(groupedTopics).map(([unit, unitTopics]) => <section className="panel syllabus-unit" key={unit}><div className="unit-heading"><h2>Unit {unit}</h2></div>{unitTopics.map((topic) => <div className="topic-row" key={topic.id}><div><strong>{topic.topic}</strong><small>{topic.resources?.length ? `${topic.resources.length} linked resource(s)` : 'No study material linked.'}</small></div><select value={topic.status} onChange={(event) => handleStatusChange(topic, event.target.value)}><option>Not Started</option><option>In Progress</option><option>Covered</option></select><button className="text-button" onClick={() => startEdit(topic)}>Edit</button><button className="text-button" onClick={() => handleDelete(topic)}>Delete</button></div>)}</section>)}
            </>}
        </div>
    );
}

export default Syllabus;
