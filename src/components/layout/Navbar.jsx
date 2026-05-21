import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useNotifications from '../../hooks/useNotifications';
import useProjectStore from '../../store/useProjectStore';
import { useAuth } from '../../context/AuthContext';

const Navbar = ({ title, onNewTask, onMenuClick }) => {
  const [showNotif, setShowNotif] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const { userRole } = useProjectStore();
  const { user } = useAuth();
  const navigate = useNavigate();

  const isReadOnly = userRole === 'viewer' || user?.role !== 'admin';

  return (
    <header className="h-14 flex-shrink-0 bg-surface border-b border-main flex items-center px-4 lg:px-6 gap-3 lg:gap-4">
      <button 
        onClick={onMenuClick}
        className="lg:hidden w-9 h-9 flex items-center justify-center text-secondary hover:text-primary border border-main rounded-xl"
      >
        ☰
      </button>

      <h1 className="font-head text-base lg:text-lg font-bold text-primary flex-shrink-0 truncate max-w-[120px] lg:max-w-none">{title}</h1>

      {/* Search - Hidden on small mobile */}
      <div className="hidden sm:flex items-center gap-2 bg-secondary/5 border border-main rounded-xl px-3 py-2 flex-1 max-w-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
        <span className="text-secondary text-sm">🔍</span>
        <input
          type="text"
          placeholder="Search tasks..."
          className="bg-transparent outline-none text-sm text-primary placeholder-secondary/50 flex-1"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="w-9 h-9 border border-main rounded-xl flex items-center justify-center text-secondary hover:text-primary hover:border-accent/40 transition-all relative"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent2 rounded-full border-2 border-surface" />
            )}
          </button>

          {showNotif && (
            <div className="absolute right-0 top-11 w-80 bg-surface border border-main rounded-2xl shadow-2xl z-50 overflow-hidden animate-[scaleIn_0.2s_ease]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-main">
                <span className="font-head text-sm font-bold text-primary">
                  Notifications {unreadCount > 0 && (
                    <span className="ml-1 bg-accent2 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
                  )}
                </span>
                <button onClick={markAllRead} className="text-xs text-accent hover:text-accent/80 transition-all">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <div className="text-center text-secondary text-sm py-8">All caught up! 🎉</div>
                )}
                {notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => markRead(n._id)}
                    className={`flex gap-3 px-4 py-3 border-b border-main cursor-pointer hover:bg-secondary/5 transition-all
                      ${n.isRead ? '' : 'bg-accent/4'}`}
                  >
                    {!n.isRead && <div className="absolute left-2 mt-2 w-1.5 h-1.5 bg-accent rounded-full" />}
                    <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {n.sender?.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-primary leading-snug" dangerouslySetInnerHTML={{ __html: n.message }} />
                      <div className="text-xs text-secondary mt-1">{new Date(n.createdAt).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Calendar */}
        <button 
          onClick={() => navigate('/board?tab=calendar')}
          className="w-9 h-9 border border-main rounded-xl flex items-center justify-center text-secondary hover:text-primary hover:border-accent/40 transition-all"
        >
          📅
        </button>

        {/* New Task */}
        {!isReadOnly && (
          <button
            onClick={onNewTask}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all"
          >
            + New Task
          </button>
        )}
      </div>
    </header>
  );
};

export default Navbar;
