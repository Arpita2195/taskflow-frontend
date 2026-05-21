import { useMemo } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import useTaskStore from '../../store/useTaskStore';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const CalendarBoard = ({ onTaskClick }) => {
  const { tasks } = useTaskStore();

  const events = useMemo(() => {
    return tasks
      .filter((task) => task.dueDate && !task.isArchived)
      .map((task) => {
        // Due date usually represents the end of the day or a specific time.
        // For a simple view, we'll make it an all-day event or span an hour.
        const startDate = new Date(task.dueDate);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

        return {
          id: task._id,
          title: task.title,
          start: startDate,
          end: endDate,
          task: task, // store full task for custom rendering
        };
      });
  }, [tasks]);

  const eventStyleGetter = (event) => {
    const task = event.task;
    let backgroundColor = 'var(--color-accent)'; // Default purple
    
    // Customize color based on priority
    if (task.priority === 'high') {
      backgroundColor = '#ef4444'; // Red
    } else if (task.priority === 'medium') {
      backgroundColor = '#f59e0b'; // Amber
    } else if (task.priority === 'low') {
      backgroundColor = '#10b981'; // Green
    }

    // Or use task label color if it exists
    if (task.labelColor) {
        backgroundColor = task.labelColor;
    }

    return {
      style: {
        backgroundColor,
        borderRadius: '8px',
        opacity: 0.9,
        color: '#fff',
        border: '0px',
        display: 'block',
        fontSize: '12px',
        fontWeight: 'bold',
        padding: '2px 6px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      },
    };
  };

  return (
    <div className="h-full w-full p-6 bg-surface overflow-auto relative">
      {events.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50 z-10">
           <div className="text-center text-gray-400 font-head">
              <span className="text-4xl block mb-2">📅</span>
              No tasks with due dates found.
           </div>
        </div>
      )}
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%', minHeight: '600px', fontFamily: 'var(--font-body)' }}
        onSelectEvent={(event) => onTaskClick(event.task)}
        eventPropGetter={eventStyleGetter}
        views={['month', 'week', 'day', 'agenda']}
        defaultView="month"
        popup
        className="custom-calendar"
      />
    </div>
  );
};

export default CalendarBoard;
