function Modal({ title, children, onClose }) {
    return (
        <div className="app-modal-backdrop" role="presentation" onMouseDown={onClose}>
            <section className="app-modal" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => event.stopPropagation()}>
                <div className="app-modal-header">
                    <h2>{title}</h2>
                    <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">&times;</button>
                </div>
                {children}
            </section>
        </div>
    );
}

export default Modal;