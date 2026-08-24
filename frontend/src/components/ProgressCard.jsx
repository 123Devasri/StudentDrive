function ProgressCard({ icon, label, value, note, accent = 'green' }) { return <article className="metric-card"><div className={`metric-icon ${accent}`}><i className={`bi ${icon}`} /></div><div><span>{label}</span><strong>{value}</strong><small>{note}</small></div></article>; }
export default ProgressCard;
