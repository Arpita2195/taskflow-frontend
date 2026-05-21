import { useState } from 'react';
import useTaskStore from '../../store/useTaskStore';
import useProjectStore from '../../store/useProjectStore';
import toast from 'react-hot-toast';

import { useAuth } from '../../context/AuthContext';

const NewTaskModal = ({ onClose }) => {
  const { user } = useAuth();
  const { addTask } = useTaskStore();
  const { currentProject, projects } = useProjectStore();
  
  const defaultProjectId = currentProject?._id || projects[0]?._id;

  if (user?.role !== 'admin') return null;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('medium');
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Task title is required');
    if (!projectId) return toast.error('Please select a project first');
    
    setLoading(true);
    try {
      await addTask({
        title,
        description,
        priority,
        project: projectId,
        column: 'Backlog',
        progress: 0,
        label: 'Feature',
        labelColor: '#6C63FF20',
        labelTextColor: '#6C63FF'
      });
      toast.success('Task created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-main rounded-2xl w-full max-w-lg shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-main flex justify-between items-center">
          <h2 className="font-head text-xl font-bold text-primary">New Task</h2>
          <button onClick={onClose} className="w-7 h-7 bg-secondary/5 hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {!defaultProjectId && (
            <div className="text-sm text-yellow-500 bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/20">
              Please create a project first before creating tasks.
            </div>
          )}
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Project</label>
            <select
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!projects.length}
            >
              <option value="" className="bg-surface text-primary">Select a project...</option>
              {projects.map(p => (
                <option key={p._id} value={p._id} className="bg-surface text-primary">{p.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Task Title</label>
            <input
              type="text"
              autoFocus
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="e.g. Implement user authentication"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Description</label>
            <textarea
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none"
              placeholder="Add details about this task..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Priority</label>
            <div className="flex gap-2">
              {['high', 'medium', 'low'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all capitalize
                    ${priority === p
                      ? p === 'high' ? 'bg-accent2/20 text-accent2 border border-accent2/40'
                        : p === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/40'
                        : 'bg-accent3/20 text-accent3 border border-accent3/40'
                      : 'bg-white/5 text-secondary border border-transparent hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading || !projectId}
            className="w-full mt-2 bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-bold py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewTaskModal;
