import { useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Area, Line, ComposedChart
} from 'recharts';
import useTaskStore from '../store/useTaskStore';
import useProjectStore from '../store/useProjectStore';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const COLORS = ['#6C63FF', '#43E97B', '#f59e0b', '#FF6584'];

const Reports = () => {
  const { tasks, loadTasks } = useTaskStore();
  const { currentProject, projects, loadProjects, loading } = useProjectStore();
  const { user } = useAuth();

  useEffect(() => {
    if (projects.length === 0 && user) {
      loadProjects(user._id, user);
    }
  }, [projects.length, user]);

  useEffect(() => {
    if (currentProject?._id) {
      loadTasks(currentProject._id);
    }
  }, [currentProject?._id]);

  const projectTasks = useMemo(() => {
    return tasks.filter(t => (t.project?._id || t.project) === currentProject?._id);
  }, [tasks, currentProject?._id]);

  const statusData = useMemo(() => {
    const counts = { Backlog: 0, 'In Progress': 0, Review: 0, Done: 0 };
    projectTasks.forEach(t => { if (counts[t.column] !== undefined) counts[t.column]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projectTasks]);

  const priorityData = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 };
    projectTasks.forEach(t => { if (counts[t.priority] !== undefined) counts[t.priority]++; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [projectTasks]);

  const burndownData = useMemo(() => {
    const data = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Generate dates for the past 7 days
    const dates = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d);
    }
    
    dates.forEach(date => {
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      let totalCreated = 0;
      let totalCompleted = 0;
      
      projectTasks.forEach(t => {
        const createdDate = t.createdAt ? new Date(t.createdAt) : new Date(0);
        if (createdDate <= dayEnd) {
          totalCreated++;
          if (t.column === 'Done') {
            const completedDate = t.updatedAt ? new Date(t.updatedAt) : new Date();
            if (completedDate <= dayEnd) {
              totalCompleted++;
            }
          }
        }
      });
      
      const remaining = totalCreated - totalCompleted;
      
      data.push({
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        remaining: Math.max(0, remaining),
        completed: totalCompleted,
      });
    });
    
    return data;
  }, [projectTasks]);

  const kpis = useMemo(() => {
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.column === 'Done').length;
    const inProgress = projectTasks.filter(t => t.column === 'In Progress').length;
    
    const now = new Date();
    const overdue = projectTasks.filter(t => {
      if (!t.dueDate || t.column === 'Done') return false;
      return new Date(t.dueDate) < now;
    }).length;

    const rate = total ? Math.round((completed / total) * 100) : 0;

    return { total, completed, inProgress, overdue, rate };
  }, [projectTasks]);

  const memberPerformanceData = useMemo(() => {
    if (!currentProject) return [];
    const membersList = [
      { id: currentProject.owner?._id || currentProject.owner, name: currentProject.owner?.name || 'Owner' },
      ...(currentProject.members || []).map(m => ({ id: m.user?._id || m.user, name: m.user?.name || 'Member' }))
    ];

    return membersList.map(m => {
      const memberTasks = projectTasks.filter(t => t.assignees?.some(a => (a._id || a) === m.id));
      const doneTasks = memberTasks.filter(t => t.column === 'Done').length;
      return {
        name: m.name,
        assigned: memberTasks.length,
        completed: doneTasks,
      };
    });
  }, [projectTasks, currentProject]);

  const handleExportCSV = () => {
    if (projectTasks.length === 0) {
      return toast.error("No tasks to export");
    }

    const headers = ["Title", "Description", "Column (Status)", "Priority", "Progress (%)", "Label", "Due Date", "Assignees", "Created Date"];
    
    const rows = projectTasks.map(t => {
      const title = `"${(t.title || '').replace(/"/g, '""')}"`;
      const desc = `"${(t.description || '').replace(/<[^>]*>/g, '').replace(/"/g, '""')}"`;
      const column = `"${t.column || 'Backlog'}"`;
      const priority = `"${t.priority || 'medium'}"`;
      const progress = t.progress !== undefined ? t.progress : 0;
      const label = `"${t.label || ''}"`;
      const dueDate = t.dueDate ? `"${new Date(t.dueDate).toISOString().slice(0, 10)}"` : '""';
      const assignees = `"${(t.assignees || []).map(a => a.name).join(', ').replace(/"/g, '""')}"`;
      const created = t.createdAt ? `"${new Date(t.createdAt).toISOString().slice(0, 10)}"` : '""';
      
      return [title, desc, column, priority, progress, label, dueDate, assignees, created];
    });

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${currentProject.name.toLowerCase().replace(/\s+/g, '_')}_tasks_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report exported successfully!");
  };

  if (loading && !currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-secondary text-sm">Loading project reports...</span>
        </div>
      </div>
    );
  }

  if (!currentProject) return (
    <div className="flex-1 flex items-center justify-center text-gray-500 italic">
      Please select a project to see reports.
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 animate-[fadeUp_0.4s_ease]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-main pb-4">
        <div>
          <h2 className="font-head text-2xl font-bold text-primary mb-1">Project Reports</h2>
          <p className="text-sm text-secondary">Analytics for {currentProject.name}</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-accent/10 border border-accent/20 rounded-xl text-sm font-semibold text-accent hover:bg-accent/20 transition-all sm:self-start"
        >
          📥 Export CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Tasks', val: kpis.total, icon: '📋', color: 'from-[#6C63FF]/10 to-[#6C63FF]/5', border: 'border-[#6C63FF]/20', text: 'text-[#8c85ff]' },
          { label: 'Completed Tasks', val: `${kpis.completed} (${kpis.rate}%)`, icon: '✅', color: 'from-[#43E97B]/10 to-[#43E97B]/5', border: 'border-[#43E97B]/20', text: 'text-[#5df28f]', isProgress: true },
          { label: 'In Progress', val: kpis.inProgress, icon: '⚡', color: 'from-[#f59e0b]/10 to-[#f59e0b]/5', border: 'border-[#f59e0b]/20', text: 'text-[#fbbf24]' },
          { label: 'Overdue Tasks', val: kpis.overdue, icon: '⏰', color: `from-[#FF6584]/${kpis.overdue ? '15' : '10'} to-[#FF6584]/5`, border: `border-[#FF6584]/${kpis.overdue ? '30' : '20'}`, text: kpis.overdue ? 'text-red-400 font-bold' : 'text-[#ff8ca3]' },
        ].map((kpi, idx) => (
          <div key={idx} className={`bg-gradient-to-br ${kpi.color} border ${kpi.border} rounded-2xl p-5 hover:scale-[1.02] transition-all flex flex-col justify-between h-28 relative overflow-hidden group`}>
            <div className="absolute top-2 right-2 text-2xl opacity-15 group-hover:scale-125 group-hover:opacity-25 transition-all">{kpi.icon}</div>
            <div className="text-[10px] text-secondary uppercase font-bold tracking-widest">{kpi.label}</div>
            <div className="mt-2">
              <div className={`text-xl font-bold ${kpi.text}`}>{kpi.val}</div>
              {kpi.isProgress && (
                <div className="w-full h-1 bg-secondary/10 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#43E97B]" style={{ width: `${kpis.rate}%` }} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Status Distribution */}
        <div className="bg-surface border border-main rounded-2xl p-6">
          <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Status Distribution</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--color-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-4">
            {statusData.map((s, i) => (
              <div key={s.name} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-secondary uppercase font-bold">{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Analysis */}
        <div className="bg-surface border border-main rounded-2xl p-6">
          <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Priority Breakdown</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-border)' }}
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
                <Bar dataKey="value" fill="#6C63FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Burndown Chart */}
        <div className="bg-surface border border-main rounded-2xl p-6">
          <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Weekly Burndown</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={burndownData}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#43E97B" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#43E97B" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="day" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="completed" stroke="#43E97B" fillOpacity={1} fill="url(#colorComp)" strokeWidth={3} />
                <Line type="monotone" dataKey="remaining" stroke="#6C63FF" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Member Workload & Performance */}
        <div className="bg-surface border border-main rounded-2xl p-6">
          <div className="text-sm font-bold text-secondary uppercase tracking-widest mb-6">Member Workload & Performance</div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="#555" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'var(--color-border)' }}
                  contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px' }}
                />
                <Bar dataKey="assigned" fill="#6C63FF" name="Assigned Tasks" radius={[4, 4, 0, 0]} />
                <Bar dataKey="completed" fill="#43E97B" name="Completed Tasks" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
