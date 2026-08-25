import ProgressCard from '../components/ProgressCard';
import { knowledgeGaps } from '../data/mockData';
function Analytics() { 
    return <div className="page-container">
        <div className="page-heading"><div>
            <p className="eyebrow">LEARNING INTELLIGENCE</p>
            <h1>Learning analytics</h1><p className="lead-copy">See the difference between having material and mastering a concept.</p>
            </div>
            <button className="secondary-button"><i className="bi bi-download" /> Export report</button>
            </div><section className="metric-grid">
                <ProgressCard icon="bi-rocket-takeoff" label="Overall exam readiness" value="72%" note="+8% this month" accent="blue" />
                <ProgressCard icon="bi-check2-circle" label="Syllabus coverage" value="78%" note="Across all subjects" accent="green" />
                <ProgressCard icon="bi-arrow-repeat" label="Topics needing revision" value="6" note="Prioritized for you" accent="rose" />
                </section><div className="analytics-grid"><section className="panel"><div className="section-header">
                    <div><h2>Knowledge gaps</h2><p>Topics where available material has not become confidence yet.</p>
                    </div></div>{knowledgeGaps.map((gap) => <div className="gap-row" key={gap.name}>
                        <div className="progress-meta"><strong>{gap.name}</strong><span>{gap.value}% gap</span></div><div className="progress">
                            <div className="progress-bar gap-bar" style={{ width: `${gap.value}%` }} /></div></div>)}</section>
                            <section className="panel"><div className="section-header"><div><h2>Learning status</h2><p>Material alone is not mastery.</p>
                            </div></div>
                            <div className="learning-table"><div className="table-head">
                                <span>Topic</span><span>Material</span><span>Quiz</span><span>Status</span>
                                </div>{[['Graphs', true, false, 'Needs revision'], ['Arrays', true, true, 'Strong'], ['Trees', true, true, 'Strong']].map(([topic, material, quiz, status]) => <div className="table-row" key={topic}><strong>{topic}</strong><span>{material ? '✓' : '✗'}</span><span>{quiz ? '✓' : '✗'}</span><span className={status === 'Strong' ? 'table-good' : 'table-warning'}>{status}</span></div>)}</div>
                                </section></div></div>; }
export default Analytics;
