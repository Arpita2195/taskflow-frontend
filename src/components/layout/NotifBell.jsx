import { useEffect, useRef } from 'react';

const NotifBell = ({ notifications, unreadCount, onMarkRead, onMarkAll, onClose }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute top-12 right-0 w-80 bg-surface border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-[scaleIn_0.2s_ease]"
      style={{ transformOrigin: 'top right' }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/7">
        <span className="font-head text-sm font-bold text-white">
          Notifications {unreadCount > 0 && (
            <span className="ml-1 bg-accent2 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
          )}
        </span>
        <button onClick={onMarkAll} className="text-xs text-accent font-medium hover:underline">Mark all read</button>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
        {notifications.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">No notifications</div>
        )}
        {notifications.map((n) => (
          <div
            key={n._id}
            onClick={() => onMarkRead(n._id)}
            className={`flex gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-white/5 ${!n.isRead ? 'bg-accent/4' : ''}`}
          >
            {!n.isRead && <div className="w-1.5 h-1.5 bg-accent rounded-full mt-1.5 flex-shrink-0" />}
            <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
              style={{ background: n.sender?.avatar ? undefined : '#6C63FF' }}>
              {n.sender?.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-300 leading-snug" dangerouslySetInnerHTML={{ __html: n.message }} />
              <div className="text-xs text-gray-600 mt-0.5">{new Date(n.createdAt).toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotifBell;
