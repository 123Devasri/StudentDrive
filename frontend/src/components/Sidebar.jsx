import { NavLink } from 'react-router-dom';

const links = [{ to: '/dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' }, { to: '/subjects', label: 'Subjects', icon: 'bi-book' }, { to: '/resources', label: 'Resources', icon: 'bi-folder2-open' }, { to: '/syllabus', label: 'Syllabus', icon: 'bi-list-check' }, { to: '/assistant', label: 'AI Study Assistant', icon: 'bi-stars' }, { to: '/analytics', label: 'Analytics', icon: 'bi-bar-chart' }, { to: '/quiz', label: 'Quizzes', icon: 'bi-patch-question' }];

function Sidebar({ open, onClose }) {
  return <><aside className={`sidebar ${open ? 'show' : ''}`}>
    <div className="sidebar-label">WORKSPACE</div>
    <nav>{links.map((link) => <NavLink key={link.to} to={link.to} onClick={onClose} className={({ isActive }) => isActive ? 'active' : ''}><i className={`bi ${link.icon}`} />
    <span>{link.label}</span></NavLink>)}</nav>
    <div className="sidebar-bottom">
      <NavLink to="/settings" onClick={onClose} className={({ isActive }) => isActive ? 'active' : ''}><i className="bi bi-gear" /><span>Settings</span>
      </NavLink>
      <div className="sidebar-help"><i className="bi bi-lightbulb" />
      <div>
        <strong>Study tip</strong><small>Small progress adds up.</small>
        </div></div></div>
        </aside>{open && <div className="sidebar-overlay d-lg-none" onClick={onClose} />}</>;
}
export default Sidebar;
