import { useEffect, useState } from 'react';
import { askAssistant, getSubjects } from '../services/api';

function StudyAssistant() {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [question, setQuestion] = useState('');
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [thinking, setThinking] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadSubjects() {
            try {
                const response = await getSubjects();
                setSubjects(response.subjects);
                setSubjectId(response.subjects[0]?.id || '');
            } catch (requestError) {
                setError('Unable to load subjects.');
            } finally {
                setLoading(false);
            }
        }
        loadSubjects();
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();
        if (!question.trim() || !subjectId) return;
        const currentQuestion = question.trim();
        setQuestion('');
        setThinking(true);
        setError('');
        setMessages((previousMessages) => [
            ...previousMessages,
            { role: 'student', text: currentQuestion },
        ]);
        try {
            const response = await askAssistant(currentQuestion, subjectId);
            setMessages((previousMessages) => [
                ...previousMessages,
                {
                    role: 'assistant',
                    text: response.clarification || response.answer,
                    options: response.options || [],
                    sources: response.sources,
                },
            ]);
        } catch (requestError) {
            setError(requestError.message || 'Unable to generate a response.');
        } finally {
            setThinking(false);
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
                        Ask questions using your selected subject and syllabus context.
                    </p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger">
                    {error}
                </div>
            )}

            {loading && (
                <p className="text-muted">
                    Loading subjects...
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
                    <div className="chat-header">
                        <strong>
                            Academic context
                        </strong>
                        <select
                            aria-label="Assistant subject"
                            value={subjectId}
                            onChange={(event) => setSubjectId(event.target.value)}
                        >
                            {subjects.map((subject) => (
                                <option key={subject.id} value={subject.id}>
                                    {subject.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="chat-body">
                        {messages.length === 0 && (
                            <p className="text-muted">
                                Ask a question about this subject.
                            </p>
                        )}
                        {messages.map((message, index) => (
                            <div className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
                                <div>
                                    <span className="message-author">
                                        {message.role === 'student' ? 'You' : 'Study Assistant'}
                                    </span>
                                    <p>
                                        {message.text}
                                    </p>
                                    {message.options?.map((option) => (
                                        <button
                                            className="secondary-button me-2"
                                            key={option}
                                            onClick={() => setQuestion(`Explain ${option}`)}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                    {message.role === 'assistant' && message.sources?.length > 0 && (
                                        <small>
                                            Sources: {message.sources.join(', ')}
                                        </small>
                                    )}
                                </div>
                            </div>
                        ))}
                        {thinking && (
                            <p className="text-muted">
                                Thinking...
                            </p>
                        )}
                    </div>

                    <form className="chat-input" onSubmit={handleSubmit}>
                        <input
                            aria-label="Question"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(event) => setQuestion(event.target.value)}
                            disabled={thinking}
                        />
                        <button
                            className="primary-button"
                            disabled={thinking || !question.trim()}
                        >
                            {thinking ? 'Thinking...' : 'Ask'}
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}

export default StudyAssistant;
