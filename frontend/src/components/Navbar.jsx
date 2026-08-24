function Navbar({ onMenuClick }) {
  return <header className="topbar d-flex align-items-center justify-content-between px-3 px-lg-4">
    <button className="menu-button d-lg-none" onClick={onMenuClick} aria-label="Open navigation"><i className="bi bi-list" /></button>
    <div className="brand-mark d-flex align-items-center gap-2"><span className="brand-icon"><i className="bi bi-journal-bookmark-fill" /></span><strong>StudentDrive</strong></div>
    <div className="d-flex align-items-center gap-3"><button className="icon-button" aria-label="Notifications"><i className="bi bi-bell" /></button><div className="profile"><span>DS</span><div className="d-none d-sm-block"><strong>Deva Sri</strong><small>Student</small></div><i className="bi bi-chevron-down d-none d-sm-block" /></div></div>
  </header>;
}
export default Navbar;
