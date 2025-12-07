import React, { useRef, useEffect, useState } from 'react';
import { Message, MessageType, CannedResponse, TagDefinition } from '../types';
import { Send, User, Bot, Image as ImageIcon, Video, Mic, FileText, X, CheckCheck, Clock, MoreVertical, Play, Pause, ChevronDown, Zap, Reply, Trash2, ArrowLeft, CornerUpLeft, CalendarClock, MessageCircleQuestion, Maximize2, Minimize2, Plus, Tag, Wand2, ArrowRight, Users, StopCircle, Power } from 'lucide-react';

interface ChatWindowProps {
  messages: Message[];
  onSendMessage: (text: string, type: MessageType, mediaUrl?: string, replyTo?: Message) => void;
  onScheduleMessage?: (text: string, date: Date) => void;
  title: string;
  subtitle?: string;
  avatarUrl?: string; // New Avatar Prop
  isSimulating?: boolean;
  onRestart?: () => void;
  placeholder?: string;
  headerColor?: string;
  status?: 'active' | 'completed' | 'human_handoff';
  onHeaderClick?: () => void;
  onToggleNotes?: () => void;
  cannedResponses?: CannedResponse[]; 
  onBack?: () => void;
  onSimulateIncoming?: (text: string) => void;
  // Tag Props
  tags?: string[];
  availableTags?: TagDefinition[];
  onToggleTag?: (tagName: string) => void;
  // Writing Assistant
  enableSmartCompose?: boolean;
  fuzzySensitivity?: number;
  // Group Props
  isGroup?: boolean;
  participants?: { name: string; phone: string }[];
  onEndChat?: () => void; // New prop for ending chat
}

const DEFAULT_CANNED: CannedResponse[] = [
    { id: '1', label: "Saudação", text: "Olá! Como posso ajudar você hoje?" },
    { id: '2', label: "Espera", text: "Um momento, por favor, vou verificar essa informação." }
];

// --- Sub-components (AudioRecorder, Lightbox, etc. remain the same) ---
const AudioRecorder = ({ onSend, onCancel }: { onSend: (blobUrl: string, duration: string) => void, onCancel: () => void }) => {
    // ... same code ...
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        startRecording();
        return () => stopRecordingCleanup();
    }, []);

    const startRecording = async () => {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
             alert("Seu navegador não suporta gravação de áudio ou não está em um contexto seguro (HTTPS).");
             onCancel();
             return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
            
            timerRef.current = window.setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing mic", err);
            onCancel();
            alert("Não foi possível acessar o microfone. Verifique as permissões do navegador.");
        }
    };

    const stopRecordingCleanup = () => {
        if(mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if(timerRef.current) clearInterval(timerRef.current);
    };

    const handleStopAndSend = () => {
        if (!mediaRecorderRef.current) return;

        mediaRecorderRef.current.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(blob);
            const fmtDuration = formatTime(duration);
            onSend(url, fmtDuration);
        };
        stopRecordingCleanup();
    };

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="flex items-center gap-4 w-full animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 text-red-500 animate-pulse">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="font-mono font-medium">{formatTime(duration)}</span>
            </div>
            <div className="flex-1 text-xs text-gray-500">Gravando áudio...</div>
            <button onClick={() => { stopRecordingCleanup(); onCancel(); }} className="p-2 text-gray-500 hover:text-red-500">
                <Trash2 size={20} />
            </button>
            <button onClick={handleStopAndSend} className="p-2 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 shadow-md">
                <Send size={20} className="ml-0.5" />
            </button>
        </div>
    );
};

const ImageLightbox = ({ src, onClose }: { src: string, onClose: () => void }) => (
    <div className="fixed inset-0 bg-black/90 z-[100] flex items-center justify-center animate-in fade-in duration-200" onClick={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors z-50">
            <X size={32} />
        </button>
        <img src={src} alt="Full view" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
    </div>
);

const FilePreviewModal = ({ file, type, onSend, onCancel }: { file: File, type: MessageType, onSend: (caption: string) => void, onCancel: () => void }) => {
    const [previewUrl, setPreviewUrl] = useState<string>('');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [file]);

    return (
        <div className="absolute inset-0 z-50 bg-[#e9edef] dark:bg-gray-800 flex flex-col animate-in slide-in-from-bottom-10 duration-200">
            {/* Header */}
            <div className="px-4 py-3 bg-[#008069] text-white flex items-center gap-4 shadow-sm">
                <button onClick={onCancel} className="hover:bg-white/10 p-2 rounded-full transition-colors"><X size={24} /></button>
                <h3 className="font-semibold text-lg">Enviar {type === 'image' ? 'Imagem' : type === 'video' ? 'Vídeo' : 'Arquivo'}</h3>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-black/5 dark:bg-black/20">
                <div className="relative max-w-full max-h-full shadow-lg rounded-lg overflow-hidden bg-white dark:bg-gray-900 flex flex-col items-center justify-center">
                    {type === 'image' && <img src={previewUrl} className="max-h-[60vh] max-w-full object-contain" alt="Preview" />}
                    {type === 'video' && <video src={previewUrl} controls className="max-h-[60vh] max-w-full" />}
                    {type === 'document' && (
                        <div className="p-12 flex flex-col items-center gap-4 bg-white dark:bg-gray-800 min-w-[300px]">
                            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-full flex items-center justify-center">
                                <FileText size={40} />
                            </div>
                            <span className="text-gray-700 dark:text-gray-200 font-medium text-lg text-center max-w-xs truncate">{file.name}</span>
                            <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Caption Input */}
            <div className="p-4 bg-[#f0f2f5] dark:bg-gray-800 flex gap-2 items-center border-t border-gray-300 dark:border-gray-700">
                <input 
                    type="text" 
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Adicione uma legenda..." 
                    className="flex-1 px-4 py-3 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#008069] text-sm"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && onSend(caption)}
                />
                <button 
                    onClick={() => onSend(caption)}
                    className="w-12 h-12 bg-[#008069] text-white rounded-full flex items-center justify-center hover:bg-[#006a57] shadow-md transition-transform active:scale-95"
                >
                    <Send size={20} className="ml-0.5" />
                </button>
            </div>
        </div>
    );
};

const AudioMessage = ({ src, duration }: { src: string, duration?: string }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [progress, setProgress] = useState(0);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) audioRef.current.pause();
            else audioRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration || 1;
            setProgress((current / total) * 100);
        }
    };

    return (
        <div className="flex items-center gap-3 bg-transparent p-1 min-w-[240px]">
            <audio 
                ref={audioRef} 
                src={src} 
                onEnded={() => { setIsPlaying(false); setProgress(0); }} 
                onTimeUpdate={handleTimeUpdate}
                className="hidden" 
            />
            <button 
                onClick={togglePlay}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors shrink-0"
            >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
            </button>
            <div className="flex-1 flex flex-col justify-center gap-1.5">
                <div className="h-1 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden w-full relative cursor-pointer">
                    <div className="h-full bg-gray-500 dark:bg-gray-300 rounded-full transition-all duration-100" style={{width: `${progress}%`}}></div>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 dark:text-gray-400 font-medium font-mono">
                    <span>{isPlaying ? 'Reproduzindo...' : '0:00'}</span>
                    <span>{duration || '0:15'}</span>
                </div>
            </div>
            <div className="relative shrink-0">
                 <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-500 dark:text-blue-300">
                    <Mic size={16} />
                 </div>
            </div>
        </div>
    );
};

// --- Main Component ---

export const ChatWindow: React.FC<ChatWindowProps> = ({ 
  messages, 
  onSendMessage, 
  onScheduleMessage,
  title, 
  subtitle, 
  avatarUrl,
  isSimulating = false, 
  onRestart,
  placeholder = "Digite uma mensagem...",
  headerColor = "bg-gray-100 dark:bg-gray-800",
  status,
  onHeaderClick,
  onToggleNotes,
  cannedResponses = DEFAULT_CANNED,
  onBack,
  onSimulateIncoming,
  tags = [],
  availableTags = [],
  onToggleTag,
  enableSmartCompose = false,
  fuzzySensitivity = 2,
  isGroup = false,
  participants = [],
  onEndChat
}) => {
  const [inputText, setInputText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [showCanned, setShowCanned] = useState(false);
  const [cannedFilter, setCannedFilter] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false); // Menu toggle state
  const [isExpanded, setIsExpanded] = useState(false); // Fullscreen toggle state
  
  // Smart Compose State
  const [smartSuggestion, setSmartSuggestion] = useState<CannedResponse | null>(null);
  
  // Tag Menu State
  const [showTagMenu, setShowTagMenu] = useState(false);

  // Reply State
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  // Message Options State
  const [activeMessageOptions, setActiveMessageOptions] = useState<string | null>(null);

  // Media Preview State
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewType, setPreviewType] = useState<MessageType>('image');
  
  // Lightbox State
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null); // For Canned Filter
  const textareaRef = useRef<HTMLTextAreaElement>(null); // For Main Chat Input
  const [fileTypeToUpload, setFileTypeToUpload] = useState<MessageType>('image');

  // Filter canned responses
  const filteredCanned = cannedResponses.filter(
      r => r.label.toLowerCase().includes(cannedFilter.toLowerCase()) || r.text.toLowerCase().includes(cannedFilter.toLowerCase())
  );

  // --- LEVENSHTEIN FUZZY LOGIC ---
  const levenshteinDistance = (a: string, b: string) => {
      const matrix = [];
      for (let i = 0; i <= b.length; i++) matrix[i] = [i];
      for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

      for (let i = 1; i <= b.length; i++) {
          for (let j = 1; j <= a.length; j++) {
              if (b.charAt(i - 1) === a.charAt(j - 1)) {
                  matrix[i][j] = matrix[i - 1][j - 1];
              } else {
                  matrix[i][j] = Math.min(
                      matrix[i - 1][j - 1] + 1, // substitution
                      Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1) // insertion/deletion
                  );
              }
          }
      }
      return matrix[b.length][a.length];
  };

  const checkSmartCompose = (text: string) => {
      if (!enableSmartCompose || text.length < 3) {
          setSmartSuggestion(null);
          return;
      }

      const inputLower = text.toLowerCase();
      let bestMatch: CannedResponse | null = null;
      let minDistance = Infinity;

      // Check against shortcuts (labels) and content
      cannedResponses.forEach(cr => {
          const labelDist = levenshteinDistance(inputLower, cr.label.toLowerCase());
          
          // Heuristic: If input is substring or close match
          if (labelDist <= (fuzzySensitivity || 2)) {
              if (labelDist < minDistance) {
                  minDistance = labelDist;
                  bestMatch = cr;
              }
          }
      });

      setSmartSuggestion(bestMatch);
  };

  const handleInputTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setInputText(val);
      checkSmartCompose(val);
  };

  const acceptSuggestion = () => {
      if (smartSuggestion) {
          setInputText(smartSuggestion.text);
          setSmartSuggestion(null);
      }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToMessage = (messageId: string) => {
      const element = document.getElementById(`msg-${messageId}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('bg-blue-50/50', 'dark:bg-blue-900/30', 'ring-2', 'ring-blue-400', 'transition-all', 'duration-500');
          setTimeout(() => {
              element.classList.remove('bg-blue-50/50', 'dark:bg-blue-900/30', 'ring-2', 'ring-blue-400');
          }, 1500);
      }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, showAttachments, showCanned, showSchedule, replyingTo]);

  // Auto-resize textarea logic
  useEffect(() => {
      if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'; // Reset to auto to calculate scrollHeight correctly
          const newHeight = Math.min(textareaRef.current.scrollHeight, 150); // Max height limit
          textareaRef.current.style.height = `${newHeight}px`;
      }
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(inputText, 'text', undefined, replyingTo || undefined);
      setInputText('');
      setSmartSuggestion(null);
      setReplyingTo(null);
      setShowCanned(false);
      // Reset height explicitly
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleCannedClick = (text: string) => {
      setInputText(text);
      setShowCanned(false);
      setCannedFilter('');
      textareaRef.current?.focus(); // Focus main input
  };

  const handleScheduleSubmit = () => {
      if(inputText && scheduleTime && onScheduleMessage) {
          onScheduleMessage(inputText, new Date(scheduleTime));
          setInputText('');
          setScheduleTime('');
          setShowSchedule(false);
          setReplyingTo(null);
      }
  };

  const handleAttachmentClick = (type: MessageType) => {
      setFileTypeToUpload(type);
      setTimeout(() => {
          if (fileInputRef.current) {
              fileInputRef.current.value = ''; // Reset
              if (type === 'image') fileInputRef.current.accept = "image/*";
              else if (type === 'video') fileInputRef.current.accept = "video/*";
              else if (type === 'audio') fileInputRef.current.accept = "audio/*";
              else fileInputRef.current.accept = "*/*";
              
              fileInputRef.current.click();
          }
      }, 50);
      setShowAttachments(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setPreviewFile(file);
          setPreviewType(fileTypeToUpload);
      }
  };

  const handleConfirmSend = (caption: string) => {
      if (previewFile) {
          const objectUrl = URL.createObjectURL(previewFile);
          let textMsg = caption;
          if (!textMsg) {
               switch(previewType) {
                  case 'image': textMsg = '📷 Foto'; break;
                  case 'video': textMsg = '🎥 Vídeo'; break;
                  case 'audio': textMsg = '🎵 Áudio'; break;
                  case 'document': textMsg = previewFile.name; break;
              }
          }
          
          onSendMessage(textMsg, previewType, objectUrl, replyingTo || undefined);
          setPreviewFile(null);
          setReplyingTo(null);
      }
  };

  const handleAudioSend = (blobUrl: string, duration: string) => {
      onSendMessage('🎵 Áudio', 'audio', blobUrl, replyingTo || undefined);
      setIsRecordingAudio(false);
  };

  // Helper to get color for sender in reply preview
  const getSenderColor = (sender: string) => {
      return sender === 'user' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400';
  };
  
  const getSenderBorderColor = (sender: string) => {
      return sender === 'user' ? 'border-purple-500' : 'border-emerald-500';
  };

  const renderMediaIcon = (type?: MessageType) => {
      switch(type) {
          case 'image': return <ImageIcon size={14} className="inline mr-1" />;
          case 'video': return <Video size={14} className="inline mr-1" />;
          case 'audio': return <Mic size={14} className="inline mr-1" />;
          case 'document': return <FileText size={14} className="inline mr-1" />;
          default: return null;
      }
  };

  const handleSimulateUserMessage = () => {
      const text = prompt("Digite a mensagem que o cliente enviou:");
      if (text && onSimulateIncoming) {
          onSimulateIncoming(text);
          setShowOptionsMenu(false);
      }
  };

  // Helper for Tag Colors
  const getTagColor = (tagName: string) => {
     const def = availableTags?.find(t => t.name === tagName);
     return def ? def.color : 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Resolve Subtitle
  const resolveSubtitle = () => {
      if (isGroup) return `${participants.length} participantes`;
      if (subtitle) return subtitle;
      return '';
  };

  return (
    <div className={`flex flex-col bg-[#efeae2] dark:bg-gray-900 transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-[100] w-full h-full' : 'h-full relative shadow-sm'}`}>
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

      {/* Lightbox Overlay */}
      {lightboxImage && <ImageLightbox src={lightboxImage} onClose={() => setLightboxImage(null)} />}

      {/* File Preview Modal */}
      {previewFile && (
          <FilePreviewModal 
              file={previewFile} 
              type={previewType} 
              onSend={handleConfirmSend} 
              onCancel={() => setPreviewFile(null)} 
          />
      )}

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.06] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: '400px' }}></div>

      {/* Header */}
      <div className={`${headerColor} px-4 py-2.5 flex justify-between items-center shadow-sm z-30 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800`}>
        <div className="flex items-center gap-2">
            {onBack && (
                <button 
                    onClick={(e) => { e.stopPropagation(); onBack(); }} 
                    className="md:hidden p-1 mr-1 text-emerald-600 dark:text-emerald-400"
                >
                    <ArrowLeft size={24} />
                </button>
            )}

            <div 
                className={`flex items-center gap-2 ${onHeaderClick ? 'cursor-pointer' : ''}`}
                onClick={onHeaderClick}
            >
                {isSimulating ? (
                    <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center text-white"><Bot size={20} /></div>
                ) : (
                    <div className="relative">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold overflow-hidden border border-gray-300 dark:border-gray-600 group-hover:border-emerald-500 transition-colors ${isGroup ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300'}`}>
                            {isGroup ? <Users size={20} /> : avatarUrl ? (
                                <img src={avatarUrl} alt={title} className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} className="mt-2" />
                            )}
                        </div>
                        {status === 'active' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>}
                        {status === 'human_handoff' && <div className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full animate-pulse"></div>}
                    </div>
                )}
                
                <div className="flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight flex items-center gap-2">
                            {title || 'Usuário'}
                            {!isSimulating && !isGroup && <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 px-1.5 rounded font-bold">LÍDER</span>}
                            {isGroup && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-1.5 rounded font-bold">GRUPO</span>}
                        </h3>
                        
                        {/* Quick Tags in Header */}
                        {!isSimulating && onToggleTag && (
                            <div className="flex items-center gap-1">
                                {tags.slice(0, 2).map(tag => (
                                    <span key={tag} className={`px-1.5 py-0.5 text-[9px] rounded-md border font-medium uppercase ${getTagColor(tag)} hidden sm:inline-block`}>
                                        {tag}
                                    </span>
                                ))}
                                {tags.length > 2 && (
                                     <span className="text-[9px] text-gray-400 hidden sm:inline-block">+{tags.length - 2}</span>
                                )}
                                
                                <div className="relative ml-1">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setShowTagMenu(!showTagMenu); }}
                                        className="p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-emerald-600 transition-colors"
                                        title="Gerenciar Tags"
                                    >
                                        <Tag size={14} />
                                    </button>

                                    {showTagMenu && (
                                        <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animate-in fade-in zoom-in-95 origin-top-left">
                                            <div className="px-3 py-2 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-100 dark:border-gray-700 mb-1">
                                                Etiquetas Rápidas
                                            </div>
                                            <div className="max-h-48 overflow-y-auto">
                                                {availableTags?.map(tag => {
                                                    const isSelected = tags.includes(tag.name);
                                                    return (
                                                        <button 
                                                            key={tag.id}
                                                            onClick={(e) => { e.stopPropagation(); onToggleTag(tag.name); }}
                                                            className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-2 h-2 rounded-full ${tag.color.split(' ')[0]}`}></span>
                                                                <span className={`font-medium ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-200'}`}>{tag.name}</span>
                                                            </div>
                                                            {isSelected && <CheckCheck size={12} className="text-emerald-600"/>}
                                                        </button>
                                                    );
                                                })}
                                                {availableTags?.length === 0 && <div className="p-2 text-xs text-gray-400 text-center">Nenhuma tag disponível.</div>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                    {(subtitle || isGroup) && (
                        <p className={`text-xs leading-tight ${
                            (!isGroup && (subtitle?.toLowerCase() === 'online' || subtitle?.toLowerCase().includes('digitando'))) 
                            ? 'text-emerald-600 dark:text-emerald-400 font-medium' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                            {resolveSubtitle()}
                        </p>
                    )}
                </div>
            </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 relative">
            
            {/* End Chat Button */}
            {!isSimulating && onEndChat && (
                <button 
                    onClick={onEndChat}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold transition-all mr-2"
                    title="Encerrar e Arquivar"
                >
                    <StopCircle size={16} />
                    <span className="hidden md:inline">Encerrar</span>
                </button>
            )}

             {/* Expand/Collapse Button */}
            <button 
                onClick={() => setIsExpanded(!isExpanded)} 
                className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 transition-colors hidden md:block"
                title={isExpanded ? "Restaurar Tamanho" : "Tela Cheia"}
            >
                {isExpanded ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {isSimulating && onRestart && (
                 <button onClick={onRestart} className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full text-emerald-600" title="Reiniciar Conversa">
                    <MoreVertical size={20} />
                </button>
            )}
            
            {/* Header Menu */}
            {!isSimulating && (
                <div className="relative">
                    <button 
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)} 
                        className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                    {showOptionsMenu && (
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 py-1 animate-in fade-in zoom-in-95 origin-top-right">
                            {onToggleNotes && (
                                <button 
                                    onClick={() => { onToggleNotes(); setShowOptionsMenu(false); }} 
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2 md:hidden"
                                >
                                    <FileText size={16} /> Ver Notas
                                </button>
                            )}
                            {onSimulateIncoming && (
                                <button 
                                    onClick={handleSimulateUserMessage}
                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-purple-600 dark:text-purple-400 flex items-center gap-2 font-medium"
                                >
                                    <MessageCircleQuestion size={16} /> Simular Resposta Cliente
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10 scrollbar-hide">
        {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <div className="w-32 h-32 bg-contain bg-no-repeat bg-center opacity-20" style={{ backgroundImage: 'url("https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png")' }}></div>
                <p className="text-sm font-medium bg-white/50 dark:bg-gray-800/50 px-3 py-1 rounded-full mt-4 shadow-sm dark:text-gray-300">As mensagens são protegidas com criptografia de ponta-a-ponta.</p>
            </div>
        )}
        
        {messages.map((msg, idx) => {
          const isUser = msg.sender === 'user';
          const isSystem = msg.sender === 'system';
          const isAgent = msg.sender === 'agent';
          
          if (isSystem) {
              return (
                  <div key={msg.id || idx} className="flex justify-center my-2">
                      <span className="bg-emerald-50 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 text-[10px] px-3 py-1 rounded-full font-bold shadow-sm uppercase tracking-wide border border-emerald-100 dark:border-emerald-800">
                          {msg.text}
                      </span>
                  </div>
              );
          }

          const prevMsg = messages[idx - 1];
          const isSequence = prevMsg && prevMsg.sender === msg.sender;

          return (
            <div 
              key={msg.id || idx} 
              id={`msg-${msg.id}`}
              className={`flex ${isUser ? 'justify-start' : 'justify-end'} ${isSequence ? 'mt-0.5' : 'mt-2'} group relative`}
              onMouseLeave={() => setActiveMessageOptions(null)}
            >
              <div 
                className={`
                  max-w-[85%] md:max-w-[65%] rounded-lg px-2 py-1 relative shadow-sm
                  ${isUser ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none' : isAgent ? 'bg-emerald-100 dark:bg-emerald-900 text-gray-800 dark:text-gray-100 rounded-tr-none' : 'bg-[#d9fdd3] dark:bg-emerald-800 text-gray-800 dark:text-gray-100 rounded-tr-none'}
                `}
              >
                {/* Agent Name Tag */}
                {(isAgent || (!isUser && msg.sender === 'bot')) && !isSequence && (
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-0.5 px-1">{isAgent ? 'Atendente' : 'Robô'}</p>
                )}

                {/* Reply Context Render (WhatsApp Style) */}
                {msg.replyTo && (
                    <div 
                        className={`mb-1 rounded-md p-2 text-xs cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-colors flex gap-2 overflow-hidden bg-black/5 dark:bg-black/20 border-l-[4px] ${getSenderBorderColor(msg.replyTo.sender)}`}
                        onClick={(e) => { e.stopPropagation(); scrollToMessage(msg.replyTo!.id); }}
                    >
                         <div className="flex-1 min-w-0">
                            <span className={`font-bold block mb-0.5 text-[11px] ${getSenderColor(msg.replyTo.sender)}`}>
                                {msg.replyTo.sender === 'user' ? title : 'Você'}
                            </span>
                            <div className="flex items-center text-gray-500 dark:text-gray-300/80 truncate">
                                {renderMediaIcon(msg.replyTo.type)}
                                <span className="truncate">
                                    {msg.replyTo.type === 'image' ? 'Foto' : 
                                     msg.replyTo.type === 'video' ? 'Vídeo' : 
                                     msg.replyTo.type === 'audio' ? 'Áudio' : 
                                     msg.replyTo.type === 'document' ? msg.replyTo.fileName || 'Documento' :
                                     msg.replyTo.text}
                                </span>
                            </div>
                        </div>
                        {/* If quoted message has image, show tiny thumbnail */}
                        {msg.replyTo.type === 'image' && msg.replyTo.mediaUrl && (
                            <div className="w-10 h-10 shrink-0">
                                <img src={msg.replyTo.mediaUrl} className="w-full h-full object-cover rounded-sm" />
                            </div>
                        )}
                    </div>
                )}
                
                {/* Media Rendering */}
                {msg.type === 'image' && msg.mediaUrl && (
                    <div className="mb-1 cursor-pointer overflow-hidden rounded-lg mt-1" onClick={() => setLightboxImage(msg.mediaUrl!)}>
                        <img src={msg.mediaUrl} alt="imagem" className="max-w-full max-h-[300px] object-cover hover:scale-[1.02] transition-transform" />
                    </div>
                )}

                {msg.type === 'video' && msg.mediaUrl && (
                     <div className="mb-1 overflow-hidden rounded-lg mt-1 max-w-[300px]">
                        <video src={msg.mediaUrl} controls className="w-full max-h-[300px] bg-black" />
                    </div>
                )}

                {msg.type === 'audio' && msg.mediaUrl && (
                     <AudioMessage src={msg.mediaUrl} duration={msg.duration} />
                )}

                {msg.type === 'document' && (
                     <div className="flex items-center gap-3 bg-black/5 dark:bg-white/10 p-3 rounded-lg mb-1 min-w-[200px]">
                        <div className="bg-white dark:bg-gray-700 p-2 rounded-full text-gray-500 dark:text-gray-300">
                            <FileText size={20} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-medium truncate">{msg.text}</span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase">{msg.fileName?.split('.').pop() || 'FILE'} • {msg.fileSize || 'Unknown Size'}</span>
                        </div>
                     </div>
                )}
                
                {/* Text Content */}
                {((msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'audio' && msg.type !== 'document') || (msg.text && !msg.text.includes('📷') && !msg.text.includes('🎥') && !msg.text.includes('🎵'))) && (
                     <p className="text-sm leading-relaxed px-1 whitespace-pre-wrap">{msg.text}</p>
                )}

                {/* Footer Metadata */}
                <div className="flex items-center justify-end gap-1 mt-0.5 px-1 opacity-70">
                    {msg.isScheduled && <CalendarClock size={10} className="text-gray-500 dark:text-gray-400" />}
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {!isUser && (
                        <span className={`text-[10px] ${msg.isScheduled ? 'text-gray-400' : 'text-blue-500 dark:text-blue-300'}`}>
                            {msg.isScheduled ? <Clock size={12}/> : <CheckCheck size={14} />}
                        </span>
                    )}
                </div>

                {/* Message Dropdown Options */}
                <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMessageOptions(activeMessageOptions === msg.id ? null : msg.id); }}
                    className={`absolute top-0 right-0 p-1 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-l from-inherit rounded-bl-lg`}
                >
                    <ChevronDown size={16} />
                </button>
                {activeMessageOptions === msg.id && (
                    <div className="absolute top-6 right-2 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-100 dark:border-gray-700 z-20 py-1 w-32 animate-in fade-in zoom-in-95 origin-top-right">
                        <button 
                            onClick={() => { setReplyingTo(msg); textareaRef.current?.focus(); setActiveMessageOptions(null); }}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center gap-2"
                        >
                            <Reply size={14}/> Responder
                        </button>
                    </div>
                )}

                {/* Hover Action (Reply) - Quick Action */}
                <button 
                    onClick={() => { setReplyingTo(msg); textareaRef.current?.focus(); }}
                    className={`absolute top-0 p-1.5 text-gray-400 bg-white dark:bg-gray-700 shadow-md rounded-full opacity-0 group-hover:opacity-100 transition-all hover:text-gray-600 dark:hover:text-gray-200 hover:scale-110 z-10 hidden md:block ${isUser ? '-left-8' : '-right-8'}`}
                    title="Responder"
                >
                    <Reply size={16} />
                </button>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Smart Compose Suggestion Bar - Floating above input */}
      {enableSmartCompose && smartSuggestion && (
          <div className="px-4 pb-2 animate-in slide-in-from-bottom-2 fade-in duration-300 absolute bottom-[72px] left-0 w-full z-30 pointer-events-none">
              <div className="inline-flex items-center gap-3 bg-white dark:bg-gray-800 border border-purple-200 dark:border-purple-900 shadow-lg rounded-full px-4 py-2 pointer-events-auto cursor-pointer group" onClick={acceptSuggestion}>
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                      <Wand2 size={12} className="animate-pulse" />
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Sugestão Inteligente ({smartSuggestion.label})</span>
                      <span className="text-xs font-medium text-gray-800 dark:text-white line-clamp-1 max-w-xs">{smartSuggestion.text}</span>
                  </div>
                  <div className="h-4 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>
                  <span className="text-[10px] font-bold text-gray-400 group-hover:text-purple-500 flex items-center gap-1">
                      TAB <ArrowRight size={10} />
                  </span>
              </div>
          </div>
      )}

      {/* Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-gray-800 z-20 relative">
        {/* Reply Preview Bar */}
        {replyingTo && (
            <div className="bg-gray-100 dark:bg-gray-800 p-2 flex justify-between items-center px-4 py-2 animate-in slide-in-from-bottom-2 z-10 relative border-t border-gray-200 dark:border-gray-700">
                 <div className="flex-1 bg-white dark:bg-gray-700 rounded-lg p-2 flex gap-3 overflow-hidden border-l-[4px] border-emerald-500 shadow-sm">
                    {/* Tiny thumbnail if replying to image */}
                    {replyingTo.type === 'image' && replyingTo.mediaUrl && (
                        <div className="w-10 h-10 shrink-0">
                            <img src={replyingTo.mediaUrl} className="w-full h-full object-cover rounded-sm" />
                        </div>
                    )}
                    <div className="flex-1 overflow-hidden flex flex-col justify-center">
                        <span className={`text-xs font-bold block mb-0.5 ${getSenderColor(replyingTo.sender)}`}>
                            {replyingTo.sender === 'user' ? title : 'Você'}
                        </span>
                        <div className="text-gray-500 dark:text-gray-300/70 text-xs truncate flex items-center">
                             {renderMediaIcon(replyingTo.type)}
                             <span>
                                {replyingTo.type === 'image' ? 'Foto' : 
                                 replyingTo.type === 'video' ? 'Vídeo' : 
                                 replyingTo.type === 'audio' ? 'Áudio' : 
                                 replyingTo.type === 'document' ? replyingTo.fileName || 'Documento' :
                                 replyingTo.text}
                             </span>
                        </div>
                    </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-2 ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                    <X size={20} />
                </button>
            </div>
        )}

        <div className="px-4 py-2">
            {/* Canned Responses Popover */}
            {showCanned && (
                <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-72 overflow-hidden animate-in zoom-in-95 origin-bottom-left z-50">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        <input 
                            ref={textInputRef}
                            className="bg-transparent dark:text-white text-xs w-full outline-none" 
                            placeholder="Filtrar respostas rápidas..." 
                            value={cannedFilter}
                            onChange={(e) => setCannedFilter(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                        {filteredCanned.map((c, i) => (
                            <button 
                                key={i} 
                                onClick={() => handleCannedClick(c.text)}
                                className="w-full text-left px-4 py-2.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-sm border-b border-gray-50 dark:border-gray-700 last:border-0 group"
                            >
                                <span className="font-bold text-gray-700 dark:text-gray-200 text-xs block group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{c.label}</span>
                                <span className="text-gray-500 dark:text-gray-400 truncate block group-hover:text-emerald-600 dark:group-hover:text-emerald-500">{c.text}</span>
                            </button>
                        ))}
                        {filteredCanned.length === 0 && <div className="p-4 text-xs text-center text-gray-400">Nenhuma resposta encontrada.</div>}
                    </div>
                </div>
            )}

            {/* Attachments Menu */}
            {showAttachments && (
                <div className="absolute bottom-16 left-2 mb-2 flex flex-col gap-2 animate-in slide-in-from-bottom-5 z-50">
                    {[
                        { icon: ImageIcon, label: 'Fotos', color: 'bg-purple-500', type: 'image' },
                        { icon: Video, label: 'Vídeos', color: 'bg-red-500', type: 'video' },
                        { icon: FileText, label: 'Docs', color: 'bg-blue-500', type: 'document' },
                        { icon: Mic, label: 'Áudio', color: 'bg-orange-500', type: 'audio' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 group cursor-pointer" onClick={() => handleAttachmentClick(item.type as MessageType)}>
                            <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}>
                                <item.icon size={20} />
                            </div>
                            <span className="bg-white/90 dark:bg-gray-800/90 backdrop-blur px-2 py-1 rounded-lg text-xs font-medium shadow-sm text-gray-700 dark:text-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.label}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Schedule Popover */}
            {showSchedule && (
                <div className="absolute bottom-full right-4 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-72 p-4 animate-in zoom-in-95 origin-bottom-right z-50">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2"><CalendarClock size={16}/> Agendar Mensagem</h4>
                        <button onClick={() => setShowSchedule(false)}><X size={14} className="text-gray-400 hover:text-gray-600"/></button>
                    </div>
                    <input 
                        type="datetime-local" 
                        className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                    />
                    <button 
                        onClick={handleScheduleSubmit}
                        disabled={!scheduleTime || !inputText}
                        className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-emerald-700 disabled:opacity-50"
                    >
                        Confirmar Agendamento
                    </button>
                </div>
            )}

            {/* Input Bar or Recorder */}
            {isRecordingAudio ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <AudioRecorder onSend={handleAudioSend} onCancel={() => setIsRecordingAudio(false)} />
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="flex items-end gap-2">
                    <div className="bg-white dark:bg-gray-800 flex-1 rounded-2xl flex items-end border border-white dark:border-gray-800 focus-within:border-emerald-500 transition-colors shadow-sm py-2 px-2 relative">
                        <button 
                            type="button" 
                            onClick={() => setShowAttachments(!showAttachments)}
                            className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${showAttachments ? 'bg-gray-200 dark:bg-gray-700 rotate-45' : ''}`}
                        >
                            <Plus size={20} />
                        </button>
                        
                        <button 
                            type="button" 
                            onClick={() => { setShowCanned(!showCanned); setCannedFilter(''); setShowSchedule(false); }}
                            className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors hidden sm:block ${showCanned ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : ''}`}
                            title="Respostas Rápidas"
                        >
                            <Zap size={20} />
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={handleInputTextChange}
                            placeholder={placeholder}
                            className="flex-1 max-h-32 min-h-[24px] py-2 px-2 bg-transparent border-none outline-none text-sm text-gray-800 dark:text-white resize-none scrollbar-hide leading-relaxed"
                            rows={1}
                            onKeyDown={(e) => {
                                if (e.key === 'Tab' && smartSuggestion && enableSmartCompose) {
                                    e.preventDefault();
                                    acceptSuggestion();
                                } else if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit(e);
                                }
                            }}
                        />

                        <button 
                            type="button"
                            onClick={() => { setShowSchedule(!showSchedule); setShowCanned(false); }}
                            className={`p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${showSchedule ? 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' : ''}`}
                            title="Agendar Envio"
                        >
                            <ChevronDown size={20} />
                        </button>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={(e) => {
                            if (!inputText.trim()) {
                                e.preventDefault();
                                setIsRecordingAudio(true);
                            } else {
                                handleSubmit(e as any);
                            }
                        }}
                        className={`p-3 text-white rounded-full shadow-md transition-transform active:scale-95 flex items-center justify-center mb-0.5 ${inputText.trim() ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                    >
                        {inputText.trim() ? <Send size={20} className="ml-0.5" /> : <Mic size={20} />}
                    </button>
                </form>
            )}
        </div>
      </div>
    </div>
  );
};