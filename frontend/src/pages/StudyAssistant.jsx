import { useEffect, useState } from 'react';
import { askAssistantStream, getAssistantHealth, getSubjects } from '../services/api';

const UNITS = [
    { id: '1', name: 'Unit 1' },
    { id: '2', name: 'Unit 2' },
    { id: '3', name: 'Unit 3' },
    { id: '4', name: 'Unit 4' },
    { id: '5', name: 'Unit 5' },
];

function StudyAssistant() {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [unitId, setUnitId] = useState('1');
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState('');
    const [aiHealth, setAiHealth] = useState({ online: false, activeModel: null, modelError: null });

    useEffect(() => {
        async function loadInitialData() {
            try {
                const [subjectsRes, healthRes] = await Promise.all([
                    getSubjects().catch(() => ({ subjects: [] })),
                    getAssistantHealth().catch(() => ({ online: false, modelError: 'AI Assistant health check failed.' })),
                ]);
                setSubjects(subjectsRes.subjects || []);
                setSubjectId(subjectsRes.subjects[0]?.id || '');
                if (healthRes) {
                    setAiHealth({
                        online: healthRes.online,
                        activeModel: healthRes.activeModel,
                        modelError: healthRes.modelError,
                    });
                }
            } catch (requestError) {
                setError('Unable to load initial workspace data.');
            } finally {
                setLoading(false);
            }
        }
        loadInitialData();
    }, []);

    function handleSubjectChange(event) {
        setSubjectId(event.target.value);
        setMessages([]);
        setError('');
    }

    function handleUnitChange(event) {
        setUnitId(event.target.value);
        setMessages([]);
        setError('');
    }

    async function handleSubmit(event) {
        event.preventDefault();
        if (!question.trim() || !subjectId || !unitId || thinking) return;

        const currentQuestion = question.trim();
        setQuestion('');
        setThinking(true);
        setError('');

        const studentMsg = { role: 'student', text: currentQuestion };
        const assistantMsgIndex = messages.length + 1;

        setMessages((prev) => [
            ...prev,
            studentMsg,
            { role: 'assistant', text: '', sources: [], streaming: true },
        ]);

        try {
            await askAssistantStream(currentQuestion, subjectId, unitId, {
                onMetadata: (metadata) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        if (updated[assistantMsgIndex]) {
                            updated[assistantMsgIndex] = {
                                ...updated[assistantMsgIndex],
                                sources: metadata.sources || [],
                            };
                        }
                        return updated;
                    });
                },
                onToken: (token) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        if (updated[assistantMsgIndex]) {
                            updated[assistantMsgIndex] = {
                                ...updated[assistantMsgIndex],
                                text: updated[assistantMsgIndex].text + token,
                            };
                        }
                        return updated;
                    });
                },
                onDone: (donePayload) => {
                    setMessages((prev) => {
                        const updated = [...prev];
                        if (updated[assistantMsgIndex]) {
                            updated[assistantMsgIndex] = {
                                ...updated[assistantMsgIndex],
                                text: donePayload.answer || updated[assistantMsgIndex].text,
                                sources: donePayload.sources || updated[assistantMsgIndex].sources,
                                streaming: false,
                            };
                        }
                        return updated;
                    });
                    setThinking(false);
                },
                onError: (errMsg) => {
                    setError(errMsg || 'Streaming response failed.');
                    setThinking(false);
                    setMessages((prev) => prev.slice(0, assistantMsgIndex));
                },
            });
        } catch (requestError) {
            setError(requestError.message || 'Unable to generate response.');
            setThinking(false);
            setMessages((prev) => prev.slice(0, assistantMsgIndex));
        }
    }

    return (
        <div className="page-container assistant-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        YOUR LEARNING COMPANION
                    </p>
                    <h1>
                        AI Study Assistant
                    </h1>
                    <p className="lead-copy">
                        Ask questions strictly grounded in the notes uploaded for your selected Subject and Unit.
                    </p>
                </div>
            </div>

            {aiHealth.modelError && (
                <div className="alert alert-warning d-flex align-items-center justify-content-between mb-3" role="alert">
                    <div>
                        <i className="bi bi-exclamation-triangle-fill me-2" />
                        <strong>Ollama Model Notice:</strong> {aiHealth.modelError}
                    </div>
                </div>
            )}

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {loading && (
                <p className="text-muted">
                    Loading subjects and checking AI engine health...
                </p>
            )}

            {!loading && subjects.length === 0 && (
                <div className="panel">
                    <h2>
                        No subjects yet.
                    </h2>
                    <p>
                        Create a subject before asking a study question.
                    </p>
                </div>
            )}

            {!loading && subjects.length > 0 && (
                <section className="panel chat-panel">
                    <div className="chat-header d-flex flex-wrap align-items-center justify-content-between gap-3">
                        <div className="d-flex align-items-center gap-3">
                            <strong>
                                Academic Context:
                            </strong>
                            <div className="d-flex align-items-center gap-2">
                                <label className="text-muted small mb-0">Subject:</label>
                                <select
                                    aria-label="Assistant subject"
                                    className="academic-select"
                                    value={subjectId}
                                    onChange={handleSubjectChange}
                                >
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                                <label className="text-muted small mb-0">Unit:</label>
                                <select
                                    aria-label="Assistant unit"
                                    className="academic-select"
                                    value={unitId}
                                    onChange={handleUnitChange}
                                >
                                    {UNITS.map((unit) => (
                                        <option key={unit.id} value={unit.id}>
                                            {unit.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {aiHealth.activeModel && (
                            <span className="badge bg-light text-dark border">
                                <i className="bi bi-cpu me-1 text-success" />
                                Model: {aiHealth.activeModel}
                            </span>
                        )}
                    </div>

                    <div className="chat-body">
                        {!unitId && (
                            <p className="text-muted">
                                Please select a subject and unit before asking a question.
                            </p>
                        )}
                        {unitId && messages.length === 0 && (
                            <p className="text-muted">
                                Ask a question about the notes uploaded for Unit {unitId}.
                            </p>
                        )}
                        {messages.map((message, index) => (
                            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                                <div>
                                    <span className="message-author">
                                        {message.role === 'student' ? 'You' : 'Study Assistant'}
                                    </span>
                                    <p style={{ whiteSpace: 'pre-wrap' }}>
                                        {message.text}
                                        {message.streaming && (
                                            <span className="spinner-grow spinner-grow-sm ms-2 text-success" role="status" title="Generating answer..." />
                                        )}
                                    </p>
                                     {message.role === 'assistant' && message.sources?.length > 0 && (
                                         <div className="sources-list mt-2 text-start">
                                             <small className="text-muted fw-bold display-block">Sources:</small>
                                             <ul className="mb-0 ps-3 small text-muted">
                                                 {message.sources.map((source, srcIdx) => (
                                                     <li key={srcIdx}>
                                                         {source.fileName} — {source.label || (source.slideNumber ? `Slide ${source.slideNumber}` : `Page ${source.pageNumber || 1}`)}
                                                     </li>
                                                 ))}
                                             </ul>
                                         </div>
                                     )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <form className="chat-input" onSubmit={handleSubmit}>
                        <input
                            aria-label="Question"
                            placeholder={unitId ? `Ask a question about Unit ${unitId}...` : "Select a unit to ask a question..."}
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            disabled={thinking || !unitId}
                        />
                        <button
                            className="primary-button"
                            disabled={thinking || !question.trim() || !unitId}
                        >
                            {thinking ? 'Generating...' : 'Ask'}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}

export default StudyAssistant;
