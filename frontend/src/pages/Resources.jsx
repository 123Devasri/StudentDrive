import { useEffect, useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import {
    addTagToResource,
    createFolder,
    createTag,
    deleteFolder,
    deleteResource,
    deleteTag,
    downloadResource,
    getFolders,
    getResources,
    getSubjects,
    getTags,
    removeTagFromResource,
    searchResources,
    updateFolder,
    updateResource,
    uploadResource,
} from '../services/api';

function Resources() {
    const [resources, setResources] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [folders, setFolders] = useState([]);
    const [tags, setTags] = useState([]);
    const [filters, setFilters] = useState({ search: '', subjectId: '', folderId: '', tag: '', fileType: '' });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingResource, setEditingResource] = useState(null);
    const [file, setFile] = useState(null);
    const [subjectId, setSubjectId] = useState('');
    const [folderId, setFolderId] = useState('');
    const [description, setDescription] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [saving, setSaving] = useState(false);

    async function loadResources() {
        setLoading(true);
        try {
            const response = await searchResources(filters);
            setResources(response.resources);
        } catch (error) {
            setMessage({ type: 'danger', text: 'Unable to load resources.' });
        } finally {
            setLoading(false);
        }
    }

    async function loadSupportingData() {
        try {
            const [subjectResponse, folderResponse, tagResponse] = await Promise.all([getSubjects(), getFolders(), getTags()]);
            setSubjects(subjectResponse.subjects);
            setFolders(folderResponse.folders);
            setTags(tagResponse.tags);
        } catch (error) {
            setMessage({ type: 'danger', text: 'Unable to load resource options.' });
        }
    }

    useEffect(() => {
        loadSupportingData();
    }, []);

    useEffect(() => {
        loadResources();
    }, [filters]);

    function openUploadForm() {
        setEditingResource(null);
        setFile(null);
        setSubjectId(subjects[0]?.id || '');
        setFolderId('');
        setDescription('');
        setShowForm(true);
    }

    function openEditForm(resource) {
        setEditingResource(resource);
        setSubjectId(resource.subjectId);
        setFolderId(resource.folderId || '');
        setDescription(resource.description || '');
        setShowForm(true);
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            let response;
            if (editingResource) {
                response = await updateResource(editingResource.id, { subjectId, folderId, description });
            } else {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('subjectId', subjectId);
                formData.append('folderId', folderId);
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

    async function handleCreateFolder() {
        const name = window.prompt('Folder name');
        if (!name) return;
        try {
            const response = await createFolder({ name });
            setFolders((previousFolders) => [...previousFolders, response.folder]);
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleRenameFolder(folder) {
        const name = window.prompt('New folder name', folder.name);
        if (!name) return;
        try {
            const response = await updateFolder(folder.id, { name });
            setFolders((previousFolders) => previousFolders.map((item) => item.id === folder.id ? response.folder : item));
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleDeleteFolder(folder) {
        if (!window.confirm(`Delete ${folder.name}?`)) return;
        try {
            await deleteFolder(folder.id);
            setFolders((previousFolders) => previousFolders.filter((item) => item.id !== folder.id));
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleCreateTag() {
        const name = window.prompt('Tag name');
        if (!name) return;
        try {
            const response = await createTag(name);
            setTags((previousTags) => [...previousTags, response.tag]);
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleDeleteTag(tag) {
        if (!window.confirm(`Delete ${tag.name}?`)) return;
        try {
            await deleteTag(tag.id);
            setTags((previousTags) => previousTags.filter((item) => item.id !== tag.id));
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleAddTag(resource) {
        const tagName = window.prompt(`Enter one of these tag names: ${tags.map((tag) => tag.name).join(', ')}`);
        const selectedTag = tags.find((tag) => tag.name.toLowerCase() === tagName?.trim().toLowerCase());
        if (!selectedTag) {
            setMessage({ type: 'danger', text: 'Select a tag returned by the database.' });
            return;
        }
        try {
            await addTagToResource(resource.id, selectedTag.id);
            await loadResources();
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleRemoveTag(resource, tagId) {
        try {
            await removeTagFromResource(resource.id, tagId);
            await loadResources();
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    async function handleDownload(resource) {
        try {
            await downloadResource(resource.id, resource.originalName);
        } catch (error) {
            setMessage({ type: 'danger', text: error.message });
        }
    }

    return (
        <div className="page-container">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">ACADEMIC LIBRARY</p>
                    <h1>Resources</h1>
                    <p className="lead-copy">All your study material, connected to what you need to learn.</p>
                </div>
                <div className="button-group">
                    <button className="secondary-button" onClick={handleCreateFolder}>New folder</button>
                    <button className="secondary-button" onClick={handleCreateTag}>New tag</button>
                    <button className="primary-button" onClick={openUploadForm}>Upload resource</button>
                </div>
            </div>
            {message.text && <div className={`alert alert-${message.type}`}>{message.text}</div>}
            <div className="resource-toolbar">
                <div className="search-box"><i className="bi bi-search" /><input placeholder="Search resources..." value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} /></div>
                <select aria-label="Subject filter" value={filters.subjectId} onChange={(event) => setFilters({ ...filters, subjectId: event.target.value })}><option value="">All subjects</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
                <select aria-label="Folder filter" value={filters.folderId} onChange={(event) => setFilters({ ...filters, folderId: event.target.value })}><option value="">All folders</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
                <select aria-label="Tag filter" value={filters.tag} onChange={(event) => setFilters({ ...filters, tag: event.target.value })}><option value="">All tags</option>{tags.map((tag) => <option key={tag.id} value={tag.name}>{tag.name}</option>)}</select>
                <select aria-label="File type filter" value={filters.fileType} onChange={(event) => setFilters({ ...filters, fileType: event.target.value })}><option value="">All types</option>{['pdf', 'ppt', 'pptx', 'doc', 'docx'].map((type) => <option key={type} value={type}>{type.toUpperCase()}</option>)}</select>
            </div>
            {folders.length > 0 && <div className="folder-strip">{folders.map((folder) => <div className="folder-tile small" key={folder.id}><button onClick={() => setFilters({ ...filters, folderId: String(folder.id) })}><i className="bi bi-folder" /><strong>{folder.name}</strong></button><button onClick={() => handleRenameFolder(folder)}>Rename</button><button onClick={() => handleDeleteFolder(folder)}>Delete</button></div>)}</div>}
            {tags.length > 0 && <div className="mb-3">{tags.map((tag) => <span className="badge text-bg-light me-2" key={tag.id}>{tag.name} <button onClick={() => handleDeleteTag(tag)}>x</button></span>)}</div>}
            {showForm && <form className="inline-form" onSubmit={handleSubmit}>
                {!editingResource && <input type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" required onChange={(event) => setFile(event.target.files[0])} />}
                <select aria-label="Subject" required value={subjectId} onChange={(event) => setSubjectId(event.target.value)}><option value="">Select subject</option>{subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}</select>
                <select aria-label="Folder" value={folderId} onChange={(event) => setFolderId(event.target.value)}><option value="">No folder</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select>
                <input aria-label="Description" placeholder="Description" value={description} onChange={(event) => setDescription(event.target.value)} />
                <button className="primary-button" disabled={saving}>{saving ? (editingResource ? 'Saving...' : 'Uploading...') : editingResource ? 'Save changes' : 'Upload'}</button>
                <button type="button" className="secondary-button" onClick={() => setShowForm(false)}>Cancel</button>
            </form>}
            {loading && <p className="text-muted">Loading resources...</p>}
            {!loading && resources.length === 0 && <div className="panel"><h2>{Object.values(filters).some(Boolean) ? 'No resources found.' : 'No resources uploaded yet.'}</h2><p>Upload your first academic resource.</p></div>}
            {!loading && resources.length > 0 && <section className="panel resource-panel"><div className="resource-list-header"><span>Name</span><span>Uploaded</span><span>Actions</span></div>{resources.map((resource) => <ResourceCard key={resource.id} resource={resource} onEdit={openEditForm} onDelete={handleDelete} onDownload={handleDownload} onAddTag={handleAddTag} onRemoveTag={handleRemoveTag} />)}</section>}
        </div>
    );
}

export default Resources;
