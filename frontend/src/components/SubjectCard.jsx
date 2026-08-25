import { Link } from 'react-router-dom';
function SubjectCard({ subject, onEdit, onDelete }) {
    const shortName = subject.name.slice(0, 2).toUpperCase();

    return (
        <article className="subject-card">
            <div className="d-flex justify-content-between align-items-start">
                <span className="subject-symbol">{shortName}</span>
                <span className="status-dot">Semester {subject.semester}</span>
            </div>
            <h3>{subject.name}</h3>
            <p className="muted">{subject.code || 'No subject code'}</p>
            <p className="muted">{subject.description || 'No description'}</p>
            <div className="card-footer-row">
                <span>
                    <i className="bi bi-calendar3" />
                    {subject.examDate ? subject.examDate.slice(0, 10) : 'No exam date'}
                </span>
                <Link to={`/subjects/${subject.id}`}>
                    Open subject <i className="bi bi-arrow-up-right" />
                </Link>
            </div>
            <div className="card-footer-row">
                <button className="text-button" onClick={() => onEdit(subject)}>Edit</button>
                <button className="text-button" onClick={() => onDelete(subject)}>Delete</button>
            </div>
        </article>
    );
}

export default SubjectCard;
