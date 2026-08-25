function ResourceCard({ resource }) { 
    return <article className="resource-row">
        <div className="file-icon" style={{ color: resource.color }}>
            <i className={`bi ${resource.icon}`} /></div>
            <div className="resource-name"><strong>{resource.name}</strong>
            <span>{resource.type} · {resource.subject} · {resource.folder}</span>
            </div>
            <span className="resource-date">{resource.uploaded}</span>
            <div className="resource-actions">
                <button title="Open"><i className="bi bi-box-arrow-up-right" />
                </button>
                <button title="Ask AI"><i className="bi bi-stars" />
                </button><button title="Delete"><i className="bi bi-trash3" />
                </button></div>
                </article>; }
export default ResourceCard;
