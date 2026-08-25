function Quiz() {
    return (
        <div className="page-container quiz-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">QUIZZES</p>
                    <h1>Quizzes</h1>
                    <p className="lead-copy">Quiz content will be available when it is connected to your syllabus.</p>
                </div>
            </div>
            <div className="panel">
                <h2>No quizzes available yet.</h2>
                <p>There is no database-backed quiz content to display.</p>
            </div>
        </div>
    );
}

export default Quiz;
