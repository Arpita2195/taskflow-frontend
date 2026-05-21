import { useState, useEffect } from 'react';
import useProjectStore from '../store/useProjectStore';
import useTaskStore from '../store/useTaskStore';
import InviteMemberModal from '../components/project/InviteMemberModal';
import { useAuth } from '../context/AuthContext';
import { updateMemberRole, removeMember, cancelInvite } from '../api/project.api';
import toast from 'react-hot-toast';

const Members = () => {
  const { currentProject, userRole, setCurrentProject, projects, loadProjects, loading } = useProjectStore();
  const { tasks } = useTaskStore();
  const { user } = useAuth();
  const [showInvite, setShowInvite] = useState(false);

  const canInvite = user?.role === 'admin';

  useEffect(() => {
    if (projects.length === 0 && user) {
      loadProjects(user._id, user);
    }
  }, [projects.length, user]);

  if (loading && !currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-secondary text-sm">Loading project members...</span>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500 italic">
        Please select a project to see team members.
      </div>
    );
  }

  // Combine owner and members for the list
  const allMembers = [
    { ...currentProject.owner, role: 'owner' },
    ...currentProject.members.map(m => ({ ...m.user, role: m.role }))
  ];

  const getCanEditMember = (member) => {
    if (user?.role !== 'admin') return false; // Non-global-admins cannot edit members
    if (member.role === 'owner') return false; // Owner is untouchable
    if (member._id === user?._id) return false; // Cannot edit oneself
    
    if (userRole === 'owner') return true; // Owner/Global Admin can edit anyone
    if (userRole === 'admin') {
      // Admin can only edit member/viewer, not other admins
      return member.role !== 'admin';
    }
    return false;
  };

  const handleUpdateRole = async (userId, role) => {
    try {
      const { data } = await updateMemberRole(currentProject._id, userId, role);
      if (data.success) {
        useProjectStore.setState((state) => ({
          projects: state.projects.map((p) => (p._id === data.project._id ? data.project : p))
        }));
        setCurrentProject(data.project, user._id, user);
        toast.success("Member role updated successfully");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update member role");
    }
  };

  const handleRemoveMember = async (userId) => {
    if (confirm("Are you sure you want to remove this member from the project?")) {
      try {
        const { data } = await removeMember(currentProject._id, userId);
        if (data.success) {
          useProjectStore.setState((state) => ({
            projects: state.projects.map((p) => (p._id === data.project._id ? data.project : p))
          }));
          setCurrentProject(data.project, user._id, user);
          toast.success("Member removed from project");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to remove member");
      }
    }
  };

  const handleCancelInvite = async (email) => {
    if (confirm(`Are you sure you want to cancel the invitation for ${email}?`)) {
      try {
        const { data } = await cancelInvite(currentProject._id, email);
        if (data.success) {
          useProjectStore.setState((state) => ({
            projects: state.projects.map((p) => (p._id === data.project._id ? data.project : p))
          }));
          setCurrentProject(data.project, user._id, user);
          toast.success("Invitation cancelled successfully");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to cancel invitation");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 animate-[fadeUp_0.4s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="font-head text-2xl font-bold text-primary mb-1">Team Members</h2>
          <p className="text-sm text-secondary">{allMembers.length} members in this project</p>
        </div>
        {canInvite && (
          <button 
            onClick={() => setShowInvite(true)}
            className="flex items-center gap-2 px-4 py-2 bg-secondary/5 border border-main rounded-xl text-sm font-semibold text-primary hover:bg-secondary/10 hover:border-accent/40 transition-all"
          >
            ➕ Invite Member
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allMembers.map((m, i) => {
          const initials = m.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
          const memberTasks = tasks.filter(t => t.assignees?.some(a => a._id === m._id));
          const doneTasks = memberTasks.filter(t => t.column === 'Done').length;
          const rate = memberTasks.length ? Math.round((doneTasks / memberTasks.length) * 100) : 0;
          
          return (
            <div
              key={m._id}
              className="bg-surface border border-main rounded-2xl p-6 hover:border-accent/30 hover:shadow-xl hover:shadow-accent/5 transition-all group animate-[card-enter_0.35s_ease_both]"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-head text-xl font-bold text-white shadow-lg group-hover:scale-110 transition-all duration-300">
                  {initials}
                </div>
                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {getCanEditMember(m) ? (
                    <div className="flex items-center gap-2">
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m._id, e.target.value)}
                        className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-surface/50 border border-main text-primary outline-none focus:border-accent cursor-pointer transition-all"
                      >
                        <option value="admin" className="bg-[#141822] text-yellow-400">Admin</option>
                        <option value="member" className="bg-[#141822] text-accent3">Member</option>
                        <option value="viewer" className="bg-[#141822] text-gray-400">Viewer</option>
                      </select>
                      <button
                        onClick={() => handleRemoveMember(m._id)}
                        className="p-1 px-2 rounded-lg bg-accent2/10 hover:bg-accent2/20 text-accent2 border border-accent2/20 hover:scale-105 transition-all text-xs font-bold"
                        title="Remove member"
                      >
                        🗑️
                      </button>
                    </div>
                  ) : (
                    <div className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest
                      ${m.role === 'owner' ? 'bg-accent2/10 text-accent2' : 
                        m.role === 'admin' ? 'bg-yellow-500/10 text-yellow-400' : 
                        'bg-accent3/10 text-accent3'}`}
                    >
                      {m.role}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mb-6">
                <div className="font-head text-lg font-bold text-primary mb-0.5">{m.name}</div>
                <div className="text-sm text-secondary">{m.email}</div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-6">
                {[
                  { label: 'Tasks', val: memberTasks.length },
                  { label: 'Done', val: doneTasks },
                  { label: 'Rate', val: `${rate}%` },
                ].map(({ label, val }) => (
                  <div key={label} className="bg-secondary/5 rounded-xl p-2 text-center">
                    <div className="text-sm font-bold text-primary">{val}</div>
                    <div className="text-[10px] text-secondary/60 uppercase font-bold">{label}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-secondary/60">
                  <span>Efficiency Rate</span>
                  <span>{rate}%</span>
                </div>
                <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden">
                  <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${rate}%` }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {currentProject.pendingInvites && currentProject.pendingInvites.length > 0 && (
        <div className="mt-12">
          <h3 className="font-head text-lg font-bold text-primary mb-4 pb-2 border-b border-main/50">Pending Invitations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentProject.pendingInvites.map((invite, i) => {
              const initials = invite.email?.split('@')[0].slice(0, 2).toUpperCase() || '??';
              return (
                <div
                  key={invite._id || invite.email}
                  className="bg-surface border border-main rounded-2xl p-5 hover:border-accent/30 transition-all flex items-center justify-between group animate-[card-enter_0.35s_ease_both]"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center font-head text-xs font-bold text-secondary">
                      {initials}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary truncate max-w-[150px]" title={invite.email}>
                        {invite.email}
                      </div>
                      <div className="text-[10px] text-secondary font-semibold uppercase tracking-wider">
                        Invited as <span className="text-accent">{invite.role}</span>
                      </div>
                    </div>
                  </div>
                  {canInvite && (
                    <button
                      onClick={() => handleCancelInvite(invite.email)}
                      className="p-1 px-2.5 rounded-lg bg-accent2/10 hover:bg-accent2/20 text-accent2 border border-accent2/20 hover:scale-105 transition-all text-xs font-bold flex items-center gap-1"
                      title="Cancel invitation"
                    >
                      🗑️ Cancel
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showInvite && <InviteMemberModal onClose={() => setShowInvite(false)} />}
    </div>
  );
};

export default Members;

