function formatFileSize(bytes) {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

function getFileIconClass(fileType) {
    const normalized = (fileType || '').toLowerCase();
    if (normalized === 'pdf') {
        return 'bi-file-earmark-pdf file-icon-pdf';
    }
    if (normalized === 'ppt' || normalized === 'pptx') {
        return 'bi-file-earmark-slides file-icon-ppt';
    }
    if (normalized === 'doc' || normalized === 'docx') {
        return 'bi-file-earmark-word file-icon-doc';
    }
    return 'bi-file-earmark-text file-icon-default';
}

function ResourceCard({
    resource,
    onEdit,
    onDelete,
    onDownload,
    onAddTag,
    onRemoveTag,
}) {
    const fileType = (resource.fileType || 'file').toUpperCase();
    const formattedSize = formatFileSize(resource.fileSize);
    const formattedDate = formatDate(resource.createdAt);
    const iconClass = getFileIconClass(resource.fileType);

    return (
        <article className="academic-resource-card">
            <div className="resource-card-main">
                <div className="resource-icon-wrapper">
                    <i
                        className={`bi ${iconClass}`}
                        aria-hidden="true"
                    />
                </div>

                <div className="resource-details">
                    <h3 className="resource-title" title={resource.originalName}>
                        {resource.originalName}
                    </h3>

                    <div className="resource-type-meta">
                        <span className="resource-pill">
                            {fileType}
                        </span>
                        <span className="meta-separator">•</span>
                        <span className="resource-size">
                            {formattedSize}
                        </span>
                    </div>

                    <div className="resource-context-row">
                        <span className="context-item">
                            <strong>Subject:</strong> {resource.subjectName || 'No subject'}
                        </span>
                        <span className="context-divider">|</span>
                        <span className="context-item">
                            <strong>Folder:</strong> {resource.folderName ? resource.folderName : 'No folder'}
                        </span>
                    </div>

                    {resource.description && (
                        <p className="resource-description">
                            {resource.description}
                        </p>
                    )}

                    <div className="resource-tags-section">
                        <span className="tags-label">
                            Tags:
                        </span>
                        {(!resource.tags || resource.tags.length === 0) ? (
                            <span className="no-tags-note">
                                No tags
                            </span>
                        ) : (
                            <div className="tag-badges-list">
                                {resource.tags.map((tag) => (
                                    <span
                                        className="academic-tag-badge"
                                        key={tag.id || tag.name}
                                    >
                                        <i
                                            className="bi bi-tag-fill me-1"
                                            aria-hidden="true"
                                        />
                                        {tag.name}
                                        {onRemoveTag && tag.id && (
                                            <button
                                                type="button"
                                                className="tag-remove-button"
                                                title={`Remove tag ${tag.name}`}
                                                aria-label={`Remove tag ${tag.name}`}
                                                onClick={() => onRemoveTag(resource, tag.id)}
                                            >
                                                <i className="bi bi-x" />
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="resource-card-side">
                <div className="resource-upload-info">
                    <span className="upload-label">
                        Uploaded:
                    </span>
                    <span className="upload-date">
                        {formattedDate}
                    </span>
                </div>

                <div className="resource-card-actions">
                    <button
                        type="button"
                        className="academic-action-btn btn-download"
                        title="Download file"
                        onClick={() => onDownload(resource)}
                    >
                        <i
                            className="bi bi-download"
                            aria-hidden="true"
                        />
                        <span>
                            Download
                        </span>
                    </button>

                    <button
                        type="button"
                        className="academic-action-btn btn-edit"
                        title="Edit resource"
                        onClick={() => onEdit(resource)}
                    >
                        <i
                            className="bi bi-pencil"
                            aria-hidden="true"
                        />
                        <span>
                            Edit
                        </span>
                    </button>

                    <button
                        type="button"
                        className="academic-action-btn btn-tag"
                        title="Manage tags"
                        onClick={() => onAddTag(resource)}
                    >
                        <i
                            className="bi bi-tags"
                            aria-hidden="true"
                        />
                        <span>
                            Tags
                        </span>
                    </button>

                    <button
                        type="button"
                        className="academic-action-btn btn-delete"
                        title="Delete resource"
                        onClick={() => onDelete(resource)}
                    >
                        <i
                            className="bi bi-trash3"
                            aria-hidden="true"
                        />
                        <span>
                            Delete
                        </span>
                    </button>
                </div>
            </div>
        </article>
    );
}

export default ResourceCard;
