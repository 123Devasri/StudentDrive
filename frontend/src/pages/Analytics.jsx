import { useEffect, useState } from 'react';
import { getDashboard } from '../services/api';

function Analytics() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboard().then((response) => setDashboard(response.dashboard)).finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="page-container"><p className="text-muted">Loading analytics...</p></div>;
    if (!dashboard) return <div className="page-container"><div className="alert alert-danger">Unable to load analytics.</div></div>;

    return (
        <div className="page-container">
            <div className="page-heading"><div><p className="eyebrow">LEARNING INTELLIGENCE</p><h1>Learning analytics</h1><p className="lead-copy">Live syllabus progress from your academic data.</p></div></div>
            <section className="metric-grid"><div className="metric-card"><span>Syllabus coverage</span><strong>{dashboard.coverage}%</strong></div><div className="metric-card"><span>Covered topics</span><strong>{dashboard.coveredTopics}</strong></div><div className="metric-card"><span>Topics needing attention</span><strong>{dashboard.topicsRemaining}</strong></div></section>
            <section className="panel mt-3"><h2>Subject progress</h2>{dashboard.subjectsProgress.length === 0 && <p>No subjects yet.</p>}{dashboard.subjectsProgress.map((subject) => <div className="unit-progress" key={subject.id}><div className="progress-meta"><strong>{subject.name}</strong><span>{subject.coverage}%</span></div><div className="progress"><div className="progress-bar" style={{ width: `${subject.coverage}%` }} /></div></div>)}</section>
        </div>
    );
}

export default Analytics;
