import { useState } from 'react';
import useProjectStore from '../../store/useProjectStore';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const NewProjectModal = ({ onClose }) => {
  const { user } = useAuth();
  const { addProject, setCurrentProject } = useProjectStore();
  const [name, setName] = useState('');
  const [color, setColor] = useState('#6C63FF');
  const [loading, setLoading] = useState(false);

  if (user?.role !== 'admin') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Project name is required');
    
    setLoading(true);
    try {
      const newProject = await addProject({ name, color });
      setCurrentProject(newProject, user?._id, user);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-main rounded-2xl w-full max-w-md shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-main flex justify-between items-center">
          <h2 className="font-head text-xl font-bold text-primary">New Project</h2>
          <button onClick={onClose} className="w-7 h-7 bg-bg hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Project Name</label>
            <input
              type="text"
              autoFocus
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="e.g. Website Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Project Color</label>
            <div className="flex gap-2">
              {['#6C63FF', '#43E97B', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f43f5e'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-accent scale-110' : 'border-transparent hover:scale-110'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-bold py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewProjectModal;
