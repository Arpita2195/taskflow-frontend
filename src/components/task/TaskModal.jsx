import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { fetchTask } from '../../api/task.api';
import { fetchComments, addComment } from '../../api/comment.api';
import { fetchActivities } from '../../api/activity.api';
import useTaskStore from '../../store/useTaskStore';
import useProjectStore from '../../store/useProjectStore';
import toast from 'react-hot-toast';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { useAuth } from '../../context/AuthContext';

const TaskModal = ({ taskId, onClose }) => {
  const { editTask } = useTaskStore();
  const { userRole } = useProjectStore();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [activities, setActivities] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState('comments'); // 'comments' or 'history'
  const [isCommenting, setIsCommenting] = useState(false);

  const isReadOnly = userRole === 'viewer' || user?.role !== 'admin';
  const isAssignee = task?.assignees?.some(a => (a._id || a).toString() === user?._id?.toString());
  const canEditChecklist = !isReadOnly || isAssignee;

  useEffect(() => {
    if (!taskId) return;
    fetchTask(taskId).then(({ data }) => setTask(data.task));
    fetchComments(taskId).then(({ data }) => setComments(data.comments));
    fetchActivities({ task: taskId }).then(({ data }) => setActivities(data.activities));
  }, [taskId]);

  const handleUpdate = async (field, value) => {
    if (isReadOnly && field !== 'progress') return;
    setTask((prev) => ({ ...prev, [field]: value }));
    await editTask(taskId, { [field]: value });
  };

  const handleChecklistToggle = async (index) => {
    if (!canEditChecklist) return;
    const newChecklist = [...task.checklist];
    newChecklist[index].done = !newChecklist[index].done;
    
    // Auto-calculate progress
    const doneCount = newChecklist.filter(item => item.done).length;
    const progress = Math.round((doneCount / newChecklist.length) * 100);
    
    setTask((prev) => ({ ...prev, checklist: newChecklist, progress }));
    await editTask(taskId, { checklist: newChecklist, progress });
  };

  const addChecklistItem = async (text) => {
    if (!text.trim() || !canEditChecklist) return;
    const newChecklist = [...(task.checklist || []), { text, done: false }];
    
    // Auto-calculate progress
    const doneCount = newChecklist.filter(item => item.done).length;
    const progress = Math.round((doneCount / newChecklist.length) * 100);

    setTask((prev) => ({ ...prev, checklist: newChecklist, progress }));
    await editTask(taskId, { checklist: newChecklist, progress });
  };

  const removeChecklistItem = async (index) => {
    if (!canEditChecklist) return;
    const newChecklist = task.checklist.filter((_, i) => i !== index);
    
    // Auto-calculate progress
    const progress = newChecklist.length > 0 
      ? Math.round((newChecklist.filter(item => item.done).length / newChecklist.length) * 100)
      : 0;

    setTask((prev) => ({ ...prev, checklist: newChecklist, progress }));
    await editTask(taskId, { checklist: newChecklist, progress });
  };

  const handleComment = async () => {
    if (!commentText.trim() || isCommenting) return;
    setIsCommenting(true);
    try {
      const { data } = await addComment({ task: taskId, text: commentText });
      setComments((prev) => [...prev, data.comment]);
      setCommentText('');
      toast.success('Successfully added comment!', {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: 'var(--color-bg)',
          color: 'var(--color-text)',
        },
      });
    } catch (err) {
      toast.error('Failed to add comment');
    } finally {
      setIsCommenting(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || isReadOnly) return;

    const formData = new FormData();
    formData.append('file', file);

    const loadingToast = toast.loading('Uploading...');
    try {
      const { data } = await api.post(`/tasks/${taskId}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTask((prev) => ({ ...prev, attachments: [...(prev.attachments || []), data.attachment] }));
      toast.success('File uploaded', { id: loadingToast });
    } catch (err) {
      toast.error('Upload failed', { id: loadingToast });
    }
  };

  const handleLinkAdd = async () => {
    const url = prompt('Enter link URL (include http/https):');
    if (!url) return;
    const name = prompt('Enter link name (optional):');

    const loadingToast = toast.loading('Adding link...');
    try {
      const { data } = await api.post(`/tasks/${taskId}/links`, { url, name });
      setTask((prev) => ({ ...prev, attachments: [...(prev.attachments || []), data.attachment] }));
      toast.success('Link added', { id: loadingToast });
    } catch (err) {
      toast.error('Failed to add link', { id: loadingToast });
    }
  };

  const handleSummarize = async () => {
    const loadingToast = toast.loading('AI is thinking...');
    try {
      const { data } = await api.get(`/ai/summarize/${taskId}`);
      setTask((prev) => ({ ...prev, aiSummary: data.summary }));
      toast.success('Summary generated', { id: loadingToast });
    } catch (err) {
      toast.error('AI error', { id: loadingToast });
    }
  };

  const getAttachmentIcon = (at) => {
    if (at.type === 'link') return '🔗';
    const ext = at.name?.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
    if (['mp4', 'mov', 'webm'].includes(ext)) return '🎬';
    return '📄';
  };

  if (!task) return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-main rounded-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-[modal-in_0.3s_ease]">
        {/* Header */}
        <div className="p-6 border-b border-main">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ background: task.labelColor, color: task.labelTextColor }}>
              {task.label}
            </span>
            <button onClick={onClose} className="ml-auto w-7 h-7 bg-secondary/5 hover:bg-accent2/20 rounded-lg flex items-center justify-center text-secondary hover:text-accent2 transition-all">✕</button>
          </div>
          <textarea
            className="w-full bg-transparent font-head text-xl font-bold text-primary resize-none outline-none"
            rows={1}
            defaultValue={task.title}
            onBlur={(e) => !isReadOnly && handleUpdate('title', e.target.value)}
            readOnly={isReadOnly}
          />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
          {/* Main */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary/60">Description</div>
              <button 
                onClick={handleSummarize}
                className="text-[10px] font-bold text-accent hover:text-primary transition-all bg-accent/10 px-2 py-0.5 rounded-full"
              >
                ✨ Summarize with AI
              </button>
            </div>
            
            <div className="quill-wrapper bg-secondary/5 border border-main rounded-xl overflow-hidden focus-within:border-accent transition-all">
              <ReactQuill 
                theme="snow"
                value={task.description}
                onChange={(content) => setTask(prev => ({ ...prev, description: content }))}
                onBlur={() => !isReadOnly && handleUpdate('description', task.description)}
                readOnly={isReadOnly}
                modules={{
                  toolbar: [
                    ['bold', 'italic', 'underline', 'strike'],
                    [{ list: 'ordered' }, { list: 'bullet' }],
                    ['clean']
                  ]
                }}
              />
            </div>

            {task.aiSummary && (
              <div className="mt-3 p-3 bg-accent/5 border border-accent/20 rounded-xl animate-[fadeUp_0.3s_ease]">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-[10px] font-bold text-accent uppercase">✨ AI Summary</span>
                </div>
                <div className="text-xs text-primary leading-relaxed space-y-1.5">
                  {task.aiSummary.split('\n\n').map((line, i) => (
                    <p key={i} dangerouslySetInnerHTML={{
                      __html: line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:var(--color-text)">$1</strong>')
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Checklist */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold uppercase tracking-widest text-secondary/60">Checklist</div>
                <div className="text-xs text-accent font-bold">{task.progress}%</div>
              </div>
              
              {/* Checklist Progress Bar */}
              <div className="h-1.5 w-full bg-secondary/10 rounded-full overflow-hidden mb-4">
                <div 
                  className="h-full bg-accent transition-all duration-500" 
                  style={{ width: `${task.progress}%` }} 
                />
              </div>

              <div className="space-y-1">
                {task.checklist?.map((item, i) => (
                  <div key={i} className="group flex items-center gap-3 py-1.5 px-2 hover:bg-secondary/5 rounded-lg transition-all">
                    <input 
                      type="checkbox" 
                      checked={item.done} 
                      onChange={() => handleChecklistToggle(i)}
                      className="w-4 h-4 rounded border-main bg-transparent text-accent focus:ring-accent accent-accent" 
                      disabled={!canEditChecklist} 
                    />
                    <span className={`flex-1 text-sm transition-all ${item.done ? 'line-through text-secondary/50' : 'text-primary'}`}>
                      {item.text}
                    </span>
                    {canEditChecklist && (
                      <button 
                        onClick={() => removeChecklistItem(i)}
                        className="opacity-0 group-hover:opacity-100 text-secondary hover:text-accent2 transition-all text-xs"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {canEditChecklist && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add an item..."
                    className="flex-1 bg-bg border border-main rounded-lg px-3 py-1.5 text-sm text-primary outline-none focus:border-accent transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addChecklistItem(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {/* Attachments */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-widest text-secondary/60">Attachments</div>
                {!isReadOnly && (
                  <div className="flex gap-3">
                    <button onClick={handleLinkAdd} className="text-xs text-accent hover:text-accent/80 font-bold cursor-pointer">🔗 Link</button>
                    <label className="text-xs text-accent hover:text-accent/80 font-bold cursor-pointer">
                      📁 File
                      <input type="file" className="hidden" onChange={handleFileUpload} />
                    </label>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {task.attachments?.map((at, i) => {
                  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(at.name?.split('.').pop()?.toLowerCase());
                  return (
                    <a
                      key={i}
                      href={at.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-secondary/5 border border-main rounded-xl hover:border-accent transition-all group overflow-hidden"
                    >
                      <div className="w-12 h-12 bg-secondary/5 rounded-lg flex items-center justify-center text-xl flex-shrink-0">
                        {isImage ? (
                          <img src={at.url} className="w-full h-full object-cover rounded-lg" alt="" />
                        ) : getAttachmentIcon(at)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-primary truncate font-medium">{at.name}</div>
                        <div className="text-[10px] text-secondary/60 uppercase font-bold tracking-tight">
                          {at.type === 'link' ? 'Open Link ↗' : 'View File ↗'}
                        </div>
                      </div>
                    </a>
                  );
                })}
                {(!task.attachments || task.attachments.length === 0) && (
                  <div className="col-span-2 py-4 bg-secondary/5 rounded-xl border border-dashed border-main text-center text-xs text-secondary">
                    No attachments yet.
                  </div>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-8">
              <div className="flex gap-4 border-b border-main mb-4">
                {['comments', 'history'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-2 text-xs font-bold uppercase tracking-widest transition-all
                      ${activeTab === tab ? 'text-accent border-b-2 border-accent' : 'text-secondary hover:text-primary'}`}
                  >
                    {tab} {tab === 'comments' ? `(${comments.length})` : `(${activities.length})`}
                  </button>
                ))}
              </div>

              {activeTab === 'comments' ? (
                <div className="animate-[fadeIn_0.3s_ease]">
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {c.author?.name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-primary">{c.author?.name}</span>
                            <span className="text-xs text-secondary">{new Date(c.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <div className="bg-secondary/5 border border-main rounded-lg rounded-tl-none px-3 py-2 text-sm text-primary prose prose-invert prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: c.text }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {!isReadOnly && (
                    <div className="mt-4 flex flex-col gap-2">
                      <div className="bg-secondary/5 border border-main rounded-xl overflow-hidden focus-within:border-accent transition-all">
                        <ReactQuill 
                          theme="snow"
                          value={commentText}
                          onChange={setCommentText}
                          placeholder="Add a comment..."
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'strike'],
                              [{ list: 'bullet' }],
                              ['clean']
                            ]
                          }}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button 
                          onClick={handleComment} 
                          disabled={isCommenting || !commentText.trim()}
                          className="px-4 py-1.5 bg-accent hover:bg-accent/80 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                        >
                          {isCommenting ? 'Adding...' : 'Comment'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4 animate-[fadeIn_0.3s_ease]">
                  {activities.map((a) => (
                    <div key={a._id} className="flex gap-3 items-start">
                      <div className="w-6 h-6 rounded-full bg-secondary/5 flex items-center justify-center text-[10px] text-secondary mt-1">🕒</div>
                      <div>
                        <div className="text-sm text-primary">{a.message}</div>
                        <div className="text-[10px] text-secondary/60 uppercase font-bold mt-0.5">
                          {new Date(a.createdAt).toLocaleString()} • {a.user?.name}
                        </div>
                      </div>
                    </div>
                  ))}
                  {activities.length === 0 && (
                    <div className="text-center py-6 text-secondary text-sm italic">No history recorded yet.</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Moved to bottom on mobile via grid-cols-1 */}
          <div className="space-y-6 lg:border-l lg:border-main lg:pl-6">
            <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2">Status</div>
            <select
              className="w-full bg-bg border border-main rounded-lg px-2 py-2 text-sm text-primary outline-none mb-4"
              defaultValue={task.column}
              onChange={(e) => handleUpdate('column', e.target.value)}
              disabled={isReadOnly}
            >
              {['Backlog', 'In Progress', 'Review', 'Done'].map((c) => (
                <option key={c} value={c} className="bg-surface text-primary">{c}</option>
              ))}
            </select>

            <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2">Priority</div>
            <div className="flex gap-1 mb-4">
              {['high', 'medium', 'low'].map((p) => (
                <button key={p}
                  onClick={() => !isReadOnly && handleUpdate('priority', p)}
                  disabled={isReadOnly}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all capitalize
                    ${task.priority === p
                      ? p === 'high' ? 'bg-accent2/20 text-accent2 border border-accent2/40'
                        : p === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-400/40'
                        : 'bg-accent3/20 text-accent3 border border-accent3/40'
                      : 'bg-white/5 text-secondary border border-transparent hover:bg-white/10'}`}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2">Due Date</div>
            <input
              type="date"
              className="w-full bg-bg border border-main rounded-lg px-2 py-2 text-sm text-primary outline-none mb-4"
              defaultValue={task.dueDate?.slice(0, 10)}
              onChange={(e) => handleUpdate('dueDate', e.target.value)}
              disabled={isReadOnly}
            />

            <div className="text-xs font-bold uppercase tracking-widest text-secondary/60 mb-2">Progress</div>
            <input
              type="range" min="0" max="100"
              defaultValue={task.progress}
              className="w-full accent-accent"
              onChange={(e) => handleUpdate('progress', parseInt(e.target.value))}
              disabled={!canEditChecklist}
            />
            <div className="text-xs text-accent font-bold mt-1">{task.progress}%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
