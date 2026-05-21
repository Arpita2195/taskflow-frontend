import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskCard from './TaskCard';

const Column = ({ column, tasks, onTaskClick }) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div className="flex-shrink-0 w-72 flex flex-col gap-0">
      {/* Column Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: column.color }} />
        <span className="font-head text-xs font-bold uppercase tracking-widest text-secondary">{column.id}</span>
        <span className="ml-auto text-xs font-bold bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2.5 min-h-16 rounded-xl transition-all duration-200 p-1
          ${isOver ? 'bg-accent/5 outline-2 outline-dashed outline-accent/30 outline-offset-2' : ''}`}
      >
        <SortableContext items={tasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task, i) => (
            <TaskCard key={task._id} task={task} index={i} onClick={() => onTaskClick(task)} />
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div className="text-center py-8 text-secondary text-sm">Drop tasks here</div>
        )}
      </div>
    </div>
  );
};

export default Column;
