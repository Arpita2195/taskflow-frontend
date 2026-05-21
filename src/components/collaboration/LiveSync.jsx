import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const LiveSync = ({ roomName, userName, onClose }) => {
  const jitsiContainerRef = useRef(null);

  useEffect(() => {
    let apiInstance = null;
    const script = document.createElement('script');
    script.src = 'https://meet.jit.si/external_api.js';
    script.async = true;
    script.onload = () => {
      if (!jitsiContainerRef.current) return;
      const domain = 'meet.jit.si';
      const options = {
        roomName: `TaskFlow-${roomName}`,
        width: '100%',
        height: '100%',
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: userName
        },
        interfaceConfigOverwrite: {
          TOOLBAR_BUTTONS: [
            'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
            'fadedictation', 'hangup', 'profile', 'chat', 'recording',
            'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
            'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
            'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
            'security'
          ],
          SETTINGS_SECTIONS: ['devices', 'language', 'moderator', 'profile', 'calendar'],
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
        },
        configOverwrite: {
          disableDeepLinking: true
        }
      };
      
      apiInstance = new window.JitsiMeetExternalAPI(domain, options);
      
      apiInstance.addEventListener('videoConferenceLeft', () => {
        onClose();
      });
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (apiInstance) {
        apiInstance.dispose();
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [roomName, userName, onClose]);

  const handleCopyCallLink = () => {
    const callUrl = `${window.location.origin}/board?tab=kanban&liveSync=1`;
    navigator.clipboard.writeText(callUrl);
    toast.success('Direct call link copied to clipboard!');
  };

  return (
    <motion.div
      drag
      dragConstraints={{ left: -1000, right: 0, top: 0, bottom: 500 }}
      initial={{ opacity: 0, scale: 0.8, y: 100 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 100 }}
      className="fixed bottom-6 right-6 w-[420px] h-[520px] bg-surface border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-[9999] flex flex-col cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-white/70">Live Sync Active</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyCallLink}
            className="flex items-center gap-1 px-2.5 py-1 bg-accent/20 hover:bg-accent/35 border border-accent/35 text-[11px] font-bold text-accent rounded-lg transition-all"
            title="Copy call link to share with teammates"
          >
            <span>🔗</span> Copy Call Link
          </button>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <div ref={jitsiContainerRef} className="flex-1 bg-black" />
      
      <div className="px-4 py-2 bg-white/5 text-[10px] text-gray-500 text-center">
        Drag this window to move it around while you work.
      </div>
    </motion.div>
  );
};

export default LiveSync;
