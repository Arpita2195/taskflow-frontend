import { useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useState } from 'react';
import Column from './Column';
import TaskCard from './TaskCard';
import useTaskStore from '../../store/useTaskStore';
import useProjectStore from '../../store/useProjectStore';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'Backlog', color: '#8b8fa8' },
  { id: 'In Progress', color: '#6C63FF' },
  { id: 'Review', color: '#f59e0b' },
  { id: 'Done', color: '#43E97B' },
];

const KanbanBoard = ({ projectId, onTaskClick, filter }) => {
  const { tasks, loadTasks, relocateTask, onTaskCreated, onTaskUpdated, onTaskMoved, onTaskDeleted } = useTaskStore();
  const { user } = useAuth();
  const { userRole } = useProjectStore();
  const { socket } = useSocket();
  const [activeTask, setActiveTask] = useState(null);

  const isReadOnly = userRole === 'viewer' || user?.role !== 'admin';

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 3 } }));

  useEffect(() => {
    if (projectId) loadTasks(projectId);
  }, [projectId]);

  // Socket real-time
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

  const handleDragStart = ({ active }) => {
    if (isReadOnly) return;
    setActiveTask(tasks.find((t) => t._id === active.id));
  };

  const handleDragEnd = ({ active, over }) => {
    setActiveTask(null);
    if (!over) return;
    const task = tasks.find((t) => t._id === active.id);
    const newColumn = over.id;
    if (task && COLUMNS.find((c) => c.id === newColumn) && task.column !== newColumn) {
      relocateTask(task._id, newColumn, 0);
      toast.success(`Moved to ${newColumn}`);
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'My Tasks') return t.assignees?.some(a => a._id === user?._id || a === user?._id);
    if (filter === '🔴 High Priority') return t.priority === 'high';
    if (filter === '⏰ Overdue') return t.dueDate && new Date(t.dueDate) < new Date() && t.column !== 'Done';
    return true;
  });

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-6 overflow-x-auto h-full items-start no-scrollbar">
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            column={col}
            tasks={filteredTasks.filter((t) => t.column === col.id)}
            onTaskClick={onTaskClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
