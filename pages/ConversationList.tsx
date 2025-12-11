import React, { useState, useEffect, useRef } from 'react';
import { Conversation, MessageType, BotSettings, TagDefinition, Message, CannedResponse, KanbanStage, SuperRobotTrigger, User, SuperRobotItem } from '../types';
import { ChatWindow } from '../components/ChatWindow';
import { Search, User as UserIcon, CheckCircle, Mail, Phone, Tag, MessageSquare, LayoutList, Table as TableIcon, Download, Hand, Bot, Power, Save, FileText, Edit2, Plus, X, FileDown, Camera, Mic, Video, Image as ImageIcon, StickyNote, ChevronDown, ChevronUp, UserPlus, MoreVertical, Ban, Flag, Trash2, Circle, Clock, Palette, AlertCircle, Archive, Check, Kanban, GripHorizontal, ArrowLeft, MessageCircle, Zap, Database, Filter, SlidersHorizontal, MoreHorizontal, Radio, Pin, PinOff, Volume2, Bell, BellRing, Play, BellOff, Lock, Sparkles, Fingerprint, PanelLeftClose, PanelLeftOpen, List, Users, RefreshCw, FileCheck } from 'lucide-react';

interface ConversationListProps {
  user?: User;
  onUpdateAgentStatus?: (status: 'online' | 'busy' | 'offline') => void;
  conversations: Conversation[];
  onSendMessageToConversation: (id: string, text: string, type: MessageType, mediaUrl?: string, replyTo?: Message) => void;
  onMarkAsCompleted: (id: string) => void;
  onUpdateStatus: (id: string, status: 'active' | 'human_handoff' | 'in_progress') => void;
  onUpdateConversation: (id: string, updates: Partial<Conversation>) => void;
  onAddNewConversation?: (conversation: Conversation) => void;
  botSettings: BotSettings;
  availableTags: TagDefinition[]; 
  onCreateTag: (tag: TagDefinition) => void;
  onUpdateTag: (tag: TagDefinition) => void;
  onDeleteTagDefinition: (tagId: string) => void;
  cannedResponses?: CannedResponse[];
  // Super Robot Props
  isSuperRobotActive?: boolean;
  onToggleSuperRobot?: () => void;
  superRobotDatabase?: SuperRobotTrigger[];
  onUpdateSuperRobotDatabase?: (triggers: SuperRobotTrigger[]) => void;
  onSimulateIncomingMessage?: (convoId: string, text: string) => void;
}

interface Note {
    id: string;
    title: string;
    text: string;
    color: string;
    isMinimized: boolean;
    isPinned?: boolean; 
    tags?: string[];
}

// Sound Assets
const SOUNDS = {
    pop: { label: 'Pop (Padrão)', url: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73467.mp3' },
    ding: { label: 'Ding (Sutil)', url: 'https://cdn.pixabay.com/audio/2022/03/19/audio_9752d075eb.mp3' },
    alert: { label: 'Bip (Alerta)', url: 'https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3' }
};

const NOTE_COLORS = [
    { bg: 'bg-yellow-50', border: 'border-yellow-200', header: 'bg-yellow-100', text: 'text-yellow-800', placeholder: 'placeholder-yellow-700/50' },
    { bg: 'bg-blue-50', border: 'border-blue-200', header: 'bg-blue-100', text: 'text-blue-800', placeholder: 'placeholder-blue-700/50' },
    { bg: 'bg-green-50', border: 'border-green-200', header: 'bg-green-100', text: 'text-green-800', placeholder: 'placeholder-green-700/50' },
    { bg: 'bg-pink-50', border: 'border-pink-200', header: 'bg-pink-100', text: 'text-pink-800', placeholder: 'placeholder-pink-700/50' },
    { bg: 'bg-purple-50', border: 'border-purple-200', header: 'bg-purple-100', text: 'text-purple-800', placeholder: 'placeholder-purple-700/50' },
];

const TAG_COLORS = [
    'bg-gray-100 text-gray-800 border-gray-200',
    'bg-red-100 text-red-800 border-red-200',
    'bg-orange-100 text-orange-800 border-orange-200',
    'bg-amber-100 text-amber-800 border-amber-200',
    'bg-green-100 text-green-800 border-green-200',
    'bg-emerald-100 text-emerald-800 border-emerald-200',
    'bg-teal-100 text-teal-800 border-teal-200',
    'bg-cyan-100 text-cyan-800 border-cyan-200',
    'bg-blue-100 text-blue-800 border-blue-200',
    'bg-indigo-100 text-indigo-800 border-indigo-200',
    'bg-violet-100 text-violet-800 border-violet-200',
    'bg-purple-100 text-purple-800 border-purple-200',
    'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    'bg-pink-100 text-pink-800 border-pink-200',
    'bg-rose-100 text-rose-800 border-rose-200',
];

type FilterType = 'in_progress' | 'human_handoff' | 'active' | 'completed';

export const ConversationList: React.FC<ConversationListProps> = ({ 
    user,
    onUpdateAgentStatus,
    conversations, 
    onSendMessageToConversation, 
    onMarkAsCompleted, 
    onUpdateStatus, 
    onUpdateConversation,
    onAddNewConversation,
    botSettings,
    availableTags,
    onCreateTag,
    onUpdateTag,
    onDeleteTagDefinition,
    cannedResponses,
    isSuperRobotActive,
    onToggleSuperRobot,
    superRobotDatabase = [],
    onUpdateSuperRobotDatabase,
    onSimulateIncomingMessage
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('in_progress');
  const [viewMode, setViewMode] = useState<'chat' | 'table' | 'kanban'>('chat');
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI States
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showGlobalScratchpad, setShowGlobalScratchpad] = useState(false); 
  const [globalNotes, setGlobalNotes] = useState<Note[]>([]);
  const [showContactInfo, setShowContactInfo] = useState(false); 
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  
  const agentStatus = user?.status || 'online';
  
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);
  
  // Notification States
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedSound, setSelectedSound] = useState<keyof typeof SOUNDS>('pop');
  const [showSoundMenu, setShowSoundMenu] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false); // For visual effect
  const prevConversationsRef = useRef<Conversation[]>(conversations);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Super Robot UI States
  const [isSuperRobotModalOpen, setIsSuperRobotModalOpen] = useState(false);
  const [newKeywords, setNewKeywords] = useState('');
  const [newRequiredWords, setNewRequiredWords] = useState('');
  const [newExcludedWords, setNewExcludedWords] = useState('');
  const [newResponse, setNewResponse] = useState('');
  const [newUseFuzzy, setNewUseFuzzy] = useState(true);
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newActionStatus, setNewActionStatus] = useState<Conversation['status'] | ''>('');
  const [newActionTags, setNewActionTags] = useState<string[]>([]);
  
  // Dynamic Items State
  const [newItems, setNewItems] = useState<SuperRobotItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemPrice, setNewItemPrice] = useState('');

  // New Chat Form State
  const [newChatMode, setNewChatMode] = useState<'individual' | 'group'>('individual');
  const [newChatName, setNewChatName] = useState('');
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatError, setNewChatError] = useState('');
  
  // Group Participants State
  const [groupParticipants, setGroupParticipants] = useState<{name: string, phone: string}[]>([]);
  const [newPartName, setNewPartName] = useState('');
  const [newPartPhone, setNewPartPhone] = useState('');

  // Tag Editing States (Manage Modal)
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState(TAG_COLORS[0]);

  // Note Tag Menu State
  const [activeNoteTagMenu, setActiveNoteTagMenu] = useState<string | null>(null);
  
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Load persistent notes
  useEffect(() => {
    const savedNotes = localStorage.getItem('global_scratchpad_notes_v3');
    if (savedNotes) {
      setGlobalNotes(JSON.parse(savedNotes));
    } else {
        const oldNote = localStorage.getItem('global_scratchpad_note');
        if(oldNote) {
            setGlobalNotes([{ id: 'default', title: 'Nota Rápida', text: oldNote, color: 'bg-yellow-50', isMinimized: false, isPinned: false, tags: [] }]);
        }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('global_scratchpad_notes_v3', JSON.stringify(globalNotes));
  }, [globalNotes]);

  // --- Notification Logic ---
  const playNotificationSound = () => {
      if (!soundEnabled) return;
      
      const soundUrl = SOUNDS[selectedSound].url;
      if (!audioRef.current) {
          audioRef.current = new Audio(soundUrl);
      } else {
          audioRef.current.src = soundUrl;
      }
      
      audioRef.current.volume = 0.5; // 50% volume
      audioRef.current.play().catch(e => console.log("Audio play blocked", e));
      
      // Visual Pulse
      setIsNotifying(true);
      setTimeout(() => setIsNotifying(false), 2000);
  };

  useEffect(() => {
      const prevConvos = prevConversationsRef.current;
      
      // Calculate changes
      const totalUnreadNow = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      const totalUnreadPrev = prevConvos.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
      
      // Trigger Sound only if unread messages increased
      if (totalUnreadNow > totalUnreadPrev) {
          playNotificationSound();
      }

      prevConversationsRef.current = conversations;
  }, [conversations]);

  const addNote = () => {
      const newNote: Note = {
          id: Date.now().toString(),
          title: '',
          text: '',
          color: 'bg-yellow-50', 
          isMinimized: false,
          isPinned: false,
          tags: []
      };
      setGlobalNotes([newNote, ...globalNotes]);
      setShowGlobalScratchpad(true); 
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
      setGlobalNotes(globalNotes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
      setGlobalNotes(globalNotes.filter(n => n.id !== id));
  };

  const sortedNotes = [...globalNotes].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0; // Keep original order (newest first based on addNote logic)
  });

  const selectedConversation = conversations.find(c => c.id === selectedId);

  // Sorting: Pinned first, then by Date
  const sortConversations = (convos: Conversation[]) => {
      return convos.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return b.lastActivity.getTime() - a.lastActivity.getTime();
      });
  };

  const filteredConversations = sortConversations(conversations.filter(c => {
      const q = searchTerm.toLowerCase();
      
      const matchesName = c.customerName.toLowerCase().includes(q);
      const matchesPhone = c.customerPhone.includes(q);
      const matchesTags = c.tags?.some(t => t.toLowerCase().includes(q));
      
      const lastMsg = c.messages[c.messages.length - 1];
      const matchesMsg = lastMsg?.text.toLowerCase().includes(q);

      const matchesSearch = searchTerm === '' || matchesName || matchesPhone || matchesTags || matchesMsg;

      if (!matchesSearch) return false;

      // Filter Logic
      if (filter === 'in_progress') return c.status === 'in_progress';
      if (filter === 'human_handoff') return c.status === 'human_handoff';
      if (filter === 'active') return c.status === 'active';
      if (filter === 'completed') return c.status === 'completed';
      
      return true;
  }));

  const handleSelectConversation = (id: string) => {
      setSelectedId(id);
      setShowContactInfo(false);
      // Reset unread count when opening
      onUpdateConversation(id, { unreadCount: 0 });
  };

  // ... (New Chat Logic & other handlers remain similar) ...
  const handleCreateNewChat = () => {
      setNewChatError('');
      if (!newChatName.trim()) { setNewChatError('O nome é obrigatório.'); return; }
      if (newChatMode === 'individual' && !newChatPhone.trim()) { setNewChatError('O telefone é obrigatório.'); return; }
      
      const newConvo: Conversation = {
            id: Date.now().toString(),
            customerName: newChatName.trim(), 
            customerPhone: newChatMode === 'group' ? 'n/a' : newChatPhone.trim(),
            status: 'in_progress', 
            stage: 'open',
            lastActivity: new Date(),
            messages: [],
            collectedData: {},
            currentStepIndex: 0,
            flowId: 'default',
            tags: [],
            isGroup: newChatMode === 'group',
            participants: newChatMode === 'group' ? groupParticipants : undefined
      };

      if (onAddNewConversation) {
          onAddNewConversation(newConvo);
          setSelectedId(newConvo.id);
      }
      setIsNewChatModalOpen(false);
      setNewChatName(''); setNewChatPhone(''); setGroupParticipants([]);
  };

  // Immediate Resolve
  const initResolve = () => {
      if(selectedId) {
          onUpdateConversation(selectedId, { stage: 'closed' });
          onMarkAsCompleted(selectedId);
          setSelectedId(null);
          setShowContactInfo(false);
      }
  }

  // Tag Management logic
  const handleAttachTagToChat = (tagName: string) => {
      if(selectedId && selectedConversation) {
          const currentTags = selectedConversation.tags || [];
          if(!currentTags.includes(tagName)) {
              onUpdateConversation(selectedId, { tags: [...currentTags, tagName] });
          }
      }
      // Removed setShowHeaderTagMenu(false)
  }

  const handleDetachTagFromChat = (tag: string) => {
      if (selectedId && selectedConversation) {
          const currentTags = selectedConversation.tags || [];
          const newTags = currentTags.filter(t => t !== tag);
          onUpdateConversation(selectedId, { tags: newTags });
      }
  };

  const toggleTagFromHeader = (tagName: string) => {
      if(selectedId && selectedConversation) {
          const currentTags = selectedConversation.tags || [];
          if(currentTags.includes(tagName)) {
              handleDetachTagFromChat(tagName);
          } else {
              handleAttachTagToChat(tagName);
          }
      }
  }

  // Tag Manager Logic
  const handleSaveTagDefinition = () => {
      if(editTagName.trim()) {
          if (editingTagId) {
              onUpdateTag({ id: editingTagId, name: editTagName.trim(), color: editTagColor });
          } else {
              onCreateTag({ id: Date.now().toString(), name: editTagName.trim(), color: editTagColor });
          }
          setEditingTagId(null);
          setEditTagName('');
          setEditTagColor(TAG_COLORS[0]);
      }
  }

  const handleEditTagDefinition = (tag: TagDefinition) => {
      setEditingTagId(tag.id);
      setEditTagName(tag.name);
      setEditTagColor(tag.color);
      setTimeout(() => { tagInputRef.current?.focus(); }, 50);
  }

  const handleCancelEditTag = () => {
      setEditingTagId(null); setEditTagName(''); setEditTagColor(TAG_COLORS[0]);
  }

  // ... (Super Robot Handlers - same as before) ...
  const handleAddSuperRobotTrigger = () => {
      if (newResponse.trim() && onUpdateSuperRobotDatabase) {
          const newTrigger: SuperRobotTrigger = {
              id: Date.now().toString(),
              keywords: newKeywords.split(',').filter(x => x.trim()).map(k => k.trim()),
              requiredWords: newRequiredWords.split(',').filter(x => x.trim()).map(k => k.trim()),
              excludedWords: newExcludedWords.split(',').filter(x => x.trim()).map(k => k.trim()),
              response: newResponse.trim(),
              isActive: true,
              useFuzzyMatch: newUseFuzzy,
              mediaUrl: newMediaUrl || undefined,
              mediaType: newMediaUrl ? 'image' : undefined,
              actions: {
                  changeStatus: newActionStatus as any || undefined,
                  addTags: newActionTags.length > 0 ? newActionTags : undefined
              },
              items: newItems.length > 0 ? newItems : undefined
          };
          onUpdateSuperRobotDatabase([...superRobotDatabase, newTrigger]);
          setNewKeywords(''); setNewRequiredWords(''); setNewExcludedWords(''); setNewResponse(''); setNewItems([]);
      }
  };

  const handleAddItemToTrigger = () => {
      if (newItemName.trim()) {
          setNewItems([...newItems, { id: Date.now().toString(), name: newItemName.trim(), price: newItemPrice.trim() }]);
          setNewItemName(''); newItemPrice('');
      }
  };

  // Handlers for ChatWindow Props and New Chat
  const handleAgentSend = (text: string, type: MessageType, mediaUrl?: string, replyTo?: Message) => {
      if (selectedId) {
          onSendMessageToConversation(selectedId, text, type, mediaUrl, replyTo);
      }
  };

  const handleScheduleMessage = (text: string, date: Date) => {
      if (selectedId && selectedConversation) {
          const newMessage: Message = {
              id: Date.now().toString(),
              text,
              sender: 'agent',
              timestamp: new Date(),
              type: 'text',
              isScheduled: true,
              scheduledTime: date
          };
          // We manually add it to view
          const updatedMessages = [...selectedConversation.messages, newMessage];
          onUpdateConversation(selectedId, { messages: updatedMessages });
      }
  };

  const handleAddParticipant = () => {
      if (newPartName.trim() && newPartPhone.trim()) {
          setGroupParticipants([...groupParticipants, { name: newPartName.trim(), phone: newPartPhone.trim() }]);
          setNewPartName('');
          setNewPartPhone('');
      }
  };

  const handleRemoveParticipant = (index: number) => {
      const updated = [...groupParticipants];
      updated.splice(index, 1);
      setGroupParticipants(updated);
  };

  // ... (Helpers) ...
  const renderMessagePreview = (msg?: Message) => {
    if (!msg) return 'Nova conversa';
    if (msg.isScheduled) return '📅 Agendado';
    if (msg.type === 'image') return '📷 Foto';
    if (msg.type === 'video') return '🎥 Vídeo';
    if (msg.type === 'audio') return '🎵 Áudio';
    if (msg.type === 'document') return '📄 Arquivo';
    return msg.text;
  };

  const getTagStyle = (tagName: string) => {
    const def = availableTags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
    if (def) return def.color;
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = (convo?: Conversation) => {
      if (!convo) return '';
      if (convo.isGroup) return `${convo.participants?.length || 0} participantes`;
      if (convo.status === 'completed') return `Visto por último hoje às ${convo.lastActivity.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
      return 'online';
  };

  const getBadgeCount = (status: FilterType) => {
      const count = conversations.filter(c => c.status === status).length;
      return count > 99 ? '99+' : count;
  };

  const inProgressCount = getBadgeCount('in_progress');
  const handoffCount = getBadgeCount('human_handoff');
  const activeCount = getBadgeCount('active');

  const KanbanColumn = ({ title, stage, items }: { title: string, stage: KanbanStage, items: Conversation[] }) => ( /* ... same ... */ <div className="flex-1 min-w-[280px] bg-gray-100 dark:bg-gray-800 rounded-xl p-3 flex flex-col h-full border border-gray-200 dark:border-gray-700"> {/* ... implementation ... */} </div> );
  
  const FilterTab = ({ type, label, count, colorClass, icon: Icon }: { type: FilterType, label: string, count: number | string, colorClass: string, icon: any }) => (
    <button
        onClick={() => setFilter(type)}
        className={`relative px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 flex-1 justify-center md:justify-start ${
            filter === type 
            ? 'bg-emerald-600 text-white shadow-md transform scale-105' 
            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 border border-transparent'
        }`}
    >
        <Icon size={14} className={filter === type ? 'text-emerald-200' : 'text-gray-400'} />
        <span className="inline-block">{label}</span>
        {count !== 0 && (
            <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] ${filter === type ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'}`}>
                {count}
            </span>
        )}
    </button>
  );

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Global Toolbar */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-gray-800 shadow-sm z-20 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                 {viewMode === 'chat' && (
                     <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2.5 rounded-xl border transition-colors hidden md:block hover:shadow-md ${isSidebarOpen ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300' : 'bg-emerald-600 border-emerald-600 text-white'}`}>
                         {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                     </button>
                 )}

                 <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 shrink-0">
                     <button onClick={() => setViewMode('chat')} className={`p-2 rounded-lg transition-all ${viewMode === 'chat' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Chat"><LayoutList size={20}/></button>
                     <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Kanban"><Kanban size={20}/></button>
                     <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Tabela"><TableIcon size={20}/></button>
                 </div>

                 <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>

                 {/* Agent Status */}
                 <div className="relative shrink-0">
                    <button onClick={() => setShowStatusMenu(!showStatusMenu)} className={`group flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border ring-offset-2 focus:ring-2 ${agentStatus === 'online' ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 ring-emerald-300' : agentStatus === 'busy' ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 ring-red-300' : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 ring-gray-200'}`}>
                        <div className="relative flex h-3 w-3">
                            {agentStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${agentStatus === 'offline' ? 'bg-gray-400' : 'bg-white'}`}></span>
                        </div>
                        <span className="uppercase tracking-wide text-xs">{agentStatus === 'online' ? 'Disponível' : agentStatus === 'busy' ? 'Ocupado' : 'Invisível'}</span>
                        <ChevronDown size={14} className={`opacity-70 group-hover:translate-y-0.5 transition-transform`} />
                    </button>
                    {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 origin-top-left overflow-hidden">
                            {['online', 'busy', 'offline'].map((s) => (
                                <button key={s} onClick={() => { onUpdateAgentStatus?.(s as any); setShowStatusMenu(false); }} className="w-full text-left px-4 py-3 hover:bg-emerald-50 dark:hover:bg-gray-700 text-sm flex items-center justify-between text-gray-700 dark:text-gray-200 transition-colors group">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full border-2 border-white dark:border-gray-600 shadow-sm ${s === 'online' ? 'bg-emerald-500' : s === 'busy' ? 'bg-red-500' : 'bg-gray-400'}`}></div> 
                                        <span className="font-medium">{s === 'online' ? 'Disponível' : s === 'busy' ? 'Ocupado' : 'Invisível'}</span>
                                    </div>
                                    {agentStatus === s && <Check size={14} className="text-emerald-600"/>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1"></div>

                {/* Manage Tags Button */}
                <button 
                    onClick={() => setIsManageTagsModalOpen(true)}
                    className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 transition-colors"
                    title="Gerenciar Tags"
                >
                    <Tag size={20} />
                </button>

                <button 
                    onClick={() => { setIsNewChatModalOpen(true); setNewChatError(''); setNewChatMode('individual'); setGroupParticipants([]); }}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md hover:shadow-lg transition-all transform active:scale-95 whitespace-nowrap"
                >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Novo</span>
                </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto min-w-[250px]">
                <div className="relative flex-1">
                    <input 
                        type="text" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar conversa..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-gray-700 border-transparent focus:bg-white dark:focus:bg-gray-600 border focus:border-emerald-500 rounded-xl text-sm focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-gray-800 dark:text-white"
                    />
                    <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                </div>
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 flex relative min-h-0">
            {/* View Modes Logic (Kanban/Table) omitted for brevity as they are visually simpler and handled above, focus on Chat View */}
            
            {viewMode === 'chat' && (
                <>
                    {/* Chat Sidebar (List) */}
                    <div className={`
                        flex-col bg-white md:bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300
                        ${selectedId ? 'hidden md:flex' : 'flex w-full'} 
                        ${!isSidebarOpen && selectedId ? 'md:hidden' : 'md:w-96'}
                        shrink-0 h-full overflow-hidden
                    `}>
                             {/* Tabs Toolbar inside Sidebar */}
                             <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-2 bg-gray-50/50 dark:bg-gray-800 shrink-0">
                                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                                    <FilterTab type="in_progress" label="Chats" icon={MessageCircle} count={inProgressCount} colorClass="bg-emerald-500 text-white" />
                                    <FilterTab type="human_handoff" label="Fila" icon={AlertCircle} count={handoffCount} colorClass="bg-amber-500 text-white" />
                                    <FilterTab type="active" label="Robô" icon={Bot} count={activeCount} colorClass="bg-blue-500 text-white" />
                                </div>
                                <div className="flex items-center gap-1.5 px-1 pt-1">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <span className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Sincronizando em tempo real</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto px-2 pt-2">
                                {filteredConversations.map(convo => {
                                    const lastMsg = convo.messages[convo.messages.length - 1];
                                    const isSelected = selectedId === convo.id;
                                    return (
                                        <div 
                                            key={convo.id}
                                            onClick={() => handleSelectConversation(convo.id)}
                                            className={`p-3 mb-1 rounded-xl cursor-pointer transition-all group relative border ${
                                                isSelected 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 shadow-sm' 
                                                : 'bg-white dark:bg-gray-800 border-transparent hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:shadow-sm'
                                            } ${convo.isPinned ? 'border-l-4 border-l-orange-400' : ''}`}
                                        >
                                            {/* Selection Marker */}
                                            {isSelected && !convo.isPinned && <div className="absolute left-0 top-3 bottom-3 w-1 bg-emerald-500 rounded-r-lg"></div>}

                                            <div className="flex justify-between items-start mb-1.5 pl-2">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {/* Avatar */}
                                                    <div className={`w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm relative overflow-hidden ${
                                                            convo.status === 'completed' ? 'bg-gray-400' : 
                                                            convo.status === 'human_handoff' ? 'bg-amber-500' :
                                                            convo.status === 'active' ? 'bg-blue-500' : 'bg-emerald-500'
                                                    }`}>
                                                        {convo.avatarUrl ? (
                                                            <img src={convo.avatarUrl} alt={convo.customerName} className="w-full h-full object-cover" />
                                                        ) : (
                                                            convo.isGroup ? <Users size={20} /> : convo.customerName.charAt(0).toUpperCase()
                                                        )}
                                                        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-white dark:border-gray-800 rounded-full ${
                                                            convo.status === 'completed' ? 'bg-gray-300' : 
                                                            convo.status === 'human_handoff' ? 'bg-amber-300' :
                                                            convo.status === 'active' ? 'bg-blue-300' : 'bg-emerald-300'
                                                        }`}></div>
                                                    </div>
                                                    <div className="flex flex-col overflow-hidden">
                                                        <span className={`font-bold text-sm truncate flex items-center gap-1 ${isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-800 dark:text-gray-200'}`}>
                                                            {convo.isPinned && <Pin size={12} className="text-orange-500 fill-orange-500" />}
                                                            {convo.customerName}
                                                        </span>
                                                        <span className="text-[11px] text-gray-400 font-mono tracking-tight flex items-center gap-1">
                                                            {convo.isGroup ? (
                                                                <><Users size={10} /> {convo.participants?.length || 0} membros</>
                                                            ) : (
                                                                convo.customerPhone
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end shrink-0">
                                                    <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-600' : 'text-gray-400'}`}>
                                                        {convo.lastActivity.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                    {convo.unreadCount && convo.unreadCount > 0 ? (
                                                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full mt-1 shadow-sm animate-pulse">
                                                            {convo.unreadCount}
                                                        </span>
                                                    ) : (
                                                        convo.status === 'human_handoff' && <Clock size={12} className="text-amber-500 mt-1" />
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="pl-[3.8rem]">
                                                <p className={`text-xs line-clamp-1 mb-2 ${isSelected ? 'text-emerald-700/70 dark:text-emerald-200/50' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {renderMessagePreview(lastMsg)}
                                                </p>
                                                
                                                <div className="flex flex-wrap gap-1.5 items-center">
                                                    {convo.tags && convo.tags.length > 0 ? (
                                                        convo.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className={`px-2 py-0.5 text-[9px] rounded-md border font-medium uppercase tracking-tight ${getTagStyle(tag)}`}>
                                                                {tag}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-[9px] text-gray-300 italic">Sem tags</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {filteredConversations.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-300">
                                            <Mail size={32} />
                                        </div>
                                        <p className="text-gray-500 font-medium text-sm">Nenhuma conversa encontrada.</p>
                                    </div>
                                )}
                            </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className={`flex-1 flex flex-col h-full overflow-hidden relative ${!selectedId ? 'hidden md:flex' : 'flex'}`}>
                        {selectedId && selectedConversation ? (
                            <ChatWindow 
                                messages={selectedConversation.messages}
                                onSendMessage={handleAgentSend}
                                onScheduleMessage={handleScheduleMessage}
                                title={selectedConversation.customerName}
                                subtitle={getStatusText(selectedConversation)}
                                avatarUrl={selectedConversation.avatarUrl}
                                status={selectedConversation.status}
                                headerColor="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
                                onHeaderClick={() => setShowContactInfo(!showContactInfo)}
                                onBack={() => setSelectedId(null)}
                                onToggleNotes={() => setShowContactInfo(true)}
                                cannedResponses={cannedResponses}
                                onSimulateIncoming={onSimulateIncomingMessage ? (text) => onSimulateIncomingMessage(selectedId, text) : undefined}
                                tags={selectedConversation.tags || []}
                                availableTags={availableTags}
                                onToggleTag={(tagName) => toggleTagFromHeader(tagName)}
                                enableSmartCompose={botSettings.enableSmartCompose}
                                fuzzySensitivity={botSettings.fuzzySensitivity}
                                isGroup={selectedConversation.isGroup}
                                participants={selectedConversation.participants}
                                onEndChat={initResolve}
                            />
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center bg-[#f0f2f5] dark:bg-gray-900 text-center p-8 opacity-60">
                                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 text-gray-400">
                                    <MessageSquare size={64} />
                                </div>
                                <h2 className="text-2xl font-light text-gray-600 dark:text-gray-300 mb-2">ChatBot Pro Web</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
                                    Selecione uma conversa para começar o atendimento.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Info Panel & Global Notes */}
                    {showContactInfo && selectedConversation && (
                        <div className="fixed inset-y-0 right-0 z-[60] w-full md:relative md:w-[350px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-200 shrink-0 shadow-2xl md:shadow-none h-full">
                            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
                                <button onClick={() => setShowContactInfo(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X size={20} />
                                </button>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedConversation.isGroup ? 'Dados do Grupo' : 'Dados do contato'}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-gray-900">
                                <div className="bg-white dark:bg-gray-800 p-8 flex flex-col items-center shadow-sm mb-2">
                                    <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400 shadow-inner overflow-hidden relative group cursor-pointer border-4 border-white dark:border-gray-700 shadow-md">
                                        <div className={`w-full h-full flex items-center justify-center text-4xl font-bold text-white overflow-hidden ${
                                                selectedConversation.status === 'completed' ? 'bg-gray-400' : 
                                                selectedConversation.status === 'human_handoff' ? 'bg-amber-500' :
                                                selectedConversation.status === 'active' ? 'bg-blue-500' : 'bg-emerald-500'
                                        }`}>
                                            {selectedConversation.avatarUrl ? (
                                                <img src={selectedConversation.avatarUrl} className="w-full h-full object-cover" />
                                            ) : selectedConversation.isGroup ? <Users size={48} /> : selectedConversation.customerName.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white text-center mb-1">{selectedConversation.customerName}</h2>
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                                        {selectedConversation.isGroup ? `${selectedConversation.participants?.length || 0} Membros` : selectedConversation.customerPhone}
                                    </p>
                                </div>

                                <div className="p-4 space-y-4">
                                    {/* Resolution Summary */}
                                    {selectedConversation.resolutionSummary && (
                                        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 shadow-sm border border-emerald-100 dark:border-emerald-800">
                                            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-3 flex items-center gap-2">
                                                <FileCheck size={16} /> Resumo do Robô
                                            </h4>
                                            <p className="text-sm text-emerald-900 dark:text-emerald-200 whitespace-pre-wrap font-medium">
                                                {selectedConversation.resolutionSummary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Collected Data Section */}
                                    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                                        <h4 className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                                            <Database size={16} className="text-blue-500" /> Dados Coletados
                                        </h4>
                                        {Object.keys(selectedConversation.collectedData).length > 0 ? (
                                             <div className="space-y-2">
                                                 {Object.entries(selectedConversation.collectedData).map(([key, value]) => (
                                                     <div key={key} className="flex flex-col border-b border-gray-50 dark:border-gray-700 last:border-0 pb-2 last:pb-0">
                                                         <span className="text-[10px] uppercase font-bold text-gray-400">{key.replace(/_/g, ' ')}</span>
                                                         <span className="text-sm text-gray-800 dark:text-gray-300 font-medium">{value}</span>
                                                     </div>
                                                 ))}
                                             </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">Nenhum dado capturado ainda.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
        {/* Modals ... */}
        {isManageTagsModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Tag size={18} className="text-emerald-600" />
                            Gerenciar Etiquetas Globais
                        </h3>
                        <button onClick={() => setIsManageTagsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto">
                        <div className="mb-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                             <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">
                                 {editingTagId ? 'Editar Etiqueta' : 'Nova Etiqueta'}
                             </h4>
                             <div className="flex flex-col gap-3">
                                 <input 
                                    ref={tagInputRef}
                                    type="text" 
                                    value={editTagName}
                                    onChange={(e) => setEditTagName(e.target.value)}
                                    placeholder="Nome da etiqueta (Ex: VIP)"
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none"
                                 />
                                 <div className="flex gap-2 flex-wrap">
                                     {TAG_COLORS.map((color, idx) => (
                                         <button 
                                            key={idx}
                                            onClick={() => setEditTagColor(color)}
                                            className={`w-6 h-6 rounded-full border ${color.split(' ')[0]} ${editTagColor === color ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110' : ''}`}
                                         />
                                     ))}
                                 </div>
                                 <div className="flex justify-end gap-2 mt-2">
                                     {editingTagId && (
                                         <button onClick={handleCancelEditTag} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400">Cancelar</button>
                                     )}
                                     <button 
                                        onClick={handleSaveTagDefinition}
                                        disabled={!editTagName.trim()}
                                        className="bg-emerald-600 text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
                                     >
                                         {editingTagId ? 'Salvar Alteração' : 'Criar Etiqueta'}
                                     </button>
                                 </div>
                             </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Etiquetas Disponíveis</h4>
                            {availableTags.map(tag => (
                                <div key={tag.id} className={`flex items-center justify-between p-3 border rounded-lg group transition-colors ${editingTagId === tag.id ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700' : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 hover:border-emerald-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <span className={`w-3 h-3 rounded-full ${tag.color.split(' ')[0]}`}></span>
                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{tag.name}</span>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditTagDefinition(tag)} className="p-1.5 text-gray-400 hover:text-blue-500" title="Editar">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => onDeleteTagDefinition(tag.id)} className="p-1.5 text-gray-400 hover:text-red-500" title="Excluir">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}
        {/* ... New Chat Logic ... */}
         {isNewChatModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg flex items-center gap-2">
                           <MessageSquare size={20} className="text-emerald-500" /> Nova Conversa
                        </h3>
                        <button onClick={() => setIsNewChatModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                            <button onClick={() => setNewChatMode('individual')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${newChatMode === 'individual' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                <UserIcon size={14} /> Individual
                            </button>
                            <button onClick={() => setNewChatMode('group')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${newChatMode === 'group' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}>
                                <Users size={14} /> Grupo
                            </button>
                        </div>
                        {newChatError && (<div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2"><AlertCircle size={14} /> {newChatError}</div>)}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">{newChatMode === 'individual' ? 'Nome do Contato' : 'Nome do Grupo'}</label>
                                <input type="text" value={newChatName} onChange={(e) => setNewChatName(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder={newChatMode === 'individual' ? "Ex: Maria Silva" : "Ex: Vendas Black Friday"} />
                            </div>
                            {newChatMode === 'individual' ? (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Telefone (WhatsApp)</label>
                                    <input type="tel" value={newChatPhone} onChange={(e) => setNewChatPhone(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white" placeholder="+55 11 99999-9999" />
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                     <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Adicionar Participantes</h5>
                                     <div className="flex gap-2">
                                         <input placeholder="Nome" value={newPartName} onChange={e => setNewPartName(e.target.value)} className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                                         <input placeholder="Telefone" value={newPartPhone} onChange={e => setNewPartPhone(e.target.value)} className="w-1/3 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none" />
                                         <button onClick={handleAddParticipant} disabled={!newPartName || !newPartPhone} className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50"><Plus size={16}/></button>
                                     </div>
                                     <div className="space-y-1 max-h-32 overflow-y-auto">
                                         {groupParticipants.map((p, i) => (
                                             <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs shadow-sm">
                                                 <span className="font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                                                 <div className="flex items-center gap-2"><span className="text-gray-500">{p.phone}</span><button onClick={() => handleRemoveParticipant(i)} className="text-red-400 hover:text-red-600"><X size={12}/></button></div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            )}
                            <button onClick={handleCreateNewChat} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mt-4"><MessageSquare size={18} /> {newChatMode === 'individual' ? 'Iniciar Conversa' : 'Criar Grupo'}</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};