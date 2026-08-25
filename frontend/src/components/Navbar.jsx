import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  async function handleLogout() { await logout(); navigate('/login', { replace: true }); }
  return <header className="topbar d-flex align-items-center justify-content-between px-3 px-lg-4">
    <button className="menu-button d-lg-none" onClick={onMenuClick} aria-label="Open navigation"><i className="bi bi-list" /></button>
    <div className="brand-mark d-flex align-items-center gap-2">
      <span className="brand-icon"><i className="bi bi-journal-bookmark-fill" />
    </span><strong>StudentDrive</strong></div>
    <div className="d-flex align-items-center gap-3">
      <button className="icon-button" aria-label="Notifications"><i className="bi bi-bell" /></button>
      <div className="profile"><span>{user?.name?.slice(0, 2).toUpperCase()}</span><div className="d-none d-sm-block">
        <strong>{user?.name}</strong><small>Student</small></div><button className="btn btn-link p-0 text-reset" onClick={handleLogout} aria-label="Log out" title="Log out"><i className="bi bi-box-arrow-right" /></button></div></div>
  </header>;
}
export default Navbar;
