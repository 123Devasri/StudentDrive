function ResourceCard({ resource, onEdit, onDelete, onDownload }) {
    const fileType = resource.fileType.toUpperCase();

    return (
        <article className="resource-row">
            <div className="file-icon">
                <i className={`bi ${fileType === 'PDF' ? 'bi-file-earmark-pdf' : 'bi-file-earmark-text'}`} />
            </div>
            <div className="resource-name">
                <strong>{resource.originalName}</strong>
                <span>{fileType} · {resource.subjectName} · {resource.description || 'No description'}</span>
            </div>
            <span className="resource-date">{resource.createdAt.slice(0, 10)}</span>
            <div className="resource-actions">
                <button title="Download" onClick={() => onDownload(resource)}>
                    <i className="bi bi-download" />
                </button>
                <button title="Edit" onClick={() => onEdit(resource)}>
                    <i className="bi bi-pencil" />
                </button>
                <button title="Delete" onClick={() => onDelete(resource)}>
                    <i className="bi bi-trash3" />
                </button>
            </div>
        </article>
    );
}

export default ResourceCard;
