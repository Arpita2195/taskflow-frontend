import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import KanbanBoard from '../components/board/KanbanBoard';
import CalendarBoard from '../components/board/CalendarBoard';
import ListView from '../components/board/ListView';
import TimelineView from '../components/board/TimelineView';
import TaskModal from '../components/task/TaskModal';
import NewProjectModal from '../components/project/NewProjectModal';
import LiveSync from '../components/collaboration/LiveSync';
import useProjectStore from '../store/useProjectStore';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import toast from 'react-hot-toast';

const ProjectBoard = () => {
  const { currentProject, projects, loadProjects } = useProjectStore();
  const { user } = useAuth();
  const { socket } = useSocket();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isLiveSyncOpen, setIsLiveSyncOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All Tasks');
  const [searchParams, setSearchParams] = useSearchParams();
  
  const boardTab = searchParams.get('tab') || 'kanban';
  const setBoardTab = (tab) => {
    setSearchParams((prev) => {
      prev.set('tab', tab);
      return prev;
    });
  };

  const isNewProject = searchParams.get('new') === '1';

  useEffect(() => {
    if (user) {
      loadProjects(user._id, user);
    }
  }, [user]);

  const project = currentProject || projects[0];

  // Auto-join Live Sync if query parameter is present
  useEffect(() => {
    if (searchParams.get('liveSync') === '1') {
      setIsLiveSyncOpen(true);
    }
  }, [searchParams]);

  // Listen for live sync invites/notifications
  useEffect(() => {
    if (!socket || !project) return;
    
    socket.on('live-sync-started', ({ userName, projectId }) => {
      if (projectId === project._id && userName !== user?.name) {
        toast((t) => (
          <div className="flex items-center gap-3">
            <span className="text-xl">📹</span>
            <div>
              <p className="font-bold text-sm">{userName} started a Live Sync</p>
              <button 
                onClick={() => {
                  setIsLiveSyncOpen(true);
                  toast.dismiss(t.id);
                }}
                className="text-xs text-accent font-bold hover:underline"
              >
                Join Now
              </button>
            </div>
          </div>
        ), { duration: 6000 });
      }
    });

    return () => socket.off('live-sync-started');
  }, [socket, project, user]);

  const handleStartLiveSync = () => {
    setIsLiveSyncOpen(true);
    if (socket && project) {
      socket.emit('start-live-sync', {
        projectId: project._id,
        userName: user?.name
      });
    }
  };

  if (!project) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-secondary">
        <div className="text-center">
          <div className="text-5xl mb-4 opacity-30">📋</div>
          <div className="font-head text-lg font-bold text-primary mb-2">No project selected</div>
          <div className="text-sm">Create or select a project from the sidebar.</div>
        </div>
        {isNewProject && (
          <NewProjectModal onClose={() => setSearchParams({})} />
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Board Tabs */}
      <div className="flex items-center gap-0 px-6 border-b border-white/7 bg-surface">
        {['kanban', 'list', 'calendar', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setBoardTab(tab)}
            className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-all capitalize
              ${boardTab === tab
                ? 'border-accent text-accent'
                : 'border-transparent text-secondary hover:text-primary'}`}
          >
            {tab === 'kanban' ? '📋' : tab === 'calendar' ? '📅' : tab === 'timeline' ? '⏳' : '📄'} {tab}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-4 py-2">
          {/* Copy Invite Link */}
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Project link copied to clipboard!');
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-secondary/5 border border-main rounded-lg text-secondary text-xs font-bold hover:bg-secondary/10 transition-all"
          >
            <span>🔗</span>
            Copy Link
          </button>

          {/* Live Sync Button */}
          <button
            onClick={handleStartLiveSync}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 border border-accent/20 rounded-lg text-accent text-xs font-bold hover:bg-accent/20 transition-all"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Live Sync
          </button>

          <div className="flex items-center gap-1.5 text-sm text-secondary">
            <div className="w-2 h-2 rounded-full" style={{ background: project.color }} />
            {project.name}
          </div>
        </div>
      </div>

      {/* Board Filters */}
      <div className="flex items-center gap-2 px-6 py-2.5 border-b border-main bg-surface overflow-x-auto no-scrollbar">
        {['All Tasks', 'My Tasks', '🔴 High Priority', '⏰ Overdue'].map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap
              ${activeFilter === f 
                ? 'border-accent/40 text-accent bg-accent/10 shadow-lg shadow-accent/5' 
                : 'text-secondary border-main hover:border-accent/40 hover:text-accent'}`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Kanban */}
      {boardTab === 'kanban' && (
        <div className="flex-1 overflow-hidden">
          <KanbanBoard
            projectId={project._id}
            onTaskClick={(task) => setSelectedTask(task._id)}
            filter={activeFilter}
          />
        </div>
      )}

      {/* List View */}
      {boardTab === 'list' && (
        <div className="flex-1 overflow-hidden">
          <ListView
            projectId={project._id}
            onTaskClick={(task) => setSelectedTask(task._id)}
            filter={activeFilter}
          />
        </div>
      )}

      {/* Calendar View */}
      {boardTab === 'calendar' && (
        <div className="flex-1 overflow-hidden">
          <CalendarBoard
            onTaskClick={(task) => setSelectedTask(task._id)}
            filter={activeFilter}
          />
        </div>
      )}

      {/* Timeline View */}
      {boardTab === 'timeline' && (
        <div className="flex-1 overflow-hidden">
          <TimelineView
            projectId={project._id}
            onTaskClick={(task) => setSelectedTask(task._id)}
            filter={activeFilter}
          />
        </div>
      )}

      {/* Task Modal */}
      {selectedTask && (
        <TaskModal
          taskId={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}

      {/* New Project Modal */}
      {isNewProject && (
        <NewProjectModal onClose={() => setSearchParams({})} />
      )}

      {/* Live Sync Video Call */}
      {isLiveSyncOpen && (
        <LiveSync
          roomName={project._id}
          userName={user?.name || 'User'}
          onClose={() => setIsLiveSyncOpen(false)}
        />
      )}
    </div>
  );
};

export default ProjectBoard;
