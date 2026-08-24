import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return <div className="app-shell"><Navbar onMenuClick={() => setSidebarOpen(true)} /><Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} /><main className="main-content"><Outlet /></main></div>;
}
export default Layout;
