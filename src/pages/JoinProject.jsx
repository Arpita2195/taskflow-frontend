import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchProjectJoinInfo, joinProject } from '../api/project.api';
import { useAuth } from '../context/AuthContext';
import useProjectStore from '../store/useProjectStore';
import toast from 'react-hot-toast';

const JoinProject = () => {
  const { projectId } = useParams();
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const { user } = useAuth();
  const { setCurrentProject, loadProjects } = useProjectStore();
  const navigate = useNavigate();

  const [projectInfo, setProjectInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const getInfo = async () => {
      try {
        const { data } = await fetchProjectJoinInfo(projectId);
        if (data.success) {
          setProjectInfo(data.project);
        } else {
          toast.error("Failed to load project details");
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Invitation link is invalid or expired");
      } finally {
        setLoading(false);
      }
    };
    if (projectId) getInfo();
  }, [projectId]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const { data } = await joinProject(projectId);
      if (data.success) {
        toast.success(data.message || `Successfully joined ${data.project?.name}!`);
        // Reload all projects to include the newly joined one
        await loadProjects(user._id, user);
        // Set the newly joined project as the current active project
        setCurrentProject(data.project, user._id, user);
        navigate('/board');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to join project");
    } finally {
      setJoining(false);
    }
  };

  const handleGuestRedirect = (dest) => {
    // Save the join path in local storage so auth screens can redirect back here after login/signup
    localStorage.setItem('pendingJoin', `/join/${projectId}${emailParam ? `?email=${emailParam}` : ''}`);
    navigate(dest + (emailParam ? `?email=${encodeURIComponent(emailParam)}` : ''));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-secondary text-sm font-semibold">Loading invitation...</span>
        </div>
      </div>
    );
  }

  if (!projectInfo) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center p-6">
        <div className="bg-surface border border-main rounded-2xl p-8 max-w-md w-full text-center shadow-xl">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="font-head text-xl font-bold text-primary mb-2">Invalid Invitation</h2>
          <p className="text-sm text-secondary mb-6">This invitation link appears to be invalid or has expired. Please contact the project owner for a new invite.</p>
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2.5 bg-secondary/10 hover:bg-secondary/20 border border-main text-primary rounded-xl text-sm font-semibold transition-all"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const initials = projectInfo.owner?.name?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '??';

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden p-6">
      {/* Orbs */}
      <div className="absolute w-96 h-96 bg-accent rounded-full filter blur-[120px] opacity-15 -top-32 -left-32 animate-[float_6s_ease-in-out_infinite]" />
      <div className="absolute w-80 h-80 bg-accent2 rounded-full filter blur-[100px] opacity-15 -bottom-20 -right-20 animate-[float_6s_ease-in-out_infinite_3s]" />

      <div className="relative z-10 bg-surface border border-main rounded-2xl p-8 sm:p-10 w-full max-w-md shadow-2xl animate-[scaleIn_0.4s_ease] text-center">
        {/* Project Icon */}
        <div 
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl shadow-lg mb-6 group-hover:scale-110 transition-all duration-300"
          style={{ 
            background: `linear-gradient(135deg, ${projectInfo.color || '#6C63FF'}dd, ${projectInfo.color || '#6C63FF'})`
          }}
        >
          {projectInfo.icon || '📋'}
        </div>

        <h2 className="font-head text-2xl font-bold text-primary mb-1">Project Invitation</h2>
        <p className="text-sm text-secondary mb-6">You've been invited to collaborate on</p>

        {/* Project Card details */}
        <div className="bg-bg border border-main rounded-2xl p-5 mb-8 text-left">
          <div className="font-head text-lg font-bold text-primary mb-1">{projectInfo.name}</div>
          {projectInfo.description && (
            <p className="text-xs text-secondary/80 line-clamp-2 mb-4 leading-relaxed">{projectInfo.description}</p>
          )}
          
          <div className="flex items-center gap-3 pt-3 border-t border-main/50">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center font-bold text-accent text-xs">
              {initials}
            </div>
            <div>
              <div className="text-[10px] text-secondary/60 uppercase font-bold tracking-wider">Project Owner</div>
              <div className="text-xs font-bold text-primary">{projectInfo.owner?.name}</div>
            </div>
          </div>
        </div>

        {user ? (
          <div className="space-y-4">
            {emailParam && user.email.toLowerCase() !== emailParam.toLowerCase() && (
              <div className="text-xs text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-left leading-normal mb-4">
                ⚠️ This invite was sent to <strong>{emailParam}</strong>, but you are logged in as <strong>{user.email}</strong>.
              </div>
            )}
            <button
              onClick={handleJoin}
              disabled={joining}
              className="w-full py-3.5 bg-gradient-to-r from-accent to-accent2 text-white font-head font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all disabled:opacity-60"
            >
              {joining ? 'Accepting...' : 'Accept Invitation & Join →'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-xs text-secondary hover:text-primary font-semibold transition-all pt-2 block"
            >
              Decline & Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-secondary/5 border border-main rounded-xl text-xs text-secondary leading-relaxed text-left mb-3">
              👉 Sign in to your existing account or create a new account to join this project.
            </div>
            
            <button
              onClick={() => handleGuestRedirect('/register')}
              className="w-full py-3.5 bg-gradient-to-r from-accent to-accent2 text-white font-head font-bold rounded-xl hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/30 transition-all"
            >
              Create Account to Join
            </button>
            
            <button
              onClick={() => handleGuestRedirect('/login')}
              className="w-full py-3.5 bg-secondary/5 hover:bg-secondary/10 border border-main text-primary font-head font-bold rounded-xl transition-all"
            >
              Sign In to Join
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinProject;
