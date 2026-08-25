import { useEffect, useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import { deleteResource, downloadResource, getResources, getSubjects, updateResource, uploadResource } from '../services/api';

function Resources() {
	const [resources, setResources] = useState([]);
	const [subjects, setSubjects] = useState([]);
	const [loading, setLoading] = useState(true);
	const [showForm, setShowForm] = useState(false);
	const [editingResource, setEditingResource] = useState(null);
	const [file, setFile] = useState(null);
	const [subjectId, setSubjectId] = useState('');
	const [description, setDescription] = useState('');
	const [message, setMessage] = useState({ type: '', text: '' });
	const [saving, setSaving] = useState(false);

	async function loadData() {
		setLoading(true);
		try {
			const [resourceResponse, subjectResponse] = await Promise.all([getResources(), getSubjects()]);
			setResources(resourceResponse.resources);
			setSubjects(subjectResponse.subjects);
		} catch (error) {
			setMessage({ type: 'danger', text: 'Unable to load resources.' });
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => { loadData(); }, []);

	function openUploadForm() {
		setEditingResource(null);
		setFile(null);
		setSubjectId(subjects[0]?.id || '');
		setDescription('');
		setShowForm(true);
	}

	function openEditForm(resource) {
		setEditingResource(resource);
		setSubjectId(resource.subjectId);
		setDescription(resource.description || '');
		setShowForm(true);
	}

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setMessage({ type: '', text: '' });
		try {
			let response;
			if (editingResource) {
				response = await updateResource(editingResource.id, { subjectId, description });
			} else {
				const formData = new FormData();
				formData.append('file', file);
				formData.append('subjectId', subjectId);
				formData.append('description', description);
				response = await uploadResource(formData);
			}
			setResources((previousResources) => editingResource
				? previousResources.map((resource) => resource.id === editingResource.id ? response.resource : resource)
				: [response.resource, ...previousResources]);
			setShowForm(false);
			setMessage({ type: 'success', text: editingResource ? 'Resource updated successfully.' : 'Resource uploaded successfully.' });
		} catch (error) {
			setMessage({ type: 'danger', text: error.message });
		} finally {
			setSaving(false);
		}
	}

	async function handleDelete(resource) {
		if (!window.confirm(`Delete ${resource.originalName}?`)) return;
		try {
			await deleteResource(resource.id);
			setResources((previousResources) => previousResources.filter((item) => item.id !== resource.id));
			setMessage({ type: 'success', text: 'Resource deleted successfully.' });
		} catch (error) {
			setMessage({ type: 'danger', text: error.message });
		}
	}

	async function handleDownload(resource) {
		try { await downloadResource(resource.id, resource.originalName); }
		catch (error) { setMessage({ type: 'danger', text: error.message }); }
	}

	return (
		<div className="page-container">
			<div className="page-heading">
				<div><p className="eyebrow">ACADEMIC LIBRARY</p><h1>Resources</h1><p className="lead-copy">All your study material, connected to what you need to learn.</p></div>
				<button className="primary-button" onClick={openUploadForm}><i className="bi bi-upload" /> Upload resource</button>
			</div>
			{message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
			{showForm && <form className="inline-form" onSubmit={handleSubmit}>
				{!editingResource && <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" required onChange={(event) => setFile(event.target.files[0])} />}
				<select aria-label="Subject" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
				<input aria-label="Description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
				<button className="primary-button" disabled={saving}>{saving ? (editingResource ? 'Saving...' : 'Uploading...') : editingResource ? 'Save changes' : 'Upload'}</button>
				<button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
			</form>}
			{loading && <p className="text-muted">Loading resources...</p>}
			{!loading && resources.length === 0 && <div className="panel"><h2>No resources uploaded yet.</h2><p>Upload your first academic resource.</p></div>}
			{!loading && resources.length > 0 && <section className="panel resource-panel"><div className="resource-list-header"><span>Name</span><span>Uploaded</span><span>Actions</span></div>{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onEdit={openEditForm} onDelete={handleDelete} onDownload={handleDownload} />)}</section>}
		</div>
	);
}

export default Resources;
