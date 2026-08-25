import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getSubject } from '../services/api';

function SubjectDetails() {
	const { id } = useParams();
	const [subject, setSubject] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		async function loadSubject() {
			try {
				const response = await getSubject(id);
				setSubject(response.subject);
			} catch (requestError) {
				setError('Unable to load subject.');
			} finally {
				setLoading(false);
			}
		}
		loadSubject();
	}, [id]);

	if (loading) return <div className="page-container"><p className="text-muted">Loading subject...</p></div>;
	if (error) return <div className="page-container"><div className="alert alert-danger">{error}</div><Link to="/subjects">Back to subjects</Link></div>;

	return (
		<div className="page-container">
			<Link to="/subjects" className="back-link"><i className="bi bi-arrow-left" /> All subjects</Link>
			<section className="panel mt-4">
				<h1>{subject.name}</h1>
				<p className="lead-copy">{subject.description || 'No description'}</p>
				<p className="mt-4">Code: {subject.code || 'Not provided'}</p>
				<p>Semester: {subject.semester}</p>
				<p>Exam date: {subject.examDate ? subject.examDate.slice(0, 10) : 'Not provided'}</p>
			</section>
		</div>
	);
}

export default SubjectDetails;
