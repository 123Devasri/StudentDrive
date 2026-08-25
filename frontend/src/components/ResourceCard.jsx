function ResourceCard({ resource, onEdit, onDelete, onDownload, onAddTag, onRemoveTag }) {
    const fileType = resource.fileType.toUpperCase();
    const fileSize = `${(resource.fileSize / 1024).toFixed(1)} KB`;

    return (
        <article className="resource-row">
            <div className="file-icon">
                <i className={`bi ${fileType === 'PDF' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text'}`} />
            </div>
            <div className="resource-name">
                <strong>{resource.originalName}</strong>
                <span>
                    {fileType} · {fileSize} · {resource.subjectName} · {resource.folderName || 'No folder'} · {resource.description || 'No description'}
                </span>
                <div>
                    {resource.tags?.map((tag) => <span className="badge text-bg-light me-1" key={tag.name || tag}>{tag.name || tag}{tag.id && <button onClick={() => onRemoveTag(resource, tag.id)}>x</button>}</span>)}
                </div>
            </div>
            <span className="resource-date">{resource.createdAt.slice(0, 10)}</span>
            <div className="resource-actions">
                <button title="Download" onClick={() => onDownload(resource)}>
                    <i className="bi bi-download" />
                </button>
                <button title="Edit" onClick={() => onEdit(resource)}>
                    <i className="bi bi-pencil" />
                </button>
                <button title="Add tag" onClick={() => onAddTag(resource)}>
                    <i className="bi bi-tag" />
                </button>
                <button title="Delete" onClick={() => onDelete(resource)}>
                    <i className="bi bi-trash3" />
                </button>
            </div>
        </article>
    );
}

export default ResourceCard;
