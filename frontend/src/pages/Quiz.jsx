import { useEffect, useState } from 'react';
import { generateQuiz, getSubjects } from '../services/api';

const UNITS = [
    { id: '1', name: 'Unit 1' },
    { id: '2', name: 'Unit 2' },
    { id: '3', name: 'Unit 3' },
    { id: '4', name: 'Unit 4' },
    { id: '5', name: 'Unit 5' },
];

const QUESTION_COUNTS = [5, 10, 15];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

function Quiz() {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [unitId, setUnitId] = useState('1');
    const [questionCount, setQuestionCount] = useState(10);
    const [difficulty, setDifficulty] = useState('Medium');

    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    // Quiz Execution State
    const [mode, setMode] = useState('setup'); // 'setup' | 'quiz' | 'results'
    const [quizData, setQuizData] = useState(null); // { subjectName, unitId, questions: [...] }
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState({});

    useEffect(() => {
        async function loadSubjects() {
            try {
                const response = await getSubjects();
                setSubjects(response.subjects || []);
                if (response.subjects?.length > 0) {
                    setSubjectId(response.subjects[0].id);
                }
            } catch (err) {
                setError('Unable to load subjects.');
            } finally {
                setLoadingSubjects(false);
            }
        }
        loadSubjects();
    }, []);

    async function handleGenerateQuiz(e) {
        e.preventDefault();
        if (!subjectId || !unitId || generating) return;

        setGenerating(true);
        setError('');

        try {
            const res = await generateQuiz(subjectId, unitId, questionCount, difficulty);
            if (res.success && res.quiz && res.quiz.questions?.length > 0) {
                setQuizData(res.quiz);
                setSelectedAnswers({});
                setCurrentIndex(0);
                setMode('quiz');
            } else {
                setError(res.message || 'Failed to generate quiz from selected notes.');
            }
        } catch (err) {
            setError(err.message || 'Unable to generate quiz. Make sure notes are uploaded for this unit.');
        } finally {
            setGenerating(false);
        }
    }

    function handleOptionSelect(qIdx, option) {
        setSelectedAnswers((prev) => ({
            ...prev,
            [qIdx]: option,
        }));
    }

    function handleSubmitQuiz() {
        setMode('results');
    }

    function handleTryAgain() {
        setSelectedAnswers({});
        setCurrentIndex(0);
        setMode('quiz');
    }

    function handleGenerateNewQuiz() {
        setQuizData(null);
        setSelectedAnswers({});
        setCurrentIndex(0);
        setMode('setup');
        setError('');
    }

    // Calculate score
    const questions = quizData?.questions || [];
    let correctCount = 0;
    questions.forEach((q, idx) => {
        if (selectedAnswers[idx] === q.correctAnswer) {
            correctCount += 1;
        }
    });
    const totalQuestions = questions.length;
    const scorePercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
        <div className="page-container quiz-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">PRACTICE & ASSESSMENT</p>
                    <h1>AI Quiz Generator</h1>
                    <p className="lead-copy">
                        Generate grounded practice quizzes generated strictly from your uploaded subject and unit notes.
                    </p>
                </div>
            </div>

            {error && (
                <div className="alert alert-danger mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2" />
                    {error}
                </div>
            )}

            {/* SETUP FORM MODE */}
            {mode === 'setup' && (
                <div className="panel shadow-sm border-0 rounded-3 p-4">
                    <h2 className="h5 fw-bold mb-3">Configure Practice Quiz</h2>

                    {loadingSubjects && <p className="text-muted">Loading subjects...</p>}

                    {!loadingSubjects && subjects.length === 0 && (
                        <p className="text-muted mb-0">No subjects created yet. Create a subject and upload notes to get started.</p>
                    )}

                    {!loadingSubjects && subjects.length > 0 && (
                        <form onSubmit={handleGenerateQuiz}>
                            <div className="row g-3 mb-4">
                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-semibold">Subject</label>
                                    <select
                                        className="form-select"
                                        value={subjectId}
                                        onChange={(e) => setSubjectId(e.target.value)}
                                        disabled={generating}
                                    >
                                        {subjects.map((sub) => (
                                            <option key={sub.id} value={sub.id}>
                                                {sub.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-semibold">Unit</label>
                                    <select
                                        className="form-select"
                                        value={unitId}
                                        onChange={(e) => setUnitId(e.target.value)}
                                        disabled={generating}
                                    >
                                        {UNITS.map((u) => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-semibold">Questions</label>
                                    <select
                                        className="form-select"
                                        value={questionCount}
                                        onChange={(e) => setQuestionCount(Number(e.target.value))}
                                        disabled={generating}
                                    >
                                        {QUESTION_COUNTS.map((count) => (
                                            <option key={count} value={count}>
                                                {count} Questions
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="col-md-6 col-lg-3">
                                    <label className="form-label fw-semibold">Difficulty</label>
                                    <select
                                        className="form-select"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                        disabled={generating}
                                    >
                                        {DIFFICULTIES.map((diff) => (
                                            <option key={diff} value={diff}>
                                                {diff}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="primary-button d-flex align-items-center gap-2"
                                disabled={generating || !subjectId || !unitId}
                            >
                                {generating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                                        Generating Quiz from Notes...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-lightning-charge-fill" />
                                        Generate Quiz
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            )}

            {/* QUIZ EXECUTION MODE */}
            {mode === 'quiz' && quizData && (
                <div className="panel shadow-sm border-0 rounded-3 p-4">
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-3 mb-4">
                        <div>
                            <span className="badge bg-primary me-2">{quizData.subjectName}</span>
                            <span className="badge bg-secondary me-2">Unit {quizData.unitId}</span>
                            <span className="badge bg-light text-dark border">Difficulty: {quizData.difficulty}</span>
                        </div>
                        <span className="fw-bold text-muted">
                            Question {currentIndex + 1} of {totalQuestions}
                        </span>
                    </div>

                    <div className="progress mb-4" style={{ height: '8px' }}>
                        <div
                            className="progress-bar bg-success"
                            role="progressbar"
                            style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                        />
                    </div>

                    {questions[currentIndex] && (
                        <div className="question-card mb-4">
                            <h3 className="h5 fw-bold mb-4">{questions[currentIndex].question}</h3>

                            <div className="options-list d-flex flex-column gap-3">
                                {questions[currentIndex].options?.map((opt, oIdx) => {
                                    const isSelected = selectedAnswers[currentIndex] === opt;
                                    return (
                                        <label
                                            key={oIdx}
                                            className={`p-3 rounded border cursor-pointer d-flex align-items-center gap-3 transition-all ${
                                                isSelected ? 'border-primary bg-light fw-semibold' : 'border-light-subtle'
                                            }`}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <input
                                                type="radio"
                                                name={`q-${currentIndex}`}
                                                className="form-check-input mt-0"
                                                checked={isSelected}
                                                onChange={() => handleOptionSelect(currentIndex, opt)}
                                            />
                                            <span>{opt}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="d-flex justify-content-between align-items-center border-top pt-4">
                        <button
                            className="secondary-button"
                            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                            disabled={currentIndex === 0}
                        >
                            <i className="bi bi-chevron-left me-1" /> Previous
                        </button>

                        {currentIndex < totalQuestions - 1 ? (
                            <button
                                className="primary-button"
                                onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                            >
                                Next <i className="bi bi-chevron-right ms-1" />
                            </button>
                        ) : (
                            <button className="btn btn-success fw-bold px-4" onClick={handleSubmitQuiz}>
                                <i className="bi bi-check-circle-fill me-2" /> Submit Quiz
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* RESULTS MODE */}
            {mode === 'results' && quizData && (
                <div className="results-container d-flex flex-column gap-4">
                    {/* Score Summary Banner */}
                    <div className="panel shadow-sm border-0 rounded-3 p-4 text-center">
                        <h2 className="h4 fw-bold mb-2">Quiz Summary</h2>
                        <p className="text-muted mb-4">
                            {quizData.subjectName} — Unit {quizData.unitId} ({quizData.difficulty} Difficulty)
                        </p>

                        <div className="d-flex justify-content-center align-items-center gap-4 my-3">
                            <div className="display-4 fw-bold text-primary">{scorePercentage}%</div>
                            <div className="text-start">
                                <div className="text-success fw-semibold">
                                    <i className="bi bi-check-circle-fill me-1" /> Correct: {correctCount}
                                </div>
                                <div className="text-danger fw-semibold">
                                    <i className="bi bi-x-circle-fill me-1" /> Incorrect: {totalQuestions - correctCount}
                                </div>
                                <small className="text-muted">Total: {totalQuestions} Questions</small>
                            </div>
                        </div>

                        <div className="d-flex justify-content-center gap-3 mt-4">
                            <button className="secondary-button" onClick={handleTryAgain}>
                                <i className="bi bi-arrow-counterclockwise me-1" /> Try Again
                            </button>
                            <button className="primary-button" onClick={handleGenerateNewQuiz}>
                                <i className="bi bi-plus-circle me-1" /> Generate New Quiz
                            </button>
                        </div>
                    </div>

                    {/* Detailed Answer Review */}
                    <div className="panel shadow-sm border-0 rounded-3 p-4">
                        <h3 className="h5 fw-bold mb-4 border-bottom pb-2">
                            <i className="bi bi-card-checklist me-2 text-primary" /> Detailed Answer Review
                        </h3>

                        <div className="d-flex flex-column gap-4">
                            {questions.map((q, idx) => {
                                const userAns = selectedAnswers[idx];
                                const isCorrect = userAns === q.correctAnswer;
                                const src = q.source || {};
                                const sourceLabel = src.slideNumber != null
                                    ? `Slide ${src.slideNumber}`
                                    : `Page ${src.pageNumber || src.page || 1}`;

                                return (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded border ${
                                            isCorrect ? 'border-success-subtle bg-success-subtle' : 'border-danger-subtle bg-danger-subtle'
                                        }`}
                                        style={{ backgroundColor: isCorrect ? '#f0fff4' : '#fff5f5' }}
                                    >
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                            <span className={`badge ${isCorrect ? 'bg-success' : 'bg-danger'}`}>
                                                Question {idx + 1} {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                                            </span>
                                            {src.fileName && (
                                                <small className="text-muted ms-auto fw-semibold">
                                                    <i className="bi bi-file-earmark-text me-1" />
                                                    {src.fileName} — {sourceLabel}
                                                </small>
                                            )}
                                        </div>

                                        <p className="fw-bold mb-2">{q.question}</p>

                                        <div className="mb-2 small">
                                            <div>
                                                <strong>Your Answer:</strong>{' '}
                                                <span className={isCorrect ? 'text-success fw-semibold' : 'text-danger fw-semibold'}>
                                                    {userAns || 'Not Answered'}
                                                </span>
                                            </div>
                                            {!isCorrect && (
                                                <div className="text-success fw-semibold mt-1">
                                                    <strong>Correct Answer:</strong> {q.correctAnswer}
                                                </div>
                                            )}
                                        </div>

                                        {q.explanation && (
                                            <div className="mt-2 pt-2 border-top small text-muted">
                                                <strong>Explanation:</strong> {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Quiz;
