import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useProjectStore from '../store/useProjectStore';
import toast from 'react-hot-toast';

const Toggle = ({ defaultOn = false }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <div
      onClick={() => setOn((o) => !o)}
      className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-200 border
        ${on ? 'bg-accent border-accent' : 'bg-secondary/10 border-main'}`}
    >
      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${on ? 'left-[22px]' : 'left-0.5'}`} />
    </div>
  );
};

const SettingsRow = ({ label, desc, children }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-main last:border-0 hover:bg-secondary/5 transition-colors">
    <div>
      <div className="text-sm font-medium text-primary">{label}</div>
      {desc && <div className="text-xs text-secondary mt-0.5">{desc}</div>}
    </div>
    {children}
  </div>
);

const Settings = ({ theme, toggleTheme }) => {
  const { user } = useAuth();
  const { currentProject, userRole, editProject, removeProject, projects, loadProjects, loading } = useProjectStore();

  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (projects.length === 0 && user) {
      loadProjects(user._id, user);
    }
  }, [projects.length, user]);

  if (loading && projects.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-secondary text-sm">Loading settings...</span>
        </div>
      </div>
    );
  }

  // Sync inputs with currentProject
  useEffect(() => {
    if (currentProject) {
      setProjectName(currentProject.name || '');
      setProjectDesc(currentProject.description || '');
      setProjectColor(currentProject.color || '#6C63FF');
    }
  }, [currentProject]);

  const handleSaveProject = async () => {
    if (!projectName.trim()) {
      return toast.error("Project name cannot be empty");
    }
    setIsSaving(true);
    try {
      await editProject(currentProject._id, {
        name: projectName,
        description: projectDesc,
        color: projectColor,
      });
      toast.success("Project settings saved successfully");
    } catch (err) {
      toast.error("Failed to update project settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (confirm(`Are you absolutely sure you want to permanently delete the project "${currentProject.name}"? This action cannot be undone.`)) {
      try {
        await removeProject(currentProject._id);
        toast.success("Project deleted successfully");
      } catch (err) {
        toast.error("Failed to delete project");
      }
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-[fadeUp_0.4s_ease]">
      <h2 className="font-head text-xl font-bold text-primary mb-5">Settings</h2>

      {/* Project Settings (Only for Project Owner / Admins) */}
      {currentProject && user?.role === 'admin' && (userRole === 'owner' || userRole === 'admin') && (
        <div className="bg-surface border border-main rounded-2xl mb-4 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-main font-head text-sm font-bold text-primary flex items-center gap-2 bg-white/[0.01]">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: currentProject.color }} />
            Project Settings: {currentProject.name}
          </div>
          
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Project Name</label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Enter project name"
                className="w-full px-3 py-2 bg-secondary/5 border border-main rounded-xl text-sm text-primary outline-none focus:border-accent transition-all"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Description</label>
              <textarea
                value={projectDesc}
                onChange={(e) => setProjectDesc(e.target.value)}
                placeholder="Enter project description"
                rows="3"
                className="w-full px-3 py-2 bg-secondary/5 border border-main rounded-xl text-sm text-primary outline-none focus:border-accent transition-all resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-secondary mb-1.5">Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={projectColor}
                  onChange={(e) => setProjectColor(e.target.value)}
                  className="w-10 h-10 bg-transparent border-0 cursor-pointer rounded-lg overflow-hidden"
                />
                <span className="text-xs text-secondary font-mono uppercase">{projectColor}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveProject}
                disabled={isSaving}
                className="px-4 py-2 bg-accent hover:bg-accent/80 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Project Details'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile */}
      <div className="bg-surface border border-main rounded-2xl mb-4 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-main font-head text-sm font-bold text-primary bg-white/[0.01]">Profile</div>
        <SettingsRow label="Display name" desc={user?.name || 'Loading...'}>
          <button onClick={() => toast.success('Edit profile in full version')}
            className="px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-lg text-xs font-semibold hover:bg-accent/25 transition-all">
            Edit
          </button>
        </SettingsRow>
        <SettingsRow label="Email" desc={user?.email || 'N/A'}>
          <span className="text-xs text-secondary">Verified ✓</span>
        </SettingsRow>
        <SettingsRow label="Change password" desc="Update your account password">
          <button onClick={() => toast.success('Reset link sent to your email')}
            className="px-3 py-1.5 bg-accent/15 text-accent border border-accent/30 rounded-lg text-xs font-semibold hover:bg-accent/25 transition-all">
            Reset
          </button>
        </SettingsRow>
      </div>

      {/* Appearance */}
      <div className="bg-surface border border-main rounded-2xl mb-4 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-main font-head text-sm font-bold text-primary bg-white/[0.01]">Appearance</div>
        <SettingsRow label="Dark Mode" desc="Switch between dark and light themes">
          <div
            onClick={toggleTheme}
            className={`w-10 h-6 rounded-full relative cursor-pointer transition-all duration-200 border
              ${theme === 'dark' ? 'bg-accent border-accent' : 'bg-secondary/10 border-main'}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200 ${theme === 'dark' ? 'left-[22px]' : 'left-0.5'}`} />
          </div>
        </SettingsRow>
        <SettingsRow label="Compact Mode" desc="Reduce card padding for more content"><Toggle /></SettingsRow>
        <SettingsRow label="Animations" desc="Enable motion effects"><Toggle defaultOn /></SettingsRow>
      </div>

      {/* Notifications */}
      <div className="bg-surface border border-main rounded-2xl mb-4 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-main font-head text-sm font-bold text-primary bg-white/[0.01]">Notifications</div>
        <SettingsRow label="Task assignments" desc="Get notified when tasks are assigned to you"><Toggle defaultOn /></SettingsRow>
        <SettingsRow label="Comments & mentions" desc="Receive alerts on @mentions"><Toggle defaultOn /></SettingsRow>
        <SettingsRow label="Due date reminders" desc="24h before task deadline"><Toggle /></SettingsRow>
        <SettingsRow label="Email digest" desc="Weekly summary of project activity"><Toggle defaultOn /></SettingsRow>
      </div>

      {/* Danger zone */}
      <div className="bg-surface border border-accent2/20 rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-accent2/20 font-head text-sm font-bold text-accent2 bg-white/[0.01]">Danger Zone</div>
        
        {currentProject && user?.role === 'admin' && (userRole === 'owner') && (
          <SettingsRow label="Delete project" desc={`Permanently delete "${currentProject.name}" and all its tasks`}>
            <button 
              onClick={handleDeleteProject}
              className="px-3 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded-lg text-xs font-semibold hover:bg-accent2/20 transition-all"
            >
              Delete Project
            </button>
          </SettingsRow>
        )}

        <SettingsRow label="Delete account" desc="Permanently remove your account and all data">
          <button onClick={() => toast.error('This action is irreversible')}
            className="px-3 py-1.5 bg-accent2/10 text-accent2 border border-accent2/30 rounded-lg text-xs font-semibold hover:bg-accent2/20 transition-all">
            Delete
          </button>
        </SettingsRow>
      </div>
    </div>
  );
};

export default Settings;
