import { useEffect, useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import Modal from '../components/Modal';
import {
    addTagToResource,
    createFolder,
    createTag,
    deleteFolder,
    deleteResource,
    deleteTag,
    downloadResource,
    getFolders,
    getSubjects,
    getTags,
    removeTagFromResource,
    searchResources,
    updateFolder,
    updateResource,
    uploadResource,
} from '../services/api';

const emptyResourceForm = {
    subjectId: '',
    folderId: '',
    description: '',
    tagIds: [],
};

function Resources() {
    const [resources, setResources] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [folders, setFolders] = useState([]);
    const [tags, setTags] = useState([]);
    const [filters, setFilters] = useState({
        search: '',
        subjectId: '',
        folderId: '',
        tag: '',
        fileType: '',
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [modal, setModal] = useState(null);
    const [folderForm, setFolderForm] = useState({ name: '', subjectId: '' });
    const [tagName, setTagName] = useState('');
    const [resourceForm, setResourceForm] = useState(emptyResourceForm);
    const [editingResource, setEditingResource] = useState(null);
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);

    async function loadResources() {
        setLoading(true);
        try {
            const response = await searchResources(filters);
            setResources(response.resources || []);
        } catch (error) {
            setMessage({
                type: 'danger',
                text: 'Unable to load resources.',
            });
        } finally {
            setLoading(false);
        }
    }

    async function loadOptions() {
        try {
            const [subjectResponse, folderResponse, tagResponse] = await Promise.all([
                getSubjects(),
                getFolders(),
                getTags(),
            ]);
            setSubjects(subjectResponse.subjects || []);
            setFolders(folderResponse.folders || []);
            setTags(tagResponse.tags || []);
        } catch (error) {
            setMessage({
                type: 'danger',
                text: 'Unable to load options.',
            });
        }
    }

    useEffect(() => {
        loadOptions();
    }, []);

    useEffect(() => {
        loadResources();
    }, [filters]);

    function openFolderModal(folder = null) {
        setFolderForm(
            folder
                ? { name: folder.name, subjectId: folder.subjectId || '' }
                : { name: '', subjectId: '' }
        );
        setModal(
            folder
                ? { type: 'renameFolder', folder }
                : { type: 'folder' }
        );
    }

    function openTagModal() {
        setTagName('');
        setModal({ type: 'tag' });
    }

    function openResourceModal(resource = null) {
        setEditingResource(resource);
        setFile(null);
        setResourceForm(
            resource
                ? {
                      subjectId: resource.subjectId,
                      folderId: resource.folderId || '',
                      description: resource.description || '',
                      tagIds: [],
                  }
                : {
                      ...emptyResourceForm,
                      subjectId: subjects[0]?.id ? String(subjects[0].id) : '',
                  }
        );
        setModal(resource ? { type: 'editResource' } : { type: 'resource' });
    }

    function openTagAssignmentModal(resource) {
        setModal({ type: 'resourceTag', resource });
    }

    async function handleFolderSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            if (modal.type === 'renameFolder') {
                const response = await updateFolder(modal.folder.id, {
                    name: folderForm.name,
                });
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === response.folder.id
                            ? { ...f, ...response.folder, resourceCount: f.resourceCount }
                            : f
                    )
                );
                setMessage({
                    type: 'success',
                    text: `Folder renamed to "${response.folder.name}".`,
                });
            } else {
                const response = await createFolder({
                    name: folderForm.name,
                    subjectId: folderForm.subjectId ? Number(folderForm.subjectId) : null,
                });
                const newFolder = {
                    ...response.folder,
                    resourceCount: 0,
                };
                setFolders((prev) => [...prev, newFolder]);
                setMessage({
                    type: 'success',
                    text: `Folder "${response.folder.name}" created.`,
                });
            }
            setModal(null);
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Folder action failed.',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleTagSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            const response = await createTag(tagName.trim());
            setTags((prev) => [...prev, response.tag]);
            setTagName('');
            setModal(null);
            setMessage({
                type: 'success',
                text: `Tag "${response.tag.name}" created.`,
            });
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Tag creation failed.',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleResourceSubmit(event) {
        event.preventDefault();
        setSaving(true);
        try {
            if (editingResource) {
                const response = await updateResource(editingResource.id, {
                    subjectId: Number(resourceForm.subjectId),
                    folderId: resourceForm.folderId ? Number(resourceForm.folderId) : null,
                    description: resourceForm.description,
                });
                setResources((prev) =>
                    prev.map((res) =>
                        res.id === editingResource.id ? response.resource : res
                    )
                );
                setMessage({
                    type: 'success',
                    text: 'Resource updated successfully.',
                });
            } else {
                if (!file) {
                    setMessage({
                        type: 'danger',
                        text: 'Please select a file to upload.',
                    });
                    setSaving(false);
                    return;
                }
                const formData = new FormData();
                formData.append('file', file);
                formData.append('subjectId', resourceForm.subjectId);
                if (resourceForm.folderId) {
                    formData.append('folderId', resourceForm.folderId);
                }
                formData.append('description', resourceForm.description || '');
                resourceForm.tagIds.forEach((tagId) => {
                    formData.append('tagIds', tagId);
                });

                const response = await uploadResource(formData);
                setResources((prev) => [response.resource, ...prev]);

                // Update folder count if assigned to a folder
                if (response.resource.folderId) {
                    setFolders((prev) =>
                        prev.map((f) =>
                            f.id === Number(response.resource.folderId)
                                ? { ...f, resourceCount: (f.resourceCount || 0) + 1 }
                                : f
                        )
                    );
                }

                setMessage({
                    type: 'success',
                    text: `Resource "${response.resource.originalName}" uploaded successfully.`,
                });
            }
            setModal(null);
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Resource action failed.',
            });
        } finally {
            setSaving(false);
        }
    }

    async function handleDeleteFolder(folder) {
        if (!window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
            return;
        }
        try {
            await deleteFolder(folder.id);
            setFolders((prev) => prev.filter((item) => item.id !== folder.id));
            if (filters.folderId === String(folder.id)) {
                setFilters((prev) => ({ ...prev, folderId: '' }));
            }
            setMessage({
                type: 'success',
                text: `Folder "${folder.name}" deleted.`,
            });
            await loadResources();
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Unable to delete folder.',
            });
        }
    }

    async function handleDeleteTag(tag) {
        if (!window.confirm(`Are you sure you want to delete tag "${tag.name}"?`)) {
            return;
        }
        try {
            await deleteTag(tag.id);
            setTags((prev) => prev.filter((item) => item.id !== tag.id));
            if (filters.tag === tag.name || filters.tag === String(tag.id)) {
                setFilters((prev) => ({ ...prev, tag: '' }));
            }
            setMessage({
                type: 'success',
                text: `Tag "${tag.name}" deleted.`,
            });
            await loadResources();
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Unable to delete tag.',
            });
        }
    }

    async function handleDeleteResource(resource) {
        if (!window.confirm(`Are you sure you want to delete "${resource.originalName}"?`)) {
            return;
        }
        try {
            await deleteResource(resource.id);
            setResources((prev) => prev.filter((item) => item.id !== resource.id));
            if (resource.folderId) {
                setFolders((prev) =>
                    prev.map((f) =>
                        f.id === Number(resource.folderId)
                            ? { ...f, resourceCount: Math.max(0, (f.resourceCount || 1) - 1) }
                            : f
                    )
                );
            }
            setMessage({
                type: 'success',
                text: `Resource "${resource.originalName}" deleted.`,
            });
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Unable to delete resource.',
            });
        }
    }

    async function handleTagAssignment(event) {
        event.preventDefault();
        const selectedTagId = Number(event.target.tagId.value);
        if (!selectedTagId) return;
        try {
            await addTagToResource(modal.resource.id, selectedTagId);
            setModal(null);
            setMessage({
                type: 'success',
                text: 'Tag added to resource.',
            });
            await loadResources();
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Unable to add tag.',
            });
        }
    }

    async function handleRemoveTag(resource, tagId) {
        try {
            await removeTagFromResource(resource.id, tagId);
            setMessage({
                type: 'success',
                text: 'Tag removed from resource.',
            });
            await loadResources();
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Unable to remove tag.',
            });
        }
    }

    async function handleDownload(resource) {
        try {
            await downloadResource(resource.id, resource.originalName);
        } catch (error) {
            setMessage({
                type: 'danger',
                text: error.message || 'Download failed.',
            });
        }
    }

    function handleTagToggleInForm(tagId) {
        setResourceForm((prev) => {
            const exists = prev.tagIds.includes(tagId);
            return {
                ...prev,
                tagIds: exists
                    ? prev.tagIds.filter((id) => id !== tagId)
                    : [...prev.tagIds, tagId],
            };
        });
    }

    function clearAllFilters() {
        setFilters({
            search: '',
            subjectId: '',
            folderId: '',
            tag: '',
            fileType: '',
        });
    }

    const hasActiveFilters = Object.values(filters).some(Boolean);

    const selectedSubjectFolders = folders.filter(
        (folder) =>
            !folder.subjectId ||
            !resourceForm.subjectId ||
            String(folder.subjectId) === String(resourceForm.subjectId)
    );

    return (
        <div className="page-container resources-page">
            <div className="page-heading">
                <div>
                    <p className="eyebrow">
                        ACADEMIC LIBRARY
                    </p>
                    <h1>
                        Resources
                    </h1>
                    <p className="lead-copy">
                        All your study material, connected to what you need to learn.
                    </p>
                </div>

                <div className="button-group">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={() => openFolderModal()}
                    >
                        <i
                            className="bi bi-folder-plus"
                            aria-hidden="true"
                        />
                        New Folder
                    </button>

                    <button
                        type="button"
                        className="secondary-button"
                        onClick={openTagModal}
                    >
                        <i
                            className="bi bi-tag"
                            aria-hidden="true"
                        />
                        New Tag
                    </button>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={() => openResourceModal()}
                    >
                        <i
                            className="bi bi-cloud-arrow-up"
                            aria-hidden="true"
                        />
                        Upload Resource
                    </button>
                </div>
            </div>

            {message.text && (
                <div className={`alert alert-${message.type} d-flex justify-content-between align-items-center`}>
                    <span>{message.text}</span>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close message"
                        onClick={() => setMessage({ type: '', text: '' })}
                    />
                </div>
            )}

            <div className="resource-toolbar">
                <div className="search-box">
                    <i
                        className="bi bi-search"
                        aria-hidden="true"
                    />
                    <input
                        type="text"
                        placeholder="Search resources..."
                        value={filters.search}
                        onChange={(event) =>
                            setFilters({ ...filters, search: event.target.value })
                        }
                    />
                    {filters.search && (
                        <button
                            type="button"
                            className="clear-search-btn"
                            onClick={() => setFilters({ ...filters, search: '' })}
                            title="Clear search"
                        >
                            <i className="bi bi-x" />
                        </button>
                    )}
                </div>

                <div className="filter-selects-group">
                    <select
                        aria-label="Filter by subject"
                        className="academic-select"
                        value={filters.subjectId}
                        onChange={(event) =>
                            setFilters({ ...filters, subjectId: event.target.value })
                        }
                    >
                        <option value="">
                            All Subjects
                        </option>
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                                {subject.name}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by folder"
                        className="academic-select"
                        value={filters.folderId}
                        onChange={(event) =>
                            setFilters({ ...filters, folderId: event.target.value })
                        }
                    >
                        <option value="">
                            All Folders
                        </option>
                        {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                                {folder.name}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by tag"
                        className="academic-select"
                        value={filters.tag}
                        onChange={(event) =>
                            setFilters({ ...filters, tag: event.target.value })
                        }
                    >
                        <option value="">
                            All Tags
                        </option>
                        {tags.map((tag) => (
                            <option key={tag.id} value={tag.name}>
                                {tag.name}
                            </option>
                        ))}
                    </select>

                    <select
                        aria-label="Filter by type"
                        className="academic-select"
                        value={filters.fileType}
                        onChange={(event) =>
                            setFilters({ ...filters, fileType: event.target.value })
                        }
                    >
                        <option value="">
                            All Types
                        </option>
                        <option value="pdf">
                            PDF
                        </option>
                        <option value="pptx">
                            PPTX
                        </option>
                        <option value="ppt">
                            PPT
                        </option>
                        <option value="docx">
                            DOCX
                        </option>
                        <option value="doc">
                            DOC
                        </option>
                    </select>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            className="clear-filters-btn"
                            onClick={clearAllFilters}
                            title="Reset all filters"
                        >
                            <i className="bi bi-x-circle me-1" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            <section className="resource-section folders-section">
                <div className="section-header">
                    <div>
                        <h2>
                            Folders
                        </h2>
                        <p>
                            Organize study material into subject-aligned folders.
                        </p>
                    </div>
                </div>

                {folders.length === 0 ? (
                    <div className="academic-empty-state">
                        <div className="empty-state-icon">
                            <i className="bi bi-folder2" />
                        </div>
                        <h3>
                            No folders yet
                        </h3>
                        <p>
                            Create folders to keep your study materials organized by subject or topic.
                        </p>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => openFolderModal()}
                        >
                            <i className="bi bi-folder-plus me-1" />
                            Create your first folder
                        </button>
                    </div>
                ) : (
                    <div className="folders-grid">
                        {folders.map((folder) => {
                            const isSelected = filters.folderId === String(folder.id);
                            return (
                                <article
                                    className={`academic-folder-card ${isSelected ? 'selected' : ''}`}
                                    key={folder.id}
                                >
                                    <div
                                        className="folder-card-body"
                                        onClick={() =>
                                            setFilters({
                                                ...filters,
                                                folderId: isSelected ? '' : String(folder.id),
                                            })
                                        }
                                        role="button"
                                        tabIndex={0}
                                    >
                                        <div className="folder-icon-box">
                                            <i className="bi bi-folder-fill" />
                                        </div>

                                        <div className="folder-meta">
                                            <strong className="folder-name" title={folder.name}>
                                                {folder.name}
                                            </strong>
                                            <span className="folder-count">
                                                {folder.resourceCount || 0} resources
                                            </span>
                                        </div>
                                    </div>

                                    <div className="folder-actions-bar">
                                        <button
                                            type="button"
                                            className="folder-action-btn rename"
                                            title="Rename folder"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openFolderModal(folder);
                                            }}
                                        >
                                            <i className="bi bi-pencil me-1" />
                                            Rename
                                        </button>

                                        <button
                                            type="button"
                                            className="folder-action-btn delete"
                                            title="Delete folder"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteFolder(folder);
                                            }}
                                        >
                                            <i className="bi bi-trash3 me-1" />
                                            Delete
                                        </button>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="resource-section tags-section">
                <div className="section-header">
                    <div>
                        <h2>
                            Tags
                        </h2>
                        <p>
                            Categorize materials with custom academic tags.
                        </p>
                    </div>
                </div>

                {tags.length === 0 ? (
                    <div className="academic-empty-state compact">
                        <p className="mb-2">
                            No tags yet
                        </p>
                        <button
                            type="button"
                            className="secondary-button"
                            onClick={openTagModal}
                        >
                            <i className="bi bi-tag me-1" />
                            Create your first tag
                        </button>
                    </div>
                ) : (
                    <div className="academic-tags-cloud">
                        {tags.map((tag) => {
                            const isSelected = filters.tag === tag.name;
                            return (
                                <div
                                    key={tag.id}
                                    className={`academic-tag-chip ${isSelected ? 'active' : ''}`}
                                >
                                    <button
                                        type="button"
                                        className="tag-chip-name"
                                        onClick={() =>
                                            setFilters({
                                                ...filters,
                                                tag: isSelected ? '' : tag.name,
                                            })
                                        }
                                        title={`Filter by tag "${tag.name}"`}
                                    >
                                        <i className="bi bi-tag-fill me-1" />
                                        {tag.name}
                                    </button>

                                    <button
                                        type="button"
                                        className="tag-chip-delete"
                                        onClick={() => handleDeleteTag(tag)}
                                        title={`Delete tag "${tag.name}"`}
                                        aria-label={`Delete tag ${tag.name}`}
                                    >
                                        <i className="bi bi-x" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>

            <section className="resource-section resources-section">
                <div className="section-header">
                    <div>
                        <h2>
                            Documents & Materials
                        </h2>
                        <p>
                            {resources.length} {resources.length === 1 ? 'resource' : 'resources'} available
                        </p>
                    </div>
                </div>

                {loading && (
                    <div className="academic-loading-state">
                        <div className="spinner-border spinner-border-sm text-success me-2" role="status" />
                        <span>Loading study materials...</span>
                    </div>
                )}

                {!loading && resources.length === 0 && (
                    <div className="academic-empty-state">
                        <div className="empty-state-icon">
                            <i className="bi bi-file-earmark-arrow-up" />
                        </div>
                        <h3>
                            {hasActiveFilters ? 'No resources found' : 'No resources yet'}
                        </h3>
                        <p>
                            {hasActiveFilters
                                ? 'No documents match your active search or filters.'
                                : 'Upload lecture notes, slides, question banks, or reference documents.'}
                        </p>
                        {hasActiveFilters ? (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={clearAllFilters}
                            >
                                <i className="bi bi-x-circle me-1" />
                                Clear all filters
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => openResourceModal()}
                            >
                                <i className="bi bi-cloud-arrow-up me-1" />
                                Upload your first resource
                            </button>
                        )}
                    </div>
                )}

                {!loading && resources.length > 0 && (
                    <div className="resources-card-list">
                        {resources.map((resource) => (
                            <ResourceCard
                                key={resource.id}
                                resource={resource}
                                onEdit={openResourceModal}
                                onDelete={handleDeleteResource}
                                onDownload={handleDownload}
                                onAddTag={openTagAssignmentModal}
                                onRemoveTag={handleRemoveTag}
                            />
                        ))}
                    </div>
                )}
            </section>

            {modal?.type === 'folder' || modal?.type === 'renameFolder' ? (
                <Modal
                    title={modal.type === 'folder' ? 'New Folder' : 'Rename Folder'}
                    onClose={() => setModal(null)}
                >
                    <form onSubmit={handleFolderSubmit}>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="folderNameInput">
                                Folder name
                            </label>
                            <input
                                id="folderNameInput"
                                className="form-control"
                                type="text"
                                placeholder="e.g. Unit 1 Notes"
                                required
                                value={folderForm.name}
                                onChange={(event) =>
                                    setFolderForm({ ...folderForm, name: event.target.value })
                                }
                            />
                        </div>

                        {modal.type === 'folder' && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="folderSubjectSelect">
                                    Subject (Optional)
                                </label>
                                <select
                                    id="folderSubjectSelect"
                                    className="form-select"
                                    value={folderForm.subjectId}
                                    onChange={(event) =>
                                        setFolderForm({
                                            ...folderForm,
                                            subjectId: event.target.value,
                                        })
                                    }
                                >
                                    <option value="">
                                        General folder (All Subjects)
                                    </option>
                                    {subjects.map((subject) => (
                                        <option key={subject.id} value={subject.id}>
                                            {subject.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving || !folderForm.name.trim()}
                            >
                                {saving
                                    ? 'Saving...'
                                    : modal.type === 'folder'
                                    ? 'Create Folder'
                                    : 'Save changes'}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal?.type === 'tag' ? (
                <Modal title="New Tag" onClose={() => setModal(null)}>
                    <form onSubmit={handleTagSubmit}>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="tagNameInput">
                                Tag name
                            </label>
                            <input
                                id="tagNameInput"
                                className="form-control"
                                type="text"
                                placeholder="e.g. Unit 1, Exam, Important"
                                required
                                value={tagName}
                                onChange={(event) => setTagName(event.target.value)}
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving || !tagName.trim()}
                            >
                                {saving ? 'Saving...' : 'Create Tag'}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal?.type === 'resource' || modal?.type === 'editResource' ? (
                <Modal
                    title={editingResource ? 'Edit Resource' : 'Upload Resource'}
                    onClose={() => setModal(null)}
                >
                    <form onSubmit={handleResourceSubmit}>
                        {!editingResource && (
                            <div className="mb-3">
                                <label className="form-label" htmlFor="fileInput">
                                    File (PDF, PPT, PPTX, DOC, DOCX)
                                </label>
                                <input
                                    id="fileInput"
                                    className="form-control"
                                    type="file"
                                    accept=".pdf,.ppt,.pptx,.doc,.docx"
                                    required
                                    onChange={(event) => setFile(event.target.files[0])}
                                />
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label" htmlFor="resourceSubjectSelect">
                                Subject
                            </label>
                            <select
                                id="resourceSubjectSelect"
                                className="form-select"
                                required
                                value={resourceForm.subjectId}
                                onChange={(event) =>
                                    setResourceForm({
                                        ...resourceForm,
                                        subjectId: event.target.value,
                                        folderId: '',
                                    })
                                }
                            >
                                <option value="">
                                    Select subject
                                </option>
                                {subjects.map((subject) => (
                                    <option key={subject.id} value={subject.id}>
                                        {subject.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-3">
                            <label className="form-label" htmlFor="resourceFolderSelect">
                                Folder
                            </label>
                            <select
                                id="resourceFolderSelect"
                                className="form-select"
                                value={resourceForm.folderId}
                                onChange={(event) =>
                                    setResourceForm({
                                        ...resourceForm,
                                        folderId: event.target.value,
                                    })
                                }
                            >
                                <option value="">
                                    No folder
                                </option>
                                {selectedSubjectFolders.map((folder) => (
                                    <option key={folder.id} value={folder.id}>
                                        {folder.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {!editingResource && tags.length > 0 && (
                            <div className="mb-3">
                                <label className="form-label">
                                    Tags (Select any that apply)
                                </label>
                                <div className="modal-tags-selection">
                                    {tags.map((tag) => {
                                        const isChecked = resourceForm.tagIds.includes(tag.id);
                                        return (
                                            <button
                                                type="button"
                                                key={tag.id}
                                                className={`modal-tag-pill ${isChecked ? 'selected' : ''}`}
                                                onClick={() => handleTagToggleInForm(tag.id)}
                                            >
                                                <i
                                                    className={`bi ${isChecked ? 'bi-check-circle-fill' : 'bi-circle'} me-1`}
                                                />
                                                {tag.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="mb-3">
                            <label className="form-label" htmlFor="resourceDescriptionInput">
                                Description (Optional)
                            </label>
                            <textarea
                                id="resourceDescriptionInput"
                                className="form-control"
                                rows="3"
                                placeholder="Brief overview of the material..."
                                value={resourceForm.description}
                                onChange={(event) =>
                                    setResourceForm({
                                        ...resourceForm,
                                        description: event.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="primary-button"
                                disabled={saving}
                            >
                                {saving
                                    ? editingResource
                                        ? 'Saving...'
                                        : 'Uploading...'
                                    : editingResource
                                    ? 'Save changes'
                                    : 'Upload Resource'}
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}

            {modal?.type === 'resourceTag' ? (
                <Modal
                    title={`Add Tag to "${modal.resource.originalName}"`}
                    onClose={() => setModal(null)}
                >
                    <form onSubmit={handleTagAssignment}>
                        <div className="mb-3">
                            <label className="form-label" htmlFor="assignTagSelect">
                                Select Tag
                            </label>
                            <select
                                id="assignTagSelect"
                                className="form-select"
                                name="tagId"
                                required
                                defaultValue=""
                            >
                                <option value="" disabled>
                                    Choose an existing tag...
                                </option>
                                {tags
                                    .filter(
                                        (tag) =>
                                            !modal.resource.tags?.some(
                                                (currentTag) => currentTag.id === tag.id
                                            )
                                    )
                                    .map((tag) => (
                                        <option key={tag.id} value={tag.id}>
                                            {tag.name}
                                        </option>
                                    ))}
                            </select>
                        </div>

                        <div className="modal-actions">
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="primary-button">
                                Add Tag
                            </button>
                        </div>
                    </form>
                </Modal>
            ) : null}
        </div>
    );
}

export default Resources;
