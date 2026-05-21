import { useEffect } from 'react';
import useTaskStore from '../../store/useTaskStore';
import useProjectStore from '../../store/useProjectStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const PRIORITY_COLOR = {
  high: 'bg-accent2/10 text-accent2 border border-accent2/20',
  medium: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  low: 'bg-accent3/10 text-accent3 border border-accent3/20',
};

const STATUS_COLOR = {
  'Backlog': 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
  'In Progress': 'bg-accent/10 text-accent border border-accent/20',
  'Review': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  'Done': 'bg-accent3/10 text-accent3 border border-accent3/20',
};

const ListView = ({ projectId, onTaskClick, filter }) => {
  const { tasks, loadTasks, relocateTask, onTaskCreated, onTaskUpdated, onTaskMoved, onTaskDeleted, editTask, removeTask } = useTaskStore();
  const { user } = useAuth();
  const { userRole } = useProjectStore();
  const { socket } = useSocket();

  const isReadOnly = userRole === 'viewer' || user?.role !== 'admin';

  useEffect(() => {
    if (projectId) loadTasks(projectId);
  }, [projectId]);

  // Real-time synchronization
  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit('join-board', { projectId });
    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:moved', onTaskMoved);
    socket.on('task:deleted', onTaskDeleted);
    return () => {
      socket.emit('leave-board', { projectId });
      socket.off('task:created');
      socket.off('task:updated');
      socket.off('task:moved');
      socket.off('task:deleted');
    };
  }, [socket, projectId]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await relocateTask(taskId, newStatus, 0);
      toast.success(`Moved to ${newStatus}`);
    } catch (err) {
      toast.error('Failed to move task');
    }
  };

  const handlePriorityChange = async (taskId, newPriority) => {
    try {
      await editTask(taskId, { priority: newPriority });
      toast.success(`Priority updated to ${newPriority}`);
    } catch (err) {
      toast.error('Failed to update priority');
    }
  };

  const handleDeleteTask = async (taskId, e) => {
    e.stopPropagation();
    if (isReadOnly) return;
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await removeTask(taskId);
        toast.success('Task deleted successfully');
      } catch (err) {
        toast.error('Failed to delete task');
      }
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'My Tasks') return t.assignees?.some((a) => a._id === user?._id || a === user?._id);
    if (filter === '🔴 High Priority') return t.priority === 'high';
    if (filter === '⏰ Overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'Done';
    return true;
  });

  const getOverdueStatus = (task) => {
    const today = new Date().toISOString().slice(0, 10);
    return task.dueDate && task.dueDate.slice(0, 10) < today && task.column !== 'Done';
  };

  return (
    <div className="flex-1 overflow-x-auto p-6 bg-bg/20 min-h-full">
      {filteredTasks.length === 0 ? (
        <div className="text-center text-secondary py-20 bg-surface/30 border border-main rounded-2xl">
          <div className="text-5xl mb-4 opacity-40">📄</div>
          <div className="font-head text-lg font-bold text-primary mb-2">No tasks found</div>
          <div className="text-sm text-secondary/60">Try adding a new task or changing your filters.</div>
        </div>
      ) : (
        <div className="w-full min-w-[900px] bg-surface/50 border border-main rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] border-b border-main text-xs font-bold uppercase tracking-widest text-secondary/80">
                <th className="py-4 px-6">Task Title & Details</th>
                <th className="py-4 px-3 w-[150px]">Status</th>
                <th className="py-4 px-3 w-[130px]">Priority</th>
                <th className="py-4 px-3 w-[140px]">Due Date</th>
                <th className="py-4 px-3 w-[160px]">Progress</th>
                <th className="py-4 px-3 w-[130px]">Assignees</th>
                {!isReadOnly && <th className="py-4 px-6 w-[80px] text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-main">
              {filteredTasks.map((t) => {
                const overdue = getOverdueStatus(t);
                return (
                  <tr
                    key={t._id}
                    onClick={() => onTaskClick(t)}
                    className="hover:bg-white/[0.02] transition-all duration-150 cursor-pointer group"
                  >
                    {/* Title & Details */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ background: t.labelColor || '#6C63FF20', color: t.labelTextColor || '#6C63FF' }}
                            >
                              {t.label || 'Feature'}
                            </span>
                          </div>
                          <span className="font-head text-sm font-bold text-primary truncate max-w-[320px] group-hover:text-accent transition-colors">
                            {t.title}
                          </span>
                          {t.description && (
                            <span className="text-xs text-secondary/70 truncate max-w-[320px] mt-0.5" 
                              dangerouslySetInnerHTML={{ __html: t.description.replace(/<[^>]*>/g, '') }}
                            />
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status Dropdown */}
                    <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                      {isReadOnly ? (
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[t.column]}`}>
                          {t.column}
                        </span>
                      ) : (
                        <select
                          value={t.column}
                          onChange={(e) => handleStatusChange(t._id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg bg-surface/50 border border-main text-primary outline-none focus:border-accent transition-all cursor-pointer ${STATUS_COLOR[t.column]}`}
                        >
                          {['Backlog', 'In Progress', 'Review', 'Done'].map((st) => (
                            <option key={st} value={st} className="bg-surface text-primary">
                              {st}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Priority Dropdown */}
                    <td className="py-4 px-3" onClick={(e) => e.stopPropagation()}>
                      {isReadOnly ? (
                        <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full capitalize ${PRIORITY_COLOR[t.priority]}`}>
                          {t.priority}
                        </span>
                      ) : (
                        <select
                          value={t.priority}
                          onChange={(e) => handlePriorityChange(t._id, e.target.value)}
                          className={`text-xs font-bold px-2 py-1 rounded-lg bg-surface/50 border border-main text-primary outline-none focus:border-accent transition-all cursor-pointer capitalize ${PRIORITY_COLOR[t.priority]}`}
                        >
                          {['high', 'medium', 'low'].map((pr) => (
                            <option key={pr} value={pr} className="bg-surface text-primary">
                              {pr}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>

                    {/* Due Date */}
                    <td className="py-4 px-3">
                      {t.dueDate ? (
                        <span className={`text-xs flex items-center gap-1.5 ${overdue ? 'text-accent2 font-bold animate-[pulse_2s_infinite]' : 'text-secondary font-medium'}`}>
                          <span>{overdue ? '⚠️' : '📅'}</span>
                          {t.dueDate.slice(0, 10)}
                        </span>
                      ) : (
                        <span className="text-xs text-secondary/40 italic">—</span>
                      )}
                    </td>

                    {/* Progress Slider */}
                    <td className="py-4 px-3">
                      <div className="flex flex-col gap-1 w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-bold text-secondary">
                          <span className={t.progress > 0 ? 'text-accent' : ''}>{t.progress}%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 border border-main rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-accent to-accent3 transition-all duration-500 rounded-full"
                            style={{ width: `${t.progress}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Assignees */}
                    <td className="py-4 px-3">
                      <div className="flex items-center">
                        {(t.assignees || []).slice(0, 3).map((u, i) => (
                          <div
                            key={u._id || i}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white border-2 border-surface shadow-md hover:scale-110 transition-transform cursor-help"
                            style={{ background: '#6C63FF', marginLeft: i > 0 ? '-8px' : 0 }}
                            title={u.name}
                          >
                            {u.name?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                        ))}
                        {(t.assignees || []).length > 3 && (
                          <div
                            className="w-7 h-7 rounded-full bg-surface border border-main flex items-center justify-center text-[9px] font-bold text-secondary -ml-2 shadow-md"
                            title={`${(t.assignees || []).length - 3} more assignees`}
                          >
                            +{(t.assignees || []).length - 3}
                          </div>
                        )}
                        {(!t.assignees || t.assignees.length === 0) && (
                          <span className="text-xs text-secondary/40 italic">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    {!isReadOnly && (
                      <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDeleteTask(t._id, e)}
                          className="w-8 h-8 rounded-lg bg-accent2/10 hover:bg-accent2/20 text-accent2 border border-accent2/20 flex items-center justify-center transition-all hover:scale-105"
                          title="Delete Task"
                        >
                          🗑️
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListView;
