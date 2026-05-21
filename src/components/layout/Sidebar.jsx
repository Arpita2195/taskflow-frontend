import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useProjectStore from '../../store/useProjectStore';
import { logoutUser } from '../../api/auth.api';

const Sidebar = ({ theme, toggleTheme, isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { projects, currentProject, setCurrentProject } = useProjectStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser(localStorage.getItem('refreshToken')).catch(() => {});
    logout();
    navigate('/login');
  };

  const initials = user?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden animate-[fadeIn_0.2s_ease]" 
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-surface border-r border-main flex flex-col h-screen z-[70] transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-main flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-base">⚡</div>
            <span className="font-head text-lg font-extrabold bg-gradient-to-r from-accent to-accent2 bg-clip-text text-transparent">TaskFlow</span>
          </div>
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center text-secondary hover:text-primary">✕</button>
        </div>

        {/* User */}
        <div className="p-3 border-b border-main flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent to-accent2 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-primary truncate">{user?.name}</div>
            <div className="text-xs text-secondary">{user?.role === 'admin' ? '🛡️ Admin' : 'Member'}</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-3 flex-1 overflow-y-auto no-scrollbar">
          <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 px-2 py-2">Main</div>
          {[
            { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
            { to: '/board', icon: '📋', label: 'Board' },
            { to: '/members', icon: '👥', label: 'Members' },
            { to: '/reports', icon: '📊', label: 'Reports' },
            { to: '/settings', icon: '⚙️', label: 'Settings' },
            ...(user?.role === 'admin' ? [{ to: '/admin', icon: '🛡️', label: 'Admin Panel' }] : []),
          ].map(({ to, icon, label }) => (
            <NavLink key={to} to={to} onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium mb-0.5 transition-all
                ${isActive ? 'bg-accent/15 text-accent' : 'text-secondary hover:bg-secondary/10 hover:text-primary'}`}>
              <span className="text-base w-5 text-center">{icon}</span> {label}
            </NavLink>
          ))}

          {/* Projects */}
          <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 px-2 py-2 mt-3">Projects</div>
          {projects.map((p) => (
            <div
              key={p._id}
              onClick={() => { 
                setCurrentProject(p, user?._id, user); 
                const projectPaths = ['/board', '/members', '/reports', '/settings'];
                if (!projectPaths.includes(window.location.pathname)) {
                  navigate('/board'); 
                }
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center gap-2 px-2.5 py-2 rounded-lg cursor-pointer text-sm font-medium mb-0.5 transition-all
                ${currentProject?._id === p._id ? 'bg-secondary/10 text-primary' : 'text-secondary hover:bg-secondary/10 hover:text-primary'}`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
              <span className="flex-1 truncate">{p.name}</span>
            </div>
          ))}

          {user?.role === 'admin' && (
            <button
              onClick={() => { navigate('/board?new=1'); if (window.innerWidth < 1024) onClose(); }}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-secondary hover:text-accent border border-dashed border-main hover:border-accent/40 transition-all mt-2"
            >
              + New Project
            </button>
          )}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-main flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="flex-1 flex items-center gap-2 px-3 py-2 bg-secondary/5 hover:bg-secondary/10 rounded-lg text-xs text-secondary transition-all"
          >
            {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
          </button>
          <button
            onClick={handleLogout}
            className="w-8 h-8 border border-main hover:border-accent2/50 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all"
            title="Logout"
          >
            ↩
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
