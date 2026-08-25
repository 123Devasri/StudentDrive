import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../services/api';
import ConnectionStatus from '../components/ConnectionStatus';

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    async function loadDashboard() {
        setLoading(true);
        try {
            const response = await getDashboard();
            setDashboard(response.dashboard);
        } catch (requestError) {
            setError('Unable to load dashboard.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadDashboard();
    }, []);

    if (loading) return <main className="page-container"><p className="text-muted">Loading dashboard...</p></main>;
    if (error) return <main className="page-container"><div className="alert alert-danger">{error}</div><button className="primary-button" onClick={loadDashboard}>Retry</button></main>;

    return (
        <main className="page-container">
            <div className="page-heading"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>Dashboard</h1><p className="lead-copy">A live view of your academic workspace.</p></div></div>
            <div className="metric-grid">
                <div className="metric-card"><span>Total subjects</span><strong>{dashboard.totalSubjects}</strong></div>
                <div className="metric-card"><span>Total resources</span><strong>{dashboard.totalResources}</strong></div>
                <div className="metric-card"><span>Overall coverage</span><strong>{dashboard.coverage}%</strong></div>
                <div className="metric-card"><span>Topics remaining</span><strong>{dashboard.topicsRemaining}</strong></div>
            </div>
            <div className="dashboard-columns">
                <section className="panel"><h2>Subject progress</h2>{dashboard.subjectsProgress.length === 0 && <p>No subjects yet.</p>}{dashboard.subjectsProgress.map((subject) => <div className="unit-progress" key={subject.id}><div className="progress-meta"><strong>{subject.name}</strong><span>{subject.coverage}%</span></div><div className="progress"><div className="progress-bar" style={{ width: `${subject.coverage}%` }} /></div></div>)}</section>
                <section className="panel"><h2>Topics requiring attention</h2>{dashboard.topicsToStudy.length === 0 && <p>No topics need attention.</p>}{dashboard.topicsToStudy.map((topic) => <div className="priority-row" key={topic.id}><div><strong>{topic.topic}</strong><small>{topic.status}</small></div></div>)}</section>
            </div>
            <section className="panel mt-3"><h2>Recent resources</h2>{dashboard.recentResources.length === 0 && <p>No resources uploaded yet.</p>}{dashboard.recentResources.map((resource) => <div className="resource-row" key={resource.id}><div className="resource-name"><strong>{resource.originalName}</strong><span>{resource.subjectName} · {resource.fileType}</span></div><span className="resource-date">{resource.createdAt.slice(0, 10)}</span></div>)}</section>
            <ConnectionStatus />
            <p className="mt-3"><Link to="/subjects">Manage subjects</Link> · <Link to="/resources">Manage resources</Link></p>
        </main>
    );
}

export default Dashboard;
