import { useEffect, useState } from 'react';
import SubjectCard from '../components/SubjectCard';
import { createSubject, deleteSubject, getSubjects, updateSubject } from '../services/api';

const emptyForm = { name: '', code: '', semester: '', examDate: '', description: '' };

function SubjectForm({ form, editing, saving, onChange, onSubmit, onCancel }) {
	return (
		<form className="inline-form" onSubmit={onSubmit}>
			<input name="name" placeholder="Subject name" aria-label="Subject name" required value={form.name} onChange={onChange} />
			<input name="code" placeholder="Code" aria-label="Subject code" value={form.code} onChange={onChange} />
			<input name="semester" type="number" min="1" placeholder="Semester" aria-label="Semester" required value={form.semester} onChange={onChange} />
			<input name="examDate" type="date" aria-label="Exam date" value={form.examDate} onChange={onChange} />
			<input name="description" placeholder="Description" aria-label="Description" value={form.description} onChange={onChange} />
			<button className="primary-button" disabled={saving}>{saving ? 'Saving...' : editing ? 'Save changes' : 'Create subject'}</button>
			{editing && <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>}
		</form>
	);
}

function Subjects() {
	const [subjects, setSubjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [form, setForm] = useState(emptyForm);
	const [saving, setSaving] = useState(false);

	async function loadSubjects() {
		setLoading(true);
		setError('');
		try {
			const response = await getSubjects();
			setSubjects(response.subjects);
		} catch (requestError) {
			setError('Unable to load subjects.');
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { loadSubjects(); }, []);

	function handleChange(event) {
		setForm({ ...form, [event.target.name]: event.target.value });
	}

	function startCreate() {
		setForm(emptyForm);
		setEditingId(null);
		setShowForm(true);
		setSuccess('');
	}

	function startEdit(subject) {
		setForm({ ...subject, examDate: subject.examDate ? subject.examDate.slice(0, 10) : '' });
		setEditingId(subject.id);
		setShowForm(true);
		setSuccess('');
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setError('');
		try {
			const response = editingId ? await updateSubject(editingId, form) : await createSubject(form);
			setSubjects((previousSubjects) => editingId
				? previousSubjects.map((subject) => subject.id === editingId ? response.subject : subject)
				: [response.subject, ...previousSubjects]);
			setForm(emptyForm);
			setEditingId(null);
			setShowForm(false);
			setSuccess(editingId ? 'Subject updated successfully.' : 'Subject created successfully.');
		} catch (requestError) {
			setError(requestError.message);
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(subject) {
		if (!window.confirm(`Delete ${subject.name}?`)) return;
		try {
			await deleteSubject(subject.id);
			setSubjects((previousSubjects) => previousSubjects.filter((item) => item.id !== subject.id));
			setSuccess('Subject deleted successfully.');
		} catch (requestError) {
			setError(requestError.message);
		}
	}

	return (
		<div className="page-container">
			<div className="page-heading">
				<div>
					<p className="eyebrow">YOUR WORKSPACE</p>
					<h1>Subjects</h1>
					<p className="lead-copy">See how prepared you are for every subject.</p>
				</div>
				<button className="primary-button" onClick={startCreate}>
					<i className="bi bi-plus-lg" />
					Add subject
				</button>
			</div>
			{error && <div className="alert alert-danger">{error}</div>}
			{success && <div className="alert alert-success">{success}</div>}
			{showForm && (
				<SubjectForm
					form={form}
					editing={Boolean(editingId)}
					saving={saving}
					onChange={handleChange}
					onSubmit={handleSubmit}
					onCancel={() => setShowForm(false)}
				/>
			)}
			{loading && <p className="text-muted">Loading subjects...</p>}
			{!loading && !error && subjects.length === 0 && <div className="panel"><h2>No subjects yet.</h2><p>Create your first subject to get started.</p></div>}
			{!loading && subjects.length > 0 && (
				<div className="subject-grid subject-grid-wide">
					{subjects.map((subject) => (
						<SubjectCard
							key={subject.id}
							subject={subject}
							onEdit={startEdit}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}
		</div>
	);
}

export default Subjects;
