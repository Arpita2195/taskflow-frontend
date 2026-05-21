import { useEffect, useState } from 'react';
import useTaskStore from '../../store/useTaskStore';
import useProjectStore from '../../store/useProjectStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

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

const getBarColor = (task) => {
  if (task.column === 'Done') return 'from-emerald-500/70 to-teal-500/70 hover:from-emerald-500/80 hover:to-teal-500/80';
  if (task.column === 'Review') return 'from-amber-500/70 to-orange-500/70 hover:from-amber-500/80 hover:to-orange-500/80';
  if (task.column === 'In Progress') return 'from-indigo-500/70 to-purple-500/70 hover:from-indigo-500/80 hover:to-purple-500/80';
  return 'from-slate-600/70 to-slate-500/70 hover:from-slate-600/80 hover:to-slate-500/80';
};

const getMonthHeaders = (days) => {
  const headers = [];
  if (days.length === 0) return headers;
  
  let currentMonth = days[0].getMonth();
  let currentYear = days[0].getFullYear();
  let count = 0;
  
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    if (day.getMonth() === currentMonth && day.getFullYear() === currentYear) {
      count++;
    } else {
      headers.push({
        label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        daysCount: count
      });
      currentMonth = day.getMonth();
      currentYear = day.getFullYear();
      count = 1;
    }
  }
  
  headers.push({
    label: new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    daysCount: count
  });
  return headers;
};

const getDaysDiff = (d1, d2) => {
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const TimelineView = ({ projectId, onTaskClick, filter }) => {
  const { tasks, loadTasks, onTaskCreated, onTaskUpdated, onTaskMoved, onTaskDeleted } = useTaskStore();
  const { user } = useAuth();
  const { socket } = useSocket();

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

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'My Tasks') return t.assignees?.some((a) => a._id === user?._id || a === user?._id);
    if (filter === '🔴 High Priority') return t.priority === 'high';
    if (filter === '⏰ Overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'Done';
    return true;
  });

  const getTaskDates = (task) => {
    const start = task.createdAt ? new Date(task.createdAt) : new Date();
    let end;
    if (task.dueDate) {
      end = new Date(task.dueDate);
    } else {
      end = new Date(start);
      end.setDate(end.getDate() + 3);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    if (end < start) end = new Date(start);
    return { start, end };
  };

  // Determine overall range bounds
  let minDate = new Date();
  minDate.setDate(minDate.getDate() - 3);
  let maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  if (filteredTasks.length > 0) {
    const startDates = filteredTasks.map(t => getTaskDates(t).start.getTime());
    const endDates = filteredTasks.map(t => getTaskDates(t).end.getTime());
    const minTaskStart = new Date(Math.min(...startDates));
    const maxTaskEnd = new Date(Math.max(...endDates));

    minTaskStart.setDate(minTaskStart.getDate() - 3);
    maxTaskEnd.setDate(maxTaskEnd.getDate() + 7);

    minDate = minTaskStart;
    maxDate = maxTaskEnd;
  }

  minDate.setHours(0, 0, 0, 0);
  maxDate.setHours(0, 0, 0, 0);

  // Bound range to max 90 days to maintain performant grid layout
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
  if (maxDate.getTime() - minDate.getTime() > maxRangeMs) {
    maxDate = new Date(minDate.getTime() + maxRangeMs);
  }

  // Generate date array
  const days = [];
  let current = new Date(minDate);
  while (current <= maxDate) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = getDaysDiff(minDate, today);
  const showTodayLine = todayOffset >= 0 && todayOffset < days.length;

  return (
    <div className="flex-1 overflow-auto p-6 bg-bg/20 min-h-full">
      {filteredTasks.length === 0 ? (
        <div className="text-center text-secondary py-20 bg-surface/30 border border-main rounded-2xl">
          <div className="text-5xl mb-4 opacity-40">📊</div>
          <div className="font-head text-lg font-bold text-primary mb-2">No tasks found</div>
          <div className="text-sm text-secondary/60">Add a task or adjust filters to view the timeline.</div>
        </div>
      ) : (
        <div className="w-full bg-surface/50 border border-main rounded-2xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col">
          <div className="overflow-auto max-h-[calc(100vh-270px)] no-scrollbar">
            <div className="relative flex flex-col" style={{ minWidth: `${280 + days.length * 48}px` }}>
              
              {/* Header */}
              <div className="flex border-b border-main bg-white/[0.02] select-none">
                <div className="sticky left-0 z-30 w-[280px] min-w-[280px] bg-[#141822] border-r border-main p-4 flex items-center font-bold text-xs uppercase tracking-widest text-secondary/80">
                  Task & Details
                </div>
                <div className="flex flex-col flex-1">
                  <div className="flex border-b border-white/5 h-8 text-[11px] font-bold text-secondary/80 bg-[#161a26]">
                    {getMonthHeaders(days).map((m, i) => (
                      <div 
                        key={i} 
                        className="flex items-center px-3 border-r border-white/5 truncate"
                        style={{ width: `${m.daysCount * 48}px` }}
                      >
                        {m.label}
                      </div>
                    ))}
                  </div>
                  <div className="flex h-10 text-[10px] font-semibold text-secondary bg-[#12151f]">
                    {days.map((day, idx) => {
                      const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                      const isCurrentDay = day.toDateString() === new Date().toDateString();
                      return (
                        <div 
                          key={idx} 
                          className={`flex flex-col items-center justify-center w-12 min-w-[48px] border-r border-white/5 
                            ${isWeekend ? 'bg-white/[0.01]' : ''} 
                            ${isCurrentDay ? 'bg-accent/15 text-accent font-bold border-b border-accent/45' : ''}`}
                        >
                          <span className="opacity-80">{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</span>
                          <span className="text-xs mt-0.5">{day.getDate()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-main relative bg-surface/20">
                {showTodayLine && (
                  <div 
                    className="absolute border-l-2 border-dashed border-accent2/50 top-0 bottom-0 pointer-events-none z-20"
                    style={{ left: `${280 + todayOffset * 48 + 24}px` }}
                    title="Today"
                  />
                )}
                
                {filteredTasks.map((t) => {
                  const { start, end } = getTaskDates(t);
                  
                  // Compute alignment offsets
                  let offsetDays = getDaysDiff(minDate, start);
                  let durationDays = getDaysDiff(start, end) + 1;
                  
                  // Adjust display if task begins prior to timeline start boundary
                  if (offsetDays < 0) {
                    durationDays = Math.max(0, durationDays + offsetDays);
                    offsetDays = 0;
                  }
                  
                  // Cut-off duration if task stretches beyond timeline end boundary
                  if (offsetDays + durationDays > days.length) {
                    durationDays = Math.max(0, days.length - offsetDays);
                  }

                  const leftOffset = offsetDays * 48;
                  const barWidth = durationDays * 48;

                  return (
                    <div key={t._id} className="flex hover:bg-white/[0.01] transition-all group/row h-[64px] items-center">
                      <div className="sticky left-0 z-30 w-[280px] min-w-[280px] bg-[#141822] border-r border-main p-4 flex flex-col justify-center gap-1.5 h-full">
                        <span 
                          className="font-head text-sm font-bold text-primary truncate hover:text-accent transition-colors cursor-pointer"
                          onClick={() => onTaskClick(t)}
                        >
                          {t.title}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${STATUS_COLOR[t.column]}`}>
                            {t.column}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider capitalize ${PRIORITY_COLOR[t.priority]}`}>
                            {t.priority}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 relative flex items-center h-full">
                        {/* Grid Columns */}
                        <div className="absolute inset-0 flex pointer-events-none">
                          {days.map((day, idx) => {
                            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
                            return (
                              <div 
                                key={idx}
                                className={`w-12 border-r border-white/5 h-full ${isWeekend ? 'bg-white/[0.01]' : ''}`}
                              />
                            );
                          })}
                        </div>

                        {/* Task Bar */}
                        {barWidth > 0 && (
                          <div 
                            className={`absolute h-9 rounded-lg border flex items-center px-3 text-xs font-bold text-white shadow-lg cursor-pointer transition-all hover:scale-[1.01] border-white/10 group/bar bg-gradient-to-r ${getBarColor(t)}`}
                            style={{
                              left: `${leftOffset}px`,
                              width: `${barWidth}px`,
                            }}
                            onClick={() => onTaskClick(t)}
                          >
                            <div 
                              className="absolute left-0 top-0 bottom-0 bg-white/15 transition-all rounded-l-lg pointer-events-none"
                              style={{ width: `${t.progress}%`, borderTopRightRadius: t.progress === 100 ? '0.5rem' : '0', borderBottomRightRadius: t.progress === 100 ? '0.5rem' : '0' }}
                            />
                            
                            <span className="relative z-10 truncate pr-1">
                              {t.title}
                            </span>
                            <span className="relative z-10 ml-auto bg-black/35 px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap">
                              {t.progress}%
                            </span>

                            {/* Custom Gantt Tooltip */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-[#1A1F2C] border border-white/10 rounded-xl p-3 opacity-0 group-hover/bar:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-2xl text-xs font-medium">
                              <div className="font-bold text-primary mb-1.5 truncate border-b border-white/5 pb-1">{t.title}</div>
                              <div className="space-y-1 text-secondary/90">
                                <div className="flex justify-between">
                                  <span>Status:</span>
                                  <span className="text-primary font-semibold">{t.column}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Priority:</span>
                                  <span className="text-primary font-semibold capitalize">{t.priority}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Start:</span>
                                  <span className="text-primary font-semibold">{start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>End:</span>
                                  <span className="text-primary font-semibold">{end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                                  <span>Progress:</span>
                                  <span className="text-accent font-bold">{t.progress}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineView;
