import React, { useState, useEffect, useRef } from 'react';
import { Conversation, MessageType, BotSettings, TagDefinition, Message, CannedResponse, KanbanStage, SuperRobotTrigger, User, SuperRobotItem } from '../types';
import { ChatWindow } from '../components/ChatWindow';
import { Search, User as UserIcon, CheckCircle, Mail, Phone, Tag, MessageSquare, LayoutList, Table as TableIcon, Download, Hand, Bot, Power, Save, FileText, Edit2, Plus, X, FileDown, Camera, Mic, Video, Image as ImageIcon, StickyNote, ChevronDown, ChevronUp, UserPlus, MoreVertical, Ban, Flag, Trash2, Circle, Clock, Palette, AlertCircle, Archive, Check, Kanban, GripHorizontal, ArrowLeft, MessageCircle, Zap, Database, Filter, SlidersHorizontal, MoreHorizontal, Radio, Pin, PinOff, Volume2, Bell, BellRing, Play, BellOff, Lock, Sparkles, Fingerprint, PanelLeftClose, PanelLeftOpen, List, Users } from 'lucide-react';

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
    isPinned?: boolean; // New: Pin capability
    tags?: string[]; // New: Tags on notes
}

// Sound Assets (Using reliable CDNs)
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
  
  // Usar status do usuário ou 'online' como fallback
  const agentStatus = user?.status || 'online';
  
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [isManageTagsModalOpen, setIsManageTagsModalOpen] = useState(false);
  const [showHeaderTagMenu, setShowHeaderTagMenu] = useState(false);
  
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

  // Local state for adding/editing tags in a specific chat
  const [isAddingTagToChat, setIsAddingTagToChat] = useState(false);
  
  // Tag Editing States (Manage Modal)
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editTagName, setEditTagName] = useState('');
  const [editTagColor, setEditTagColor] = useState(TAG_COLORS[0]);

  // Note Tag Menu State
  const [activeNoteTagMenu, setActiveNoteTagMenu] = useState<string | null>(null);
  
  // Input Ref
  const tagInputRef = useRef<HTMLInputElement>(null);

  // Load persistent notes
  useEffect(() => {
    const savedNotes = localStorage.getItem('global_scratchpad_notes_v3'); // Version bumped
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
      
      const handoffNow = conversations.filter(c => c.status === 'human_handoff').length;
      const handoffPrev = prevConvos.filter(c => c.status === 'human_handoff').length;

      // Trigger Sound if unread messages increased OR pending chats increased
      if (totalUnreadNow > totalUnreadPrev || handoffNow > handoffPrev) {
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
      // Add new notes to the top, but below pinned notes (handled by sort)
      setGlobalNotes([newNote, ...globalNotes]);
      setShowGlobalScratchpad(true); 
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
      setGlobalNotes(globalNotes.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  const deleteNote = (id: string) => {
      setGlobalNotes(globalNotes.filter(n => n.id !== id));
  };

  const toggleNoteTag = (noteId: string, tagName: string) => {
      const note = globalNotes.find(n => n.id === noteId);
      if (note) {
          const currentTags = note.tags || [];
          if (currentTags.includes(tagName)) {
              updateNote(noteId, { tags: currentTags.filter(t => t !== tagName) });
          } else {
              updateNote(noteId, { tags: [...currentTags, tagName] });
          }
      }
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

  const handleTogglePin = (id: string, currentPinStatus: boolean | undefined) => {
      onUpdateConversation(id, { isPinned: !currentPinStatus });
  };

  const handleAgentSend = (text: string, type: MessageType, mediaUrl?: string, replyTo?: Message) => {
      if (selectedId) {
          onSendMessageToConversation(selectedId, text, type, mediaUrl, replyTo);
      }
  };

  const handleScheduleMessage = (text: string, date: Date) => {
      if (selectedId && selectedConversation) {
          const newMessage = {
              id: Date.now().toString(),
              text,
              sender: 'agent' as const, 
              timestamp: new Date(),
              type: 'text' as MessageType,
              isScheduled: true,
              scheduledTime: date
          };
          
          const updatedMessages = [...selectedConversation.messages, newMessage];
          onUpdateConversation(selectedId, { messages: updatedMessages });
      }
  };

  // Group Management Helpers
  const handleAddParticipant = () => {
      if (newPartName && newPartPhone) {
          setGroupParticipants([...groupParticipants, { name: newPartName, phone: newPartPhone }]);
          setNewPartName('');
          setNewPartPhone('');
      }
  };

  const handleRemoveParticipant = (index: number) => {
      const newParts = [...groupParticipants];
      newParts.splice(index, 1);
      setGroupParticipants(newParts);
  };

  const handleCreateNewChat = () => {
      setNewChatError('');
      
      if (!newChatName.trim()) {
          setNewChatError('O nome é obrigatório.');
          return;
      }

      if (newChatMode === 'individual') {
          if (!newChatPhone.trim()) {
              setNewChatError('O telefone é obrigatório.');
              return;
          }
          const existing = conversations.find(c => c.customerPhone.replace(/\D/g, '') === newChatPhone.replace(/\D/g, ''));
          if (existing) {
              setNewChatError('Já existe uma conversa com este número.');
              return;
          }
      } else {
          // Group Validation
          if (groupParticipants.length === 0) {
              setNewChatError('Adicione pelo menos um participante ao grupo.');
              return;
          }
      }
      
      const newConvo: Conversation = {
            id: Date.now().toString(),
            customerName: newChatName.trim(), // For groups, this is the Group Subject
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
      setNewChatName('');
      setNewChatPhone('');
      setGroupParticipants([]);
      setNewChatMode('individual');
  };

  const toggleBotStatus = () => {
      if (!selectedConversation) return;
      if (selectedConversation.status === 'active') {
          onUpdateStatus(selectedConversation.id, 'in_progress');
      } else {
          onUpdateStatus(selectedConversation.id, 'active');
      }
  };

  // Immediate Resolve - No Modal
  const initResolve = () => {
      if(selectedId) {
          onUpdateConversation(selectedId, { stage: 'closed' });
          onMarkAsCompleted(selectedId);
          setSelectedId(null);
          setShowContactInfo(false);
      }
  }

  const handleAttachTagToChat = (tagName: string) => {
      if(selectedId && selectedConversation) {
          const currentTags = selectedConversation.tags || [];
          if(!currentTags.includes(tagName)) {
              onUpdateConversation(selectedId, { tags: [...currentTags, tagName] });
          }
      }
      setIsAddingTagToChat(false);
      setShowHeaderTagMenu(false); 
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
      setTimeout(() => {
          tagInputRef.current?.focus();
      }, 50);
  }

  const handleCancelEditTag = () => {
      setEditingTagId(null);
      setEditTagName('');
      setEditTagColor(TAG_COLORS[0]);
  }

  // Super Robot Logic
  const handleAddItemToTrigger = () => {
      if (newItemName.trim()) {
          setNewItems([...newItems, { id: Date.now().toString(), name: newItemName.trim(), price: newItemPrice.trim() }]);
          setNewItemName('');
          setNewItemPrice('');
      }
  };

  const handleRemoveItemFromTrigger = (itemId: string) => {
      setNewItems(newItems.filter(i => i.id !== itemId));
  };

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
          
          if(newTrigger.keywords.length === 0 && newTrigger.requiredWords?.length === 0) {
              alert("Adicione pelo menos uma Palavra-Chave ou Palavra Obrigatória.");
              return;
          }

          onUpdateSuperRobotDatabase([...superRobotDatabase, newTrigger]);
          setNewKeywords('');
          setNewRequiredWords('');
          setNewExcludedWords('');
          setNewResponse('');
          setNewUseFuzzy(true);
          setNewMediaUrl('');
          setNewActionStatus('');
          setNewActionTags([]);
          setNewItems([]);
      }
  };

  const handleDeleteSuperRobotTrigger = (id: string) => {
      if(onUpdateSuperRobotDatabase) {
          onUpdateSuperRobotDatabase(superRobotDatabase.filter(t => t.id !== id));
      }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      e.dataTransfer.setData("text/plain", id);
  };

  const handleDrop = (e: React.DragEvent, stage: KanbanStage) => {
      e.preventDefault();
      const id = e.dataTransfer.getData("text/plain");
      onUpdateConversation(id, { stage });
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
  };

  // ... (Render helpers same as before) ...
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

  // --- Sub-components (Kanban) ---

  const KanbanColumn = ({ title, stage, items }: { title: string, stage: KanbanStage, items: Conversation[] }) => (
      <div 
        className="flex-1 min-w-[280px] bg-gray-100 dark:bg-gray-800 rounded-xl p-3 flex flex-col h-full border border-gray-200 dark:border-gray-700"
        onDrop={(e) => handleDrop(e, stage)}
        onDragOver={handleDragOver}
      >
          <div className="flex justify-between items-center mb-3 px-1">
              <h4 className="font-bold text-gray-700 dark:text-gray-300 uppercase text-xs tracking-wider">{title}</h4>
              <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">{items.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3">
              {items.map(c => (
                  <div 
                    key={c.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, c.id)}
                    onClick={() => { setSelectedId(c.id); setViewMode('chat'); }}
                    className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group"
                  >
                      <div className="flex justify-between items-start mb-2">
                          <span className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1">
                              {c.isGroup && <Users size={14} className="text-gray-500" />}
                              {c.customerName}
                          </span>
                          <GripHorizontal size={14} className="text-gray-300 opacity-0 group-hover:opacity-100" />
                      </div>
                      <p className="text-xs text-gray-500 mb-2 truncate">{renderMessagePreview(c.messages[c.messages.length - 1])}</p>
                      <div className="flex gap-1 flex-wrap">
                          {c.tags?.slice(0, 2).map(t => (
                              <span key={t} className={`w-2 h-2 rounded-full ${getTagStyle(t).split(' ')[0]}`} />
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

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
    // Layer Fix: Removed rounded corners/borders on desktop to be fully flush
    <div className="flex h-full w-full flex-col bg-white dark:bg-gray-900 relative overflow-hidden">
        {/* Global Toolbar */}
        <div className={`px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-gray-800 shadow-sm z-20 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            {/* ... (Existing toolbar code) ... */}
            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                 {/* Sidebar Toggle (Only relevant in desktop chat view) */}
                 {viewMode === 'chat' && (
                     <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className={`p-2.5 rounded-xl border transition-colors hidden md:block hover:shadow-md ${isSidebarOpen ? 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-300' : 'bg-emerald-600 border-emerald-600 text-white'}`}
                        title={isSidebarOpen ? "Focar no Chat (Esconder Lista)" : "Mostrar Lista"}
                     >
                         {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                     </button>
                 )}

                 {/* View Mode Toggle */}
                 <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 shrink-0">
                     <button onClick={() => setViewMode('chat')} className={`p-2 rounded-lg transition-all ${viewMode === 'chat' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Chat"><LayoutList size={20}/></button>
                     <button onClick={() => setViewMode('kanban')} className={`p-2 rounded-lg transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Kanban"><Kanban size={20}/></button>
                     <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Tabela"><TableIcon size={20}/></button>
                 </div>

                 <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2 hidden md:block"></div>

                 {/* Agent Status Selector - REDESIGNED FOR VISIBILITY */}
                 <div className="relative shrink-0">
                    <button 
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className={`group flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full text-sm font-bold shadow-sm transition-all border ring-offset-2 focus:ring-2 ${
                            agentStatus === 'online' 
                            ? 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 ring-emerald-300' 
                            : agentStatus === 'busy' 
                            ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 ring-red-300'
                            : 'bg-gray-100 text-gray-600 border-gray-300 hover:bg-gray-200 ring-gray-200'
                        }`}
                        title="Mudar meu status"
                    >
                        <div className="relative flex h-3 w-3">
                            {agentStatus === 'online' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>}
                            <span className={`relative inline-flex rounded-full h-3 w-3 ${agentStatus === 'offline' ? 'bg-gray-400' : 'bg-white'}`}></span>
                        </div>
                        <span className="uppercase tracking-wide text-xs">{agentStatus === 'online' ? 'Disponível' : agentStatus === 'busy' ? 'Ocupado' : 'Invisível'}</span>
                        <ChevronDown size={14} className={`opacity-70 group-hover:translate-y-0.5 transition-transform`} />
                    </button>
                    {showStatusMenu && (
                        <div className="absolute top-full left-0 mt-2 w-52 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 py-2 animate-in fade-in zoom-in-95 origin-top-left overflow-hidden">
                            <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 mb-1">Meu Status</div>
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

                {/* Global Notes Toggle */}
                <button 
                    onClick={() => {
                        if (!showGlobalScratchpad && globalNotes.length === 0) addNote();
                        setShowGlobalScratchpad(!showGlobalScratchpad);
                    }}
                    className={`p-2.5 rounded-xl border transition-all relative ${
                        showGlobalScratchpad
                        ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700 shadow-sm' 
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                    }`}
                    title="Notas Globais"
                >
                    <StickyNote size={20} />
                    {globalNotes.length > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800">
                            {globalNotes.length}
                        </span>
                    )}
                </button>

                {/* Sound Notification Settings */}
                <div className="relative shrink-0">
                    <button 
                        onClick={() => setShowSoundMenu(!showSoundMenu)}
                        className={`p-2.5 rounded-xl border transition-all relative ${
                            soundEnabled 
                            ? 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50' 
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700'
                        }`}
                        title="Configurar Notificações"
                    >
                        {isNotifying && soundEnabled && (
                            <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                            </span>
                        )}
                        {soundEnabled ? <BellRing size={20} className={isNotifying ? 'text-emerald-500 animate-pulse' : ''} /> : <BellOff size={20} />}
                    </button>
                    
                    {showSoundMenu && (
                        <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95">
                            <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Notificações Sonoras</h4>
                                <button 
                                    onClick={() => setSoundEnabled(!soundEnabled)} 
                                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${soundEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${soundEnabled ? 'translate-x-4.5' : 'translate-x-1'}`} />
                                </button>
                            </div>
                            
                            <div className={`space-y-2 ${!soundEnabled ? 'opacity-50 pointer-events-none' : ''}`}>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Som de Alerta</label>
                                <div className="space-y-1">
                                    {(Object.keys(SOUNDS) as Array<keyof typeof SOUNDS>).map((key) => (
                                        <button 
                                            key={key}
                                            onClick={() => { setSelectedSound(key); playNotificationSound(); }}
                                            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm border transition-colors ${
                                                selectedSound === key 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                                                : 'bg-gray-50 dark:bg-gray-700/50 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400'
                                            }`}
                                        >
                                            <span className="flex items-center gap-2">
                                                {selectedSound === key && <Volume2 size={14} />}
                                                {SOUNDS[key].label}
                                            </span>
                                            {selectedSound === key && <Check size={14} />}
                                        </button>
                                    ))}
                                </div>
                                <button 
                                    onClick={playNotificationSound}
                                    className="w-full mt-2 text-xs text-center text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium flex items-center justify-center gap-1 py-1"
                                >
                                    <Play size={10} /> Testar Volume
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Super Robot Toggle & Settings */}
                <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 px-3 py-2 rounded-xl shrink-0">
                    <button 
                        onClick={onToggleSuperRobot}
                        className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${isSuperRobotActive ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                        title={isSuperRobotActive ? 'Super Robô Ativo' : 'Super Robô Inativo'}
                    >
                        <span className={`inline-block w-3 h-3 transform transition-transform duration-200 bg-white rounded-full shadow ${isSuperRobotActive ? 'translate-x-5' : 'translate-x-1'}`} />
                    </button>
                    <div className="flex flex-col leading-none hidden xl:flex">
                        <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 uppercase">Super Robô</span>
                        <span className="text-[9px] text-indigo-600/70 dark:text-indigo-400/70">{isSuperRobotActive ? 'ON' : 'OFF'}</span>
                    </div>
                    <button 
                        onClick={() => setIsSuperRobotModalOpen(true)}
                        className="ml-1 p-1.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg text-indigo-600 dark:text-indigo-400 transition-colors"
                        title="Configurar Respostas do Robô"
                    >
                        <Database size={16} />
                    </button>
                </div>

                <div className="flex-1"></div>

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

        {/* Content Area - Same as before */}
        <div className="flex-1 overflow-hidden bg-white dark:bg-gray-900 flex relative min-h-0">
            {viewMode === 'kanban' && (
                <div className="h-full w-full overflow-x-auto p-6 flex gap-6 bg-gray-50 dark:bg-gray-900">
                    <KanbanColumn title="Novos" stage="new" items={filteredConversations.filter(c => (!c.stage || c.stage === 'new') && c.status !== 'completed')} />
                    <KanbanColumn title="Em Atendimento" stage="open" items={filteredConversations.filter(c => c.stage === 'open' && c.status !== 'completed')} />
                    <KanbanColumn title="Aguardando" stage="pending" items={filteredConversations.filter(c => c.stage === 'pending' && c.status !== 'completed')} />
                    <KanbanColumn title="Finalizados" stage="closed" items={filteredConversations.filter(c => c.stage === 'closed' || c.status === 'completed')} />
                </div>
            )}

            {/* ... Table View ... */}
            {viewMode === 'table' && (
                <div className="h-full w-full overflow-auto">
                     <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 whitespace-nowrap">Data</th>
                                <th className="px-6 py-3 whitespace-nowrap">Nome</th>
                                <th className="px-6 py-3 whitespace-nowrap">Telefone</th>
                                <th className="px-6 py-3 whitespace-nowrap">Tags</th>
                                <th className="px-6 py-3 whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredConversations.map(c => (
                                <tr 
                                    key={c.id} 
                                    onClick={() => handleSelectConversation(c.id)}
                                    className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">{c.lastActivity.toLocaleDateString()}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap flex items-center gap-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold overflow-hidden ${c.status === 'completed' ? 'bg-gray-400' : 'bg-emerald-500'}`}>
                                            {c.avatarUrl ? <img src={c.avatarUrl} className="w-full h-full object-cover" /> : c.isGroup ? <Users size={14} /> : c.customerName.charAt(0).toUpperCase()}
                                        </div>
                                        {c.customerName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">{c.isGroup ? `${c.participants?.length || 0} membros` : c.customerPhone}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {(c.tags || []).slice(0, 2).map(t => (
                                                <span key={t} className={`w-2 h-2 rounded-full ${getTagStyle(t).split(' ')[0]}`} title={t} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            c.status === 'completed' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                                            c.status === 'human_handoff' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' :
                                            c.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 
                                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                        }`}>
                                            {c.status === 'completed' ? 'Concluído' : c.status === 'human_handoff' ? 'Pendente' : c.status === 'in_progress' ? 'Atendendo' : 'Robô'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-emerald-600 hover:underline text-xs font-medium">Ver Chat</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Chat View is the same as previous file */}
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
                             <div className="px-3 py-3 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto bg-gray-50/50 dark:bg-gray-800 scrollbar-hide shrink-0">
                                <FilterTab 
                                    type="in_progress" 
                                    label="Chats" 
                                    icon={MessageCircle}
                                    count={inProgressCount} 
                                    colorClass="bg-emerald-500 text-white" 
                                />
                                <FilterTab 
                                    type="human_handoff" 
                                    label="Fila" 
                                    icon={AlertCircle}
                                    count={handoffCount} 
                                    colorClass="bg-amber-500 text-white" 
                                />
                                <FilterTab 
                                    type="active" 
                                    label="Robô" 
                                    icon={Bot}
                                    count={activeCount} 
                                    colorClass="bg-blue-500 text-white" 
                                />
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

                                            {/* Quick Pull Actions */}
                                            {(convo.status === 'active' || convo.status === 'human_handoff') && (
                                                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUpdateStatus(convo.id, 'in_progress');
                                                        }}
                                                        className={`p-2 rounded-full shadow-md hover:scale-110 transition-transform flex items-center justify-center ${
                                                            convo.status === 'active' 
                                                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
                                                            : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                                                        }`}
                                                        title="Puxar para Chats"
                                                    >
                                                        <ArrowLeft size={18} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}

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
                                                        {/* Status Dot */}
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
                                                        <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full mt-1 shadow-sm">
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
                                        <p className="text-gray-400 text-xs mt-1">Tente mudar o filtro ou buscar outro nome.</p>
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
                                // New Props for Writing Assistant
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
                                    Envie e receba mensagens sem precisar manter seu celular conectado. <br/>
                                    Use o WhatsApp em até 4 aparelhos e 1 celular ao mesmo tempo.
                                </p>
                                <div className="mt-8 flex items-center gap-2 text-xs text-gray-400">
                                    <Lock size={12} /> Protegido com criptografia de ponta-a-ponta
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Info Panel & Global Notes */}
                    {showContactInfo && selectedConversation && (
                        // ... (Existing Contact Info logic)
                        <div className="fixed inset-y-0 right-0 z-[60] w-full md:relative md:w-[350px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-right-10 duration-200 shrink-0 shadow-2xl md:shadow-none h-full">
                            {/* ... Content same as before ... */}
                            <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
                                <button onClick={() => setShowContactInfo(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X size={20} />
                                </button>
                                <span className="font-semibold text-gray-700 dark:text-gray-200">{selectedConversation.isGroup ? 'Dados do Grupo' : 'Dados do contato'}</span>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto bg-[#f0f2f5] dark:bg-gray-900">
                                {/* Profile Header */}
                                <div className="bg-white dark:bg-gray-800 p-8 flex flex-col items-center shadow-sm mb-2">
                                    <div className="w-40 h-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4 text-gray-400 shadow-inner overflow-hidden relative group cursor-pointer border-4 border-white dark:border-gray-700 shadow-md">
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors"></div>
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
                                    
                                    {selectedConversation.isGroup && (
                                        <div className="mt-4 w-full px-2">
                                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-2">Participantes</h5>
                                            <div className="space-y-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg max-h-32 overflow-y-auto">
                                                {selectedConversation.participants?.map((p, i) => (
                                                    <div key={i} className="text-xs text-gray-600 dark:text-gray-300 flex justify-between">
                                                        <span>{p.name}</span>
                                                        <span className="text-gray-400">{p.phone}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* ... action buttons ... */}
                                </div>
                                {/* ... tags ... */}
                                {/* ... notes ... */}
                            </div>
                        </div>
                    )}

                    {showGlobalScratchpad && (
                        // Global Notes Sidebar
                        <div className="fixed inset-y-0 right-0 z-[60] w-full md:relative md:w-80 bg-gray-50 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col shrink-0 animate-in slide-in-from-right-20 duration-300 h-full shadow-2xl md:shadow-none">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
                                <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                    <StickyNote size={18} className="text-yellow-500" /> Notas Globais
                                </h3>
                                <div className="flex items-center gap-2">
                                    <button onClick={addNote} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-emerald-600 dark:text-emerald-400" title="Nova Nota">
                                        <Plus size={18} />
                                    </button>
                                    <button onClick={() => setShowGlobalScratchpad(false)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400">
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {sortedNotes.map(note => {
                                    const colorScheme = NOTE_COLORS.find(c => c.bg === note.color) || NOTE_COLORS[0];
                                    return (
                                        <div key={note.id} className={`${colorScheme.bg} border ${colorScheme.border} rounded-xl shadow-sm overflow-hidden group transition-all relative ${note.isPinned ? 'ring-2 ring-yellow-400 ring-offset-1' : ''}`}>
                                            <div className={`${colorScheme.header} px-3 py-2 flex justify-between items-center`}>
                                                <input 
                                                    value={note.title} 
                                                    onChange={(e) => updateNote(note.id, { title: e.target.value })}
                                                    className={`bg-transparent text-xs font-bold uppercase tracking-wide ${colorScheme.text} placeholder-opacity-50 outline-none w-full`}
                                                    placeholder="TÍTULO..."
                                                />
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => updateNote(note.id, { isPinned: !note.isPinned })} className={`p-1 rounded hover:bg-white/50 ${note.isPinned ? 'text-yellow-600' : 'text-gray-400'}`}>
                                                        {note.isPinned ? <PinOff size={12}/> : <Pin size={12}/>}
                                                    </button>
                                                    
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveNoteTagMenu(activeNoteTagMenu === note.id ? null : note.id); }}
                                                            className="p-1 rounded hover:bg-white/50 text-gray-500"
                                                        >
                                                            <Palette size={12}/>
                                                        </button>
                                                        {activeNoteTagMenu === note.id && (
                                                            <div className="absolute top-6 right-0 bg-white shadow-lg rounded-lg p-2 flex gap-1 z-10 border border-gray-100">
                                                                {NOTE_COLORS.map(c => (
                                                                    <button 
                                                                        key={c.bg} 
                                                                        onClick={() => { updateNote(note.id, { color: c.bg }); setActiveNoteTagMenu(null); }}
                                                                        className={`w-4 h-4 rounded-full ${c.header} border border-gray-200 hover:scale-110 transition-transform`}
                                                                    />
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <button onClick={() => deleteNote(note.id)} className="p-1 rounded hover:bg-white/50 text-red-400 hover:text-red-600">
                                                        <Trash2 size={12}/>
                                                    </button>
                                                </div>
                                            </div>
                                            <textarea 
                                                value={note.text}
                                                onChange={(e) => updateNote(note.id, { text: e.target.value })}
                                                className={`w-full p-3 bg-transparent border-none resize-none text-sm text-gray-700 outline-none min-h-[100px] ${colorScheme.placeholder}`}
                                                placeholder="Escreva sua nota aqui..."
                                            />
                                            <div className="px-3 pb-2 flex flex-wrap gap-1">
                                                {note.tags?.map(t => (
                                                    <span key={t} className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded text-gray-600">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                {globalNotes.length === 0 && (
                                    <div className="text-center text-gray-400 py-10 text-sm">
                                        Nenhuma nota criada.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
        
        {/* ... (Existing Modals: Manage Tags, New Chat, Super Robot) ... */}
        {isManageTagsModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 animate-in fade-in">
                {/* ... existing tag manager ui ... */}
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

         {/* New Chat Modal - Updated with Group Support */}
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
                        {/* Type Switcher */}
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-6">
                            <button 
                                onClick={() => setNewChatMode('individual')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${newChatMode === 'individual' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                <UserIcon size={14} /> Individual
                            </button>
                            <button 
                                onClick={() => setNewChatMode('group')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all flex items-center justify-center gap-2 ${newChatMode === 'group' ? 'bg-white dark:bg-gray-600 shadow text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                <Users size={14} /> Grupo
                            </button>
                        </div>

                        {newChatError && (
                            <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} /> {newChatError}
                            </div>
                        )}
                        
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">
                                    {newChatMode === 'individual' ? 'Nome do Contato' : 'Nome do Grupo'}
                                </label>
                                <input 
                                    type="text" 
                                    value={newChatName}
                                    onChange={(e) => setNewChatName(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                    placeholder={newChatMode === 'individual' ? "Ex: Maria Silva" : "Ex: Vendas Black Friday"}
                                />
                            </div>

                            {newChatMode === 'individual' ? (
                                <div>
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Telefone (WhatsApp)</label>
                                    <input 
                                        type="tel" 
                                        value={newChatPhone}
                                        onChange={(e) => setNewChatPhone(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                        placeholder="+55 11 99999-9999"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
                                     <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Adicionar Participantes</h5>
                                     <div className="flex gap-2">
                                         <input 
                                            placeholder="Nome"
                                            value={newPartName}
                                            onChange={e => setNewPartName(e.target.value)}
                                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                                         />
                                         <input 
                                            placeholder="Telefone"
                                            value={newPartPhone}
                                            onChange={e => setNewPartPhone(e.target.value)}
                                            className="w-1/3 px-3 py-2 text-xs rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none"
                                         />
                                         <button 
                                            onClick={handleAddParticipant}
                                            disabled={!newPartName || !newPartPhone}
                                            className="bg-emerald-100 text-emerald-700 p-2 rounded-lg hover:bg-emerald-200 disabled:opacity-50"
                                         >
                                             <Plus size={16}/>
                                         </button>
                                     </div>
                                     
                                     <div className="space-y-1 max-h-32 overflow-y-auto">
                                         {groupParticipants.length === 0 && <p className="text-xs text-gray-400 italic text-center py-2">Nenhum participante adicionado.</p>}
                                         {groupParticipants.map((p, i) => (
                                             <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-xs shadow-sm">
                                                 <span className="font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                                                 <div className="flex items-center gap-2">
                                                     <span className="text-gray-500">{p.phone}</span>
                                                     <button onClick={() => handleRemoveParticipant(i)} className="text-red-400 hover:text-red-600"><X size={12}/></button>
                                                 </div>
                                             </div>
                                         ))}
                                     </div>
                                </div>
                            )}

                            <button 
                                onClick={handleCreateNewChat}
                                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 mt-4"
                            >
                                <MessageSquare size={18} /> 
                                {newChatMode === 'individual' ? 'Iniciar Conversa' : 'Criar Grupo'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Super Robot Manager Modal */}
        {isSuperRobotModalOpen && (
            // ... (Same as before)
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in backdrop-blur-sm">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                    <div className="px-6 py-5 border-b border-indigo-100 dark:border-gray-700 bg-indigo-50 dark:bg-gray-900 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-indigo-900 dark:text-white text-lg flex items-center gap-2">
                                <Database size={20} className="text-indigo-600" />
                                Inteligência do Robô
                            </h3>
                            <p className="text-xs text-indigo-600/70 dark:text-gray-400">Configure palavras-chave e ações automáticas</p>
                        </div>
                        <button onClick={() => setIsSuperRobotModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-sm">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="p-6 flex-1 overflow-y-auto space-y-6">
                        {/* New Rule Form */}
                        <div className="bg-white dark:bg-gray-700/30 p-5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                    <Sparkles size={16} className="text-emerald-500"/>
                                    Nova Regra de Resposta
                                </h4>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-gray-500 flex items-center gap-1 cursor-pointer select-none">
                                        <input 
                                            type="checkbox" 
                                            checked={newUseFuzzy} 
                                            onChange={(e) => setNewUseFuzzy(e.target.checked)}
                                            className="rounded text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <Fingerprint size={12}/> Match Aproximado (Fuzzy)
                                    </label>
                                </div>
                             </div>
                             
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Palavras-Chave (Separadas por vírgula)</label>
                                     <input 
                                        value={newKeywords}
                                        onChange={(e) => setNewKeywords(e.target.value)}
                                        placeholder="preço, valor, quanto custa"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Obrigatórias (E lógica)</label>
                                     <input 
                                        value={newRequiredWords}
                                        onChange={(e) => setNewRequiredWords(e.target.value)}
                                        placeholder="hotel, quarto (ambas devem existir)"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                     />
                                 </div>
                             </div>

                             <div className="mb-4">
                                <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Resposta do Robô</label>
                                <textarea 
                                    value={newResponse}
                                    onChange={(e) => setNewResponse(e.target.value)}
                                    placeholder="Olá {nome}, aqui está nossa tabela..."
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-20"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Variáveis: {'{nome}'}, {'{saudacao}'}, {'{telefone}'} ou dados coletados.</p>
                             </div>

                             {/* Dynamic Items Section - NEW */}
                             <div className="mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600">
                                 <h5 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2 flex items-center gap-1">
                                     <List size={12}/> Itens Dinâmicos (Menu/Catálogo)
                                 </h5>
                                 <div className="flex gap-2 mb-2">
                                     <input 
                                        placeholder="Nome do Item (ex: Pizza)"
                                        value={newItemName}
                                        onChange={e => setNewItemName(e.target.value)}
                                        className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                     />
                                     <input 
                                        placeholder="Preço/Info (ex: R$ 40)"
                                        value={newItemPrice}
                                        onChange={e => setNewItemPrice(e.target.value)}
                                        className="w-24 px-2 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                     />
                                     <button 
                                        onClick={handleAddItemToTrigger}
                                        disabled={!newItemName}
                                        className="bg-indigo-100 text-indigo-700 px-3 rounded font-bold text-xs hover:bg-indigo-200 disabled:opacity-50"
                                     >
                                         <Plus size={14}/>
                                     </button>
                                 </div>
                                 <div className="space-y-1 max-h-24 overflow-y-auto">
                                     {newItems.length === 0 && <p className="text-[10px] text-gray-400 italic text-center py-2">Nenhum item adicionado.</p>}
                                     {newItems.map(item => (
                                         <div key={item.id} className="flex justify-between items-center bg-white dark:bg-gray-700 px-2 py-1 rounded border border-gray-200 dark:border-gray-600 text-xs">
                                             <span className="font-medium text-gray-700 dark:text-gray-200">{item.name}</span>
                                             <div className="flex items-center gap-2">
                                                 <span className="text-gray-500 dark:text-gray-400">{item.price}</span>
                                                 <button onClick={() => handleRemoveItemFromTrigger(item.id)} className="text-red-400 hover:text-red-500"><X size={12}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Advanced Actions Accordion-ish */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><ImageIcon size={12}/> Mídia Opcional (URL)</label>
                                     <input 
                                        value={newMediaUrl}
                                        onChange={(e) => setNewMediaUrl(e.target.value)}
                                        placeholder="https://imagem.jpg"
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                     />
                                 </div>
                                 <div>
                                     <label className="text-xs font-bold text-gray-500 uppercase mb-1 block flex items-center gap-1"><Zap size={12}/> Ação Automática</label>
                                     <select 
                                        value={newActionStatus}
                                        onChange={(e) => setNewActionStatus(e.target.value as any)}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                     >
                                         <option value="">Nenhuma Ação</option>
                                         <option value="human_handoff">Transferir para Humano (Urgente)</option>
                                         <option value="in_progress">Mover para Atendimento</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="flex justify-end mt-4">
                                 <button 
                                    onClick={handleAddSuperRobotTrigger}
                                    disabled={!newResponse.trim()}
                                    className="bg-indigo-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 shadow-sm flex items-center gap-2"
                                 >
                                     <Plus size={16}/> Adicionar Regra
                                 </button>
                             </div>
                        </div>

                        {/* Rules List */}
                        <div>
                            <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Regras Ativas ({superRobotDatabase?.length || 0})</h4>
                            <div className="space-y-3">
                                {superRobotDatabase?.map(trigger => (
                                    <div key={trigger.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow group relative">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex flex-wrap gap-1">
                                                {trigger.keywords.map((k, i) => (
                                                    <span key={i} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100 dark:border-indigo-800">{k}</span>
                                                ))}
                                                {trigger.requiredWords?.map((k, i) => (
                                                    <span key={i} className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded text-xs font-bold border border-emerald-100 dark:border-emerald-800">+ {k}</span>
                                                ))}
                                                {trigger.useFuzzyMatch && <span className="text-[10px] text-gray-400 border px-1 rounded flex items-center" title="Fuzzy Match Ativo">~</span>}
                                            </div>
                                            <button onClick={() => handleDeleteSuperRobotTrigger(trigger.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-2 rounded-lg italic border-l-2 border-gray-300 dark:border-gray-600">
                                            "{trigger.response}"
                                        </p>
                                        
                                        {/* Show item count indicator */}
                                        {trigger.items && trigger.items.length > 0 && (
                                            <div className="mt-2 text-xs text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                <List size={10} /> Inclui lista de {trigger.items.length} itens
                                            </div>
                                        )}

                                        {(trigger.mediaUrl || trigger.actions?.changeStatus) && (
                                            <div className="mt-2 flex gap-3 text-[10px] text-gray-400">
                                                {trigger.mediaUrl && <span className="flex items-center gap-1"><ImageIcon size={10}/> Tem Mídia</span>}
                                                {trigger.actions?.changeStatus === 'human_handoff' && <span className="flex items-center gap-1 text-amber-600"><AlertCircle size={10}/> Transbordo Humano</span>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {(!superRobotDatabase || superRobotDatabase.length === 0) && (
                                    <div className="text-center py-8 text-gray-400 text-sm italic">
                                        Nenhuma regra configurada. O robô não responderá automaticamente.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};