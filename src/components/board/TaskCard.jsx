import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const PRIORITY_COLOR = {
  high: 'bg-accent2/20 text-accent2',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-accent3/20 text-accent3',
};

const PRIORITY_ICON = { high: '🔴', medium: '🟡', low: '🟢' };

const TaskCard = ({ task, onClick, isDragging }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  const today = new Date().toISOString().slice(0, 10);
  const overdue = task.dueDate?.slice(0, 10) < today && task.column !== 'Done';
  const done = task.checklist?.filter((c) => c.done).length || 0;
  const total = task.checklist?.length || 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`group relative bg-surface border border-main rounded-xl p-4 cursor-pointer
        transition-all duration-200 select-none
        hover:-translate-y-0.5 hover:border-main hover:shadow-lg
        ${isDragging ? 'rotate-1 scale-95 shadow-xl' : ''}
        animate-[card-enter_0.3s_ease_both]`}
    >
      {/* Priority bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 rounded-t-xl opacity-0 group-hover:opacity-100 transition-opacity
          ${task.priority === 'high' ? 'bg-accent2' : task.priority === 'medium' ? 'bg-yellow-500' : 'bg-accent3'}`}
      />

      {/* Label + priority */}
      <div className="flex items-start gap-2 mb-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: task.labelColor, color: task.labelTextColor }}
        >
          {task.label}
        </span>
        <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full font-semibold ${PRIORITY_COLOR[task.priority]}`}>
          {PRIORITY_ICON[task.priority]} {task.priority}
        </span>
      </div>

      {/* Title */}
      <div className="font-head text-sm font-semibold text-primary leading-snug mb-2">{task.title}</div>

      {/* Description */}
      {task.description && (
        <div className="text-xs text-secondary line-clamp-2 mb-3 leading-relaxed">{task.description}</div>
      )}

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-secondary mb-3">
        {task.dueDate && (
          <span className={overdue ? 'text-accent2 font-medium' : ''}>
            📅 {task.dueDate?.slice(0, 10)}
          </span>
        )}
        {total > 0 && <span>✅ {done}/{total}</span>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex">
          {(task.assignees || []).slice(0, 3).map((user, i) => (
            <div
              key={user._id || i}
              className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white border-2 border-surface"
              style={{ background: '#6C63FF', marginLeft: i > 0 ? '-7px' : 0 }}
            >
              {user.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
          ))}
        </div>
        {task.progress > 0 && (
          <span className="text-xs text-accent font-bold">{task.progress}%</span>
        )}
      </div>

      {/* Progress bar */}
      {task.progress > 0 && (
        <div className="mt-2 h-1 bg-secondary/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent3 transition-all duration-700"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
