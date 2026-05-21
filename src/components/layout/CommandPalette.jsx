import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useProjectStore from '../../store/useProjectStore';
import useTaskStore from '../../store/useTaskStore';

const CommandPalette = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const { projects, setCurrentProject } = useProjectStore();
  const { tasks } = useTaskStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        isOpen ? onClose() : null; // Logic handled in parent
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div 
        className="w-full max-w-xl bg-surface border border-main rounded-2xl shadow-2xl overflow-hidden animate-[scaleIn_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-main">
          <span className="text-xl">🔍</span>
          <input
            autoFocus
            type="text"
            placeholder="Search projects or tasks..."
            className="flex-1 bg-transparent outline-none text-primary placeholder:text-secondary/40"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="px-2 py-0.5 rounded bg-secondary/5 border border-main text-[10px] text-secondary font-bold">ESC</kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length > 0 && (
            <>
              {filteredProjects.length > 0 && (
                <div className="mb-2">
                  <div className="px-3 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest">Projects</div>
                  {filteredProjects.map(p => (
                    <div
                      key={p._id}
                      onClick={() => { setCurrentProject(p); navigate('/board'); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/5 cursor-pointer group transition-all"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                      <span className="text-sm text-secondary group-hover:text-primary">{p.name}</span>
                    </div>
                  ))}
                </div>
              )}

              {filteredTasks.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold text-secondary uppercase tracking-widest">Tasks</div>
                  {filteredTasks.map(t => (
                    <div
                      key={t._id}
                      onClick={() => { navigate(`/board?task=${t._id}`); onClose(); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary/5 cursor-pointer group transition-all"
                    >
                      <span className="text-lg opacity-40">📋</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-secondary group-hover:text-primary truncate">{t.title}</div>
                        <div className="text-[10px] text-secondary/60 font-bold uppercase">{t.column}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {filteredProjects.length === 0 && filteredTasks.length === 0 && (
                <div className="py-12 text-center">
                  <div className="text-4xl mb-3 opacity-20">🕵️‍♂️</div>
                  <div className="text-sm text-secondary italic">No results found for "{query}"</div>
                </div>
              )}
            </>
          )}

          {!query && (
            <div className="py-12 text-center text-secondary">
              <div className="text-sm">Start typing to search projects and tasks...</div>
              <div className="text-xs mt-1 text-secondary/60">Quickly jump to anything in TaskFlow</div>
            </div>
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={onClose} />
    </div>
  );
};

export default CommandPalette;
