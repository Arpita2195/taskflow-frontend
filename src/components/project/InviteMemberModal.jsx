import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../api/axios';
import useProjectStore from '../../store/useProjectStore';

import { useAuth } from '../../context/AuthContext';

const InviteMemberModal = ({ onClose }) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const { currentProject, setCurrentProject } = useProjectStore();

  if (user?.role !== 'admin') return null;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Please enter an email');
    if (!currentProject) return toast.error('Please select a project first');

    setLoading(true);
    try {
      const { data } = await api.post(`/projects/${currentProject._id}/invite`, { email, role });
      if (data.project) {
        useProjectStore.setState((state) => ({
          projects: state.projects.map((p) => (p._id === data.project._id ? data.project : p))
        }));
        setCurrentProject(data.project, user._id, user);
      }
      toast.success(`Invitation sent to ${email}`);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-surface border border-main rounded-2xl w-full max-w-md shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-main flex justify-between items-center">
          <h2 className="font-head text-xl font-bold text-primary">Invite Team Member</h2>
          <button onClick={onClose} className="w-8 h-8 bg-bg hover:bg-accent2/10 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Email Address</label>
            <input
              type="email"
              autoFocus
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all placeholder:text-secondary/40"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2 block">Role</label>
            <select
              className="w-full bg-bg border border-main rounded-xl px-4 py-3 text-sm text-primary outline-none focus:border-accent transition-all"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="admin" className="bg-surface text-primary">Admin (Manage tasks & members)</option>
              <option value="member" className="bg-surface text-primary">Member (Edit tasks)</option>
              <option value="viewer" className="bg-surface text-primary">Viewer (Read-only)</option>
            </select>
          </div>

          <div className="p-3 bg-accent/5 border border-accent/10 rounded-xl text-[11px] text-secondary leading-relaxed">
            <span className="text-accent font-bold">Note:</span> If the user already exists, they will be added directly to the project. Otherwise, they will receive an email invitation to join.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-accent2 text-white text-sm font-head font-bold py-3.5 rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Invitation →'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InviteMemberModal;
