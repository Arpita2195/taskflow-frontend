import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import useProjectStore from '../store/useProjectStore';
import useTaskStore from '../store/useTaskStore';

const Dashboard = () => {
  const { user } = useAuth();
  const { projects, loadProjects } = useProjectStore();
  const { tasks, loadTasks, loadAllTasks } = useTaskStore();

  useEffect(() => {
    if (user) {
      loadProjects(user._id, user);
    }
  }, [user]);

  useEffect(() => {
    if (projects.length > 0) {
      loadAllTasks(projects.map(p => p._id));
    }
  }, [projects, loadAllTasks]);

  const done = tasks.filter((t) => t.column === 'Done').length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.dueDate?.slice(0, 10) < today && t.column !== 'Done').length;

  const stats = [
    { icon: '📋', value: tasks.length, label: 'Total Tasks', color: 'rgba(108,99,255,0.12)' },
    { icon: '✅', value: done, label: 'Completed', color: 'rgba(67,233,123,0.12)' },
    { icon: '⚠️', value: overdue, label: 'Overdue', color: 'rgba(255,101,132,0.12)' },
    { icon: '👥', value: projects.length, label: 'Projects', color: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 animate-[fadeUp_0.4s_ease]">
      <div className="mb-6">
        <h2 className="font-head text-2xl font-bold text-primary mb-1">
          Good morning, {user?.name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-secondary">Here's what's happening across your projects today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:gap-4 mb-6">
        {stats.map((s, i) => (
          <div
            key={i}
            className="bg-surface border border-main rounded-2xl p-5 hover:-translate-y-1 hover:shadow-lg transition-all duration-200 animate-[fadeUp_0.4s_ease_both]"
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4" style={{ background: s.color }}>
              {s.icon}
            </div>
            <div className="font-head text-3xl font-extrabold text-primary mb-1">{s.value}</div>
            <div className="text-xs text-secondary font-medium">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Project Progress */}
        <div className="bg-surface border border-main rounded-2xl p-5">
          <div className="font-head text-sm font-bold text-primary mb-4">Project Progress</div>
          {projects.length === 0 ? (
            <div className="text-center text-secondary py-8">No projects yet. Create one!</div>
          ) : (
            projects.map((p) => {
              const ptasks = tasks.filter((t) => t.project === p._id || t.project?._id === p._id);
              const pdone = ptasks.filter((t) => t.column === 'Done').length;
              const totalProgress = ptasks.reduce((sum, t) => sum + (t.progress || 0), 0);
              const pct = ptasks.length ? Math.round(totalProgress / ptasks.length) : 0;
              return (
                <div key={p._id} className="py-3 border-b border-main last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      {p.name}
                    </div>
                    <span className="text-xs font-bold text-secondary">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary/10 rounded-full overflow-hidden mb-1.5">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: p.color }} />
                  </div>
                  <div className="text-xs text-secondary">{pdone}/{ptasks.length} tasks · {p.description}</div>
                </div>
              );
            })
          )}
        </div>

        {/* Due soon */}
        <div className="bg-surface border border-main rounded-2xl p-5">
          <div className="font-head text-sm font-bold text-primary mb-4">Due Soon</div>
          {tasks
            .filter((t) => t.column !== 'Done')
            .sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
            .slice(0, 5)
            .map((t, i) => {
              const isOverdue = t.dueDate?.slice(0, 10) < today;
              return (
                <div key={t._id} className="flex gap-3 py-2.5 border-b border-main last:border-0 animate-[slideIn_0.3s_ease_both]" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {t.assignees?.[0]?.name?.slice(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-primary truncate">{t.title}</div>
                    <div className={`text-xs mt-0.5 ${isOverdue ? 'text-accent2 font-medium' : 'text-secondary'}`}>
                      {t.dueDate?.slice(0, 10)} · {t.priority}
                    </div>
                  </div>
                </div>
              );
            })}
          {tasks.filter((t) => t.column !== 'Done').length === 0 && (
            <div className="text-center text-secondary py-6 text-sm">All tasks completed! 🎉</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
