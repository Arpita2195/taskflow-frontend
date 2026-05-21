import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchUsers, createUser, updateUser, deleteUser } from '../api/user.api';

const AdminPanel = () => {
  const { user } = useAuth();
  
  // Guard clause just in case
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Form/Selected user state
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'user' });
  const [actionLoading, setActionLoading] = useState(false);

  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const { data } = await fetchUsers();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalUsers = users.length;
  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const onlineUsers = users.filter((u) => u.isOnline).length;

  const handleOpenAddModal = () => {
    setFormData({ name: '', email: '', password: '', role: 'user' });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (u) => {
    setSelectedUser(u);
    setFormData({ name: u.name, email: u.email, password: '', role: u.role });
    setShowEditModal(true);
  };

  const handleOpenDeleteConfirm = (u) => {
    setSelectedUser(u);
    setShowDeleteConfirm(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      return toast.error('Name, email, and password are required');
    }
    
    setActionLoading(true);
    try {
      const { data } = await createUser(formData);
      if (data.success) {
        toast.success(`User ${data.user.name} created successfully!`);
        setShowAddModal(false);
        loadAllUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim()) {
      return toast.error('Name and email are required');
    }
    
    setActionLoading(true);
    try {
      const { data } = await updateUser(selectedUser._id, {
        name: formData.name,
        email: formData.email,
        role: formData.role
      });
      if (data.success) {
        toast.success('User updated successfully!');
        setShowEditModal(false);
        loadAllUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const { data } = await deleteUser(selectedUser._id);
      if (data.success) {
        toast.success('User deleted successfully!');
        setShowDeleteConfirm(false);
        loadAllUsers();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 animate-[fadeUp_0.4s_ease]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-head text-2xl font-bold text-primary mb-1">🛡️ Admin Panel</h2>
          <p className="text-sm text-secondary">Manage global application users and security roles.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-semibold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all cursor-pointer"
        >
          ➕ Add User
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: '👥', label: 'Total Users', value: totalUsers, color: 'rgba(108,99,255,0.12)' },
          { icon: '🛡️', label: 'Administrators', value: totalAdmins, color: 'rgba(245,158,11,0.12)' },
          { icon: '🟢', label: 'Active Online', value: onlineUsers, color: 'rgba(67,233,123,0.12)' },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-surface border border-main rounded-2xl p-5 flex items-center gap-4 animate-[card-enter_0.35s_ease_both]"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: stat.color }}>
              {stat.icon}
            </div>
            <div>
              <div className="text-[11px] text-secondary font-bold uppercase tracking-widest">{stat.label}</div>
              <div className="font-head text-3xl font-extrabold text-primary mt-0.5">{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* User Management Section */}
      <div className="bg-surface border border-main rounded-2xl overflow-hidden shadow-xl animate-[fadeUp_0.5s_ease]">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-main flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="flex items-center gap-2 bg-secondary/5 border border-main rounded-xl px-3 py-2 w-full sm:max-w-xs focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all">
            <span className="text-secondary text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              className="bg-transparent outline-none text-sm text-primary placeholder-secondary/50 flex-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="text-xs font-medium text-secondary">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <div className="text-sm text-secondary">Loading users database...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-16 text-secondary text-sm italic">
              No users found matching "{searchTerm}"
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-main text-[10px] font-bold uppercase tracking-widest text-secondary/70 bg-secondary/2">
                  <th className="py-3 px-5">User</th>
                  <th className="py-3 px-5">Email</th>
                  <th className="py-3 px-5">Global Role</th>
                  <th className="py-3 px-5">Status</th>
                  <th className="py-3 px-5">Registered</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-main">
                {filteredUsers.map((u) => {
                  const initials = getInitials(u.name);
                  const isCurrentUser = u._id === user?._id;
                  return (
                    <tr key={u._id} className="hover:bg-secondary/2 transition-colors">
                      <td className="py-3.5 px-5 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent2 flex items-center justify-center font-head text-sm font-bold text-white shadow-md">
                          {initials}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-primary flex items-center gap-1.5">
                            {u.name}
                            {isCurrentUser && (
                              <span className="text-[9px] bg-accent/20 text-accent font-bold px-1.5 py-0.5 rounded-md">You</span>
                            )}
                          </div>
                          <div className="text-[11px] text-secondary/60 sm:hidden">{u.email}</div>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-secondary">{u.email}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border
                          ${u.role === 'admin' 
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' 
                            : 'bg-accent3/10 text-accent3 border-accent3/20'}`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-sm">
                        {u.isOnline ? (
                          <div className="flex items-center gap-1.5 text-accent3 font-medium text-xs">
                            <span className="w-2 h-2 rounded-full bg-accent3 inline-block" />
                            Online
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-secondary/60 text-xs">
                            <span className="w-2 h-2 rounded-full bg-secondary/30 inline-block" />
                            Offline
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-secondary">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(u)}
                            className="px-2.5 py-1 bg-secondary/5 border border-main hover:border-accent/40 rounded-lg text-xs font-semibold text-primary hover:text-accent transition-all cursor-pointer"
                          >
                            ✏️ Edit
                          </button>
                          {!isCurrentUser && (
                            <button
                              onClick={() => handleOpenDeleteConfirm(u)}
                              className="px-2.5 py-1 bg-accent2/10 border border-accent2/20 hover:border-accent2/50 hover:bg-accent2/20 rounded-lg text-xs font-semibold text-accent2 transition-all cursor-pointer"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ADD USER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="bg-surface border border-main rounded-2xl w-full max-w-md shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-main flex justify-between items-center bg-secondary/2">
              <h2 className="font-head text-lg font-bold text-primary">Add New User</h2>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 bg-bg hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent transition-all"
                  placeholder="e.g. Jane Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent transition-all"
                  placeholder="e.g. jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent transition-all"
                  placeholder="Minimum 6 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Global Security Role</label>
                <select
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary outline-none focus:border-accent transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <option value="user" className="bg-surface text-primary">Standard User (Read-only access)</option>
                  <option value="admin" className="bg-surface text-primary">Administrator (Full read/write/user access)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-bold py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {actionLoading ? 'Creating User...' : 'Add User'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="bg-surface border border-main rounded-2xl w-full max-w-md shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-main flex justify-between items-center bg-secondary/2">
              <h2 className="font-head text-lg font-bold text-primary">Edit User details</h2>
              <button onClick={() => setShowEditModal(false)} className="w-7 h-7 bg-bg hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
            </div>
            <form onSubmit={handleEditSubmit} className="p-5 space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent transition-all"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary placeholder:text-secondary/40 outline-none focus:border-accent transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-secondary/70 mb-1.5 block">Global Security Role</label>
                <select
                  className="w-full bg-bg border border-main rounded-xl px-4 py-2.5 text-sm text-primary outline-none focus:border-accent transition-all"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  disabled={selectedUser._id === user?._id}
                >
                  <option value="user" className="bg-surface text-primary">Standard User (Read-only access)</option>
                  <option value="admin" className="bg-surface text-primary">Administrator (Full read/write/user access)</option>
                </select>
                {selectedUser._id === user?._id && (
                  <p className="text-[10px] text-yellow-500 mt-1">You cannot demote or modify your own security role.</p>
                )}
              </div>
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gradient-to-r from-accent to-violet-500 text-white text-sm font-head font-bold py-3 rounded-xl hover:-translate-y-0.5 hover:shadow-lg transition-all disabled:opacity-50 mt-2 cursor-pointer"
              >
                {actionLoading ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]" onClick={(e) => e.target === e.currentTarget && setShowDeleteConfirm(false)}>
          <div className="bg-surface border border-accent2/30 rounded-2xl w-full max-w-sm shadow-2xl animate-[modal-in_0.3s_ease] overflow-hidden flex flex-col">
            <div className="p-5 border-b border-accent2/20 bg-accent2/5 flex justify-between items-center">
              <h2 className="font-head text-md font-bold text-accent2">Confirm Delete User</h2>
              <button onClick={() => setShowDeleteConfirm(false)} className="w-7 h-7 bg-bg hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-primary leading-relaxed">
                Are you absolutely sure you want to delete <strong className="text-white">{selectedUser.name}</strong> (<span className="text-secondary">{selectedUser.email}</span>)?
              </p>
              <div className="p-3 bg-accent2/5 border border-accent2/10 rounded-xl text-[11px] text-accent2 leading-relaxed">
                🚨 <strong>Warning:</strong> This action is irreversible. All access for this user will be revoked immediately.
              </div>
              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-secondary/5 hover:bg-secondary/10 border border-main rounded-xl text-sm font-semibold text-secondary hover:text-primary transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-accent2 hover:bg-accent2/80 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {actionLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
