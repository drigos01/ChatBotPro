import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Flow, FlowStep, StepType, FlowRoute } from '../types';
import { ArrowLeft, Save, MonitorPlay, Plus, Trash2, X, Move, Settings, Type, Mail, User, Flag, MessageSquare, GripHorizontal, Zap, Link as LinkIcon, MousePointer2, Image as ImageIcon, Video, Mic, FileText, Music, Paperclip, FastForward, ToggleLeft, ToggleRight, Sparkles, ZoomIn, ZoomOut, RotateCcw, List, Phone, Calendar, MapPin, Edit3, PenLine } from 'lucide-react';
import { ChatSimulator } from './ChatSimulator';

interface FlowBuilderProps {
  initialFlow?: Flow;
  onSave: (flow: Flow) => void;
  onBack: () => void;
  onTest: (flow: Flow) => void;
}

// --- Card Types Configuration (Updated with Gradients) ---
const CARD_TYPES: Record<StepType, { label: string; gradient: string; icon: any; description: string; defaultQuestion: string; border: string; defaultVariable?: string }> = {
    // Basic Flow
    welcome: { 
        label: 'Boas Vindas', 
        gradient: 'from-emerald-400 to-emerald-600', 
        border: 'border-emerald-200 dark:border-emerald-800',
        icon: Zap, 
        description: 'Ponto de partida',
        defaultQuestion: 'Olá! Bem-vindo ao nosso atendimento.'
    },
    name: { 
        label: 'Capturar Nome', 
        gradient: 'from-blue-400 to-blue-600', 
        border: 'border-blue-200 dark:border-blue-800',
        icon: User, 
        description: 'Pergunta o nome',
        defaultQuestion: 'Qual é o seu nome?',
        defaultVariable: 'nome_cliente'
    },
    email: { 
        label: 'Capturar Email', 
        gradient: 'from-purple-400 to-purple-600', 
        border: 'border-purple-200 dark:border-purple-800',
        icon: Mail, 
        description: 'Valida e-mail',
        defaultQuestion: 'Qual é o seu melhor e-mail?',
        defaultVariable: 'email_cliente'
    },
    question: { 
        label: 'Pergunta Geral', 
        gradient: 'from-gray-500 to-gray-700', 
        border: 'border-gray-200 dark:border-gray-700',
        icon: MessageSquare, 
        description: 'Texto livre',
        defaultQuestion: 'Em que posso ajudar?',
        defaultVariable: 'resposta_cliente'
    },
    
    // New Advanced Cards
    menu: {
        label: 'Menu de Opções',
        gradient: 'from-violet-500 to-fuchsia-600',
        border: 'border-violet-200 dark:border-violet-800',
        icon: List,
        description: 'Lista de escolhas',
        defaultQuestion: 'Escolha uma opção:\n\n1. Financeiro\n2. Suporte\n3. Vendas',
        defaultVariable: 'opcao_menu'
    },
    phone: {
        label: 'Capturar Telefone',
        gradient: 'from-green-500 to-teal-600',
        border: 'border-green-200 dark:border-green-800',
        icon: Phone,
        description: 'Valida número',
        defaultQuestion: 'Qual seu WhatsApp com DDD?',
        defaultVariable: 'telefone_cliente'
    },
    date: {
        label: 'Agendamento',
        gradient: 'from-cyan-500 to-blue-600',
        border: 'border-cyan-200 dark:border-cyan-800',
        icon: Calendar,
        description: 'Solicita data/hora',
        defaultQuestion: 'Qual a melhor data para o agendamento? (DD/MM)',
        defaultVariable: 'data_agendamento'
    },
    location: {
        label: 'Localização',
        gradient: 'from-orange-400 to-red-500',
        border: 'border-orange-200 dark:border-orange-800',
        icon: MapPin,
        description: 'Pede endereço/cep',
        defaultQuestion: 'Por favor, informe seu endereço ou CEP.',
        defaultVariable: 'endereco_cliente'
    },
    custom: {
        label: 'Personalizado',
        gradient: 'from-slate-600 to-black',
        border: 'border-gray-400 dark:border-gray-600',
        icon: Edit3,
        description: 'Crie do zero',
        defaultQuestion: 'Escreva sua pergunta aqui...',
        defaultVariable: 'nova_variavel'
    },

    // Media & Interactive (Special Cards)
    image: {
        label: 'Enviar Imagem',
        gradient: 'from-pink-400 to-rose-500', 
        border: 'border-pink-200 dark:border-pink-800',
        icon: ImageIcon,
        description: 'Envia foto + legenda',
        defaultQuestion: 'Veja esta imagem:'
    },
    video: {
        label: 'Enviar Vídeo',
        gradient: 'from-red-400 to-red-600', 
        border: 'border-red-200 dark:border-red-800',
        icon: Video,
        description: 'Envia vídeo + legenda',
        defaultQuestion: 'Assista a este vídeo:'
    },
    audio: {
        label: 'Enviar Áudio',
        gradient: 'from-amber-400 to-orange-500', 
        border: 'border-amber-200 dark:border-amber-800',
        icon: Mic,
        description: 'Envia áudio gravado',
        defaultQuestion: 'Ouça esta mensagem:'
    },
    document: {
        label: 'Enviar Arquivo',
        gradient: 'from-indigo-400 to-indigo-600', 
        border: 'border-indigo-200 dark:border-indigo-800',
        icon: FileText,
        description: 'PDF ou Doc',
        defaultQuestion: 'Baixe o arquivo abaixo:'
    },

    // End
    end: { 
        label: 'Encerramento', 
        gradient: 'from-slate-700 to-slate-900', 
        border: 'border-slate-200 dark:border-slate-700',
        icon: Flag, 
        description: 'Finaliza o chat',
        defaultQuestion: 'Obrigado pelo contato!'
    }
};

const BASIC_CATEGORY: StepType[] = ['welcome', 'name', 'email', 'question', 'end'];
const ADVANCED_CATEGORY: StepType[] = ['menu', 'phone', 'date', 'location', 'custom'];
const SPECIAL_CATEGORY: StepType[] = ['image', 'video', 'audio', 'document'];

// --- Optimized Child Components ---

const FlowCard = React.memo(({ 
    step, 
    typeConf, 
    isSelected, 
    isConnecting, 
    onDragStart, 
    onUpdate, 
    onDelete, 
    onStartLink, 
    onFinishLink, 
    onRemoveConnection 
}: any) => {
    const [editingTitle, setEditingTitle] = useState(false);
    const isEnd = step.stepType === 'end';
    const isMedia = SPECIAL_CATEGORY.includes(step.stepType || 'question');
    const cardLabel = step.customLabel || typeConf.label;

    return (
        <div 
            style={{ 
                left: step.position?.x || 100, 
                top: step.position?.y || 100,
                position: 'absolute'
            }}
            className={`w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-shadow z-10 hover:z-20 border ${typeConf.border} flex flex-col ${
                isSelected ? 'ring-4 ring-emerald-200 dark:ring-emerald-900 scale-105' : ''
            }`}
            onClick={(e) => e.stopPropagation()} 
        >
            {/* Card Header */}
            <div 
                className={`h-10 rounded-t-xl w-full bg-gradient-to-r ${typeConf.gradient} cursor-move flex items-center justify-between px-3`}
                onMouseDown={(e) => onDragStart(e, step.id)}
            >
                <div className="flex items-center gap-2 text-white/90">
                    <typeConf.icon size={14} className="text-white"/>
                    {editingTitle ? (
                        <input 
                            autoFocus
                            className="bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded px-1 py-0.5 outline-none w-32 border border-white/40"
                            value={step.customLabel || typeConf.label}
                            onChange={(e) => onUpdate(step.id, { customLabel: e.target.value })}
                            onBlur={() => setEditingTitle(false)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingTitle(false)}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span 
                            className="font-bold text-xs text-white uppercase tracking-wider cursor-text hover:bg-white/10 px-1 rounded transition-colors"
                            onClick={(e) => { e.stopPropagation(); setEditingTitle(true); }}
                            title="Clique para renomear este card"
                        >
                            {cardLabel}
                        </span>
                    )}
                    {!editingTitle && <PenLine size={10} className="opacity-50" />}
                </div>
                <div className="flex gap-1.5 opacity-70 hover:opacity-100">
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                    <div className="w-1 h-1 bg-white rounded-full"></div>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-3">
                {/* Toolbar inside card */}
                <div className="flex justify-end -mt-1">
                    <button 
                        onClick={() => onDelete(step.id)} 
                        className="text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1 transition-colors"
                        title="Remover Card"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>

                {/* Content Inputs */}
                <div className="space-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {isMedia ? "Legenda / Texto" : "Mensagem do Robô"}
                        </label>
                        <textarea 
                            value={step.question}
                            onChange={(e) => onUpdate(step.id, { question: e.target.value })}
                            className="w-full text-sm p-3 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:border-emerald-500 rounded-lg resize-none outline-none text-gray-800 dark:text-gray-100 transition-all shadow-inner"
                            rows={step.stepType === 'menu' ? 4 : 2}
                            placeholder={isMedia ? "Digite a legenda..." : "Digite a pergunta..."}
                            onMouseDown={(e) => e.stopPropagation()}
                        />
                    </div>

                    {isMedia && (
                        <div className="relative space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">URL do Arquivo</label>
                            <div className="relative">
                                <input 
                                    value={step.mediaUrl}
                                    onChange={(e) => onUpdate(step.id, { mediaUrl: e.target.value })}
                                    placeholder="https://exemplo.com/foto.jpg"
                                    className="w-full text-xs p-2.5 pl-8 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:border-emerald-500 rounded-lg outline-none font-mono text-blue-600 dark:text-blue-400 transition-all"
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                                <Paperclip size={12} className="absolute left-2.5 top-3 text-gray-400" />
                            </div>
                        </div>
                    )}
                    
                    {!isEnd && (
                        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <div 
                                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer border transition-all ${
                                    step.skipWait 
                                    ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' 
                                    : 'bg-white border-transparent hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700'
                                }`}
                                onClick={() => onUpdate(step.id, { skipWait: !step.skipWait })}
                            >
                                <div className="flex items-center gap-2">
                                    <div className={`p-1 rounded ${step.skipWait ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <FastForward size={12} />
                                    </div>
                                    <span className={`text-xs font-medium ${step.skipWait ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500'}`}>Pular Espera</span>
                                </div>
                                
                                <div className={`relative w-8 h-4 rounded-full transition-colors ${step.skipWait ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                    <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm transition-transform ${step.skipWait ? 'translate-x-4' : ''}`}></div>
                                </div>
                            </div>

                            {!step.skipWait && !isMedia && (
                                <div className="relative animate-in fade-in slide-in-from-top-2">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                                        Salvar Resposta Em
                                        <span className="text-[9px] text-emerald-500 font-normal normal-case bg-emerald-50 px-1.5 rounded">Personalizável</span>
                                    </label>
                                    {step.stepType === 'question' || step.stepType === 'custom' || step.stepType === 'menu' || step.stepType === 'location' ? (
                                        <div className="relative group">
                                            <input 
                                                value={step.fieldName} 
                                                onChange={(e) => onUpdate(step.id, { fieldName: e.target.value })}
                                                placeholder="ex: motivo_contato" 
                                                className="w-full text-xs p-2 pl-8 bg-gray-50 dark:bg-gray-900 border border-transparent focus:bg-white dark:focus:bg-gray-950 focus:border-indigo-500 rounded-lg outline-none font-mono text-gray-700 dark:text-gray-300 transition-all group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:border-gray-200 dark:group-hover:border-gray-700"
                                                onMouseDown={(e) => e.stopPropagation()}
                                            />
                                            <Type size={12} className="absolute left-2.5 top-2.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-lg">
                                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                            <span className="text-xs text-indigo-700 dark:text-indigo-300 font-mono">
                                                {step.fieldName || typeConf.defaultVariable}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Connection Handles */}
            {!isEnd && (
                <div 
                    className="absolute -right-3 top-10 w-6 h-6 bg-white dark:bg-gray-700 border-2 border-emerald-500 rounded-full shadow-md cursor-crosshair hover:scale-125 transition-transform flex items-center justify-center z-30 group"
                    title="Puxar seta para conectar"
                    onMouseDown={(e) => onStartLink(e, step.id)}
                >
                    <div className="w-2 h-2 bg-emerald-500 rounded-full group-hover:bg-emerald-400"></div>
                </div>
            )}
            
            {step.stepType !== 'welcome' && (
                <div 
                    className={`absolute -left-3 top-10 w-6 h-6 bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-500 rounded-full shadow-md flex items-center justify-center z-30 ${isConnecting && !isSelected ? 'animate-bounce border-emerald-400 bg-emerald-50 cursor-pointer' : ''}`}
                    onClick={(e) => onFinishLink(e, step.id)}
                >
                    {isConnecting && !isSelected ? <LinkIcon size={12} className="text-emerald-500"/> : <div className="w-2 h-2 bg-gray-300 dark:bg-gray-500 rounded-full"></div>}
                </div>
            )}

            {step.nextStepId && (
                <button 
                    onClick={() => onRemoveConnection(step.id)}
                    className="absolute -right-2 top-20 text-[10px] text-white bg-red-400 hover:bg-red-500 shadow-sm rounded-full w-5 h-5 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    title="Remover Conexão"
                >
                    <X size={12} />
                </button>
            )}
        </div>
    );
});

export const FlowBuilder: React.FC<FlowBuilderProps> = ({ initialFlow, onSave, onBack }) => {
  // --- State ---
  const [name, setName] = useState(initialFlow?.name || 'Novo Fluxo Inteligente');
  const [steps, setSteps] = useState<FlowStep[]>(initialFlow?.steps || []);
  const [isTestMode, setIsTestMode] = useState(false);
  const [scale, setScale] = useState(1);
  
  // Canvas State
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [linkingSourceId, setLinkingSourceId] = useState<string | null>(null); 
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const requestRef = useRef<number | null>(null);

  // Initialize positions if missing
  useEffect(() => {
      if (initialFlow?.steps && initialFlow.steps.length > 0 && !initialFlow.steps[0].position) {
          const newSteps = initialFlow.steps.map((s, i) => ({
              ...s,
              stepType: s.stepType || 'question',
              position: { x: 100 + (i * 250) % 800, y: 100 + Math.floor(i / 3) * 300 }
          }));
          setSteps(newSteps);
      }
  }, []);

  // --- Handlers ---

  const handleDragStart = useCallback((e: React.MouseEvent, id: string) => {
      e.stopPropagation(); 
      if (e.button !== 0) return;
      
      const step = steps.find(s => s.id === id);
      if (step && step.position) {
          setDragOffset({
              x: (e.clientX / scale) - step.position.x,
              y: (e.clientY / scale) - step.position.y
          });
          setDraggingStepId(id);
      }
  }, [steps, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
      if (!linkingSourceId && !draggingStepId) return;

      // Throttle with requestAnimationFrame for performance
      if (requestRef.current) return;

      requestRef.current = requestAnimationFrame(() => {
          if (canvasRef.current) {
             const rect = canvasRef.current.getBoundingClientRect();
             const x = (e.clientX - rect.left + canvasRef.current.scrollLeft) / scale;
             const y = (e.clientY - rect.top + canvasRef.current.scrollTop) / scale;
             
             if (linkingSourceId) {
                 setMousePos({ x, y });
             }

             if (draggingStepId) {
                 const newX = (e.clientX / scale) - dragOffset.x;
                 const newY = (e.clientY / scale) - dragOffset.y;
                 setSteps(prev => prev.map(s => s.id === draggingStepId ? { ...s, position: { x: newX, y: newY } } : s));
             }
          }
          requestRef.current = null;
      });
  }, [draggingStepId, linkingSourceId, scale, dragOffset]);

  const handleMouseUp = () => {
      setDraggingStepId(null);
      if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
      }
  };

  const addCard = (type: StepType) => {
      const scrollX = canvasRef.current?.scrollLeft || 0;
      const scrollY = canvasRef.current?.scrollTop || 0;
      
      const newStep: FlowStep = {
          id: Date.now().toString(),
          stepType: type,
          question: CARD_TYPES[type].defaultQuestion,
          fieldName: CARD_TYPES[type].defaultVariable || '',
          validation: type === 'email' ? 'email' : type === 'phone' ? 'phone' : type === 'date' ? 'date' : 'text',
          position: { x: (scrollX + 350) / scale, y: (scrollY + 250) / scale },
          mediaUrl: '',
          skipWait: type === 'welcome',
          routes: []
      };
      setSteps(prev => [...prev, newStep]);
  };

  const updateStep = useCallback((id: string, updates: Partial<FlowStep>) => {
      setSteps(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  }, []);

  const deleteStep = useCallback((id: string) => {
      setSteps(prev => {
          const filtered = prev.filter(s => s.id !== id);
          return filtered.map(s => ({
              ...s,
              nextStepId: s.nextStepId === id ? undefined : s.nextStepId,
              routes: s.routes?.filter(r => r.targetStepId !== id)
          }));
      });
  }, []);

  const startLinking = useCallback((e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      setLinkingSourceId(id);
  }, []);

  const finishLinking = useCallback((e: React.MouseEvent, targetId: string) => {
      e.stopPropagation();
      setLinkingSourceId(prev => {
          if (prev && prev !== targetId) {
              setSteps(steps => steps.map(s => s.id === prev ? { ...s, nextStepId: targetId } : s));
          }
          return null;
      });
  }, []);

  const removeConnection = useCallback((sourceId: string) => {
      setSteps(prev => prev.map(s => s.id === sourceId ? { ...s, nextStepId: undefined } : s));
  }, []);

  const cancelLinking = () => {
      setLinkingSourceId(null);
  };

  const handleSave = () => {
    const sortedSteps = [...steps].sort((a,b) => (a.position?.y || 0) - (b.position?.y || 0));
    const flow: Flow = {
      id: initialFlow?.id || Date.now().toString(),
      name,
      description: 'Fluxo Inteligente de Cards',
      isActive: true,
      welcomeMessage: steps.find(s => s.stepType === 'welcome')?.question || '',
      endMessage: steps.find(s => s.stepType === 'end')?.question || '',
      steps: sortedSteps,
    };
    onSave(flow);
  };

  // --- Rendering Helpers ---
  const getConnectorPath = (sourceId: string, targetId?: string, isTemp?: boolean) => {
      const source = steps.find(s => s.id === sourceId);
      let targetX = mousePos.x;
      let targetY = mousePos.y;

      if (!isTemp && targetId) {
          const target = steps.find(s => s.id === targetId);
          if (target && target.position) {
              targetX = target.position.x;
              targetY = target.position.y + 40; 
          }
      }

      if (source && source.position) {
          const startX = source.position.x + 280; 
          const startY = source.position.y + 40; 
          
          const deltaX = Math.abs(targetX - startX);
          const controlPointX = Math.max(deltaX * 0.5, 50);

          return `M ${startX} ${startY} C ${startX + controlPointX} ${startY}, ${targetX - controlPointX} ${targetY}, ${targetX} ${targetY}`;
      }
      return '';
  };

  const getCurrentFlowState = (): Flow => ({
      id: 'temp',
      name,
      description: '',
      isActive: true,
      welcomeMessage: steps.find(s => s.stepType === 'welcome')?.question || '',
      endMessage: '',
      steps
  });

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex justify-between items-center z-20 shadow-sm shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                <ArrowLeft size={20} />
            </button>
            <div className="flex flex-col">
                <input 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg font-bold bg-transparent outline-none text-gray-800 dark:text-white placeholder-gray-400 w-64 md:w-96"
                    placeholder="Nome do Fluxo..."
                />
                <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Sparkles size={10} className="text-emerald-500" /> Editor Visual de Automação
                </span>
            </div>
         </div>
         <div className="flex gap-2">
            <button 
                onClick={() => setIsTestMode(!isTestMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${isTestMode ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
                <MonitorPlay size={18} /> {isTestMode ? 'Fechar Teste' : 'Testar'}
            </button>
            <button 
                onClick={handleSave}
                className="flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-colors"
            >
                <Save size={18} /> Salvar
            </button>
         </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
          
          {/* Sidebar Tools */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-20 shadow-xl">
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Zap size={14} className="text-emerald-500"/> Fluxo Básico
                    </h3>
                    <div className="space-y-3">
                        {BASIC_CATEGORY.map((type) => {
                            const conf = CARD_TYPES[type];
                            return (
                                <div 
                                    key={type}
                                    draggable
                                    onDragEnd={() => addCard(type)}
                                    onClick={() => addCard(type)}
                                    className={`p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${conf.gradient}`}></div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`p-1.5 rounded-md text-white bg-gradient-to-br ${conf.gradient} shadow-sm`}>
                                            <conf.icon size={14} />
                                        </div>
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{conf.label}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 pl-9 leading-tight">{conf.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                         <List size={14} className="text-purple-500"/> Avançado & Custom
                    </h3>
                    <div className="space-y-3">
                        {ADVANCED_CATEGORY.map((type) => {
                            const conf = CARD_TYPES[type];
                            return (
                                <div 
                                    key={type}
                                    draggable
                                    onDragEnd={() => addCard(type)}
                                    onClick={() => addCard(type)}
                                    className={`p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${conf.gradient}`}></div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`p-1.5 rounded-md text-white bg-gradient-to-br ${conf.gradient} shadow-sm`}>
                                            <conf.icon size={14} />
                                        </div>
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{conf.label}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 pl-9 leading-tight">{conf.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                         <Sparkles size={14} className="text-blue-500"/> Mídia & Interação
                    </h3>
                    <div className="space-y-3">
                        {SPECIAL_CATEGORY.map((type) => {
                            const conf = CARD_TYPES[type];
                            return (
                                <div 
                                    key={type}
                                    draggable
                                    onDragEnd={() => addCard(type)}
                                    onClick={() => addCard(type)}
                                    className={`p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-700/50 hover:shadow-md cursor-grab active:cursor-grabbing transition-all group relative overflow-hidden`}
                                >
                                    <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${conf.gradient}`}></div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className={`p-1.5 rounded-md text-white bg-gradient-to-br ${conf.gradient} shadow-sm`}>
                                            <conf.icon size={14} />
                                        </div>
                                        <span className="font-bold text-sm text-gray-700 dark:text-gray-200">{conf.label}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 pl-9 leading-tight">{conf.description}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
              </div>
          </div>

          {/* Canvas Area */}
          <div 
            ref={canvasRef}
            className={`flex-1 relative overflow-scroll bg-slate-50 dark:bg-gray-900 cursor-default ${linkingSourceId ? 'cursor-crosshair' : ''}`}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onClick={cancelLinking} 
            style={{ 
                backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
                backgroundSize: `${24 * scale}px ${24 * scale}px` 
            }}
          >
              <div 
                className="w-[3000px] h-[2000px] relative origin-top-left transition-transform duration-75"
                style={{ transform: `scale(${scale})` }}
              >
                  
                  {/* Connections Layer (SVG) */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 filter drop-shadow-sm">
                      <defs>
                          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
                          </marker>
                      </defs>
                      
                      {/* Existing Connections */}
                      {steps.map(step => {
                          if (step.nextStepId) {
                              return (
                                  <path 
                                    key={`conn-${step.id}`}
                                    d={getConnectorPath(step.id, step.nextStepId)}
                                    stroke="#64748b"
                                    strokeWidth="2.5"
                                    fill="none"
                                    markerEnd="url(#arrowhead)"
                                    className="transition-all hover:stroke-emerald-500"
                                    strokeLinecap="round"
                                  />
                              );
                          }
                          return null;
                      })}

                      {/* Temporary Drawing Line */}
                      {linkingSourceId && (
                           <path 
                             d={getConnectorPath(linkingSourceId, undefined, true)}
                             stroke="#10b981"
                             strokeWidth="3"
                             strokeDasharray="6,4"
                             fill="none"
                             className="animate-pulse"
                             strokeLinecap="round"
                           />
                      )}
                  </svg>

                  {/* Cards Layer */}
                  {steps.map(step => (
                      <FlowCard 
                        key={step.id}
                        step={step}
                        typeConf={CARD_TYPES[step.stepType || 'question']}
                        isSelected={linkingSourceId === step.id}
                        isConnecting={!!linkingSourceId}
                        onDragStart={handleDragStart}
                        onUpdate={updateStep}
                        onDelete={deleteStep}
                        onStartLink={startLinking}
                        onFinishLink={finishLinking}
                        onRemoveConnection={removeConnection}
                      />
                  ))}
              </div>
          </div>

          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-30">
                <button onClick={() => setScale(s => Math.min(s + 0.1, 2))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300" title="Zoom In">
                    <ZoomIn size={20} />
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
                <button onClick={() => setScale(s => Math.max(s - 0.1, 0.5))} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300" title="Zoom Out">
                    <ZoomOut size={20} />
                </button>
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full"></div>
                <button onClick={() => setScale(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors text-gray-600 dark:text-gray-300" title="Reset Zoom">
                    <RotateCcw size={16} />
                </button>
          </div>
      </div>

      {/* Simulator Overlay */}
      {isTestMode && (
          <div className="absolute top-16 right-4 w-[400px] h-[600px] bg-white dark:bg-gray-900 shadow-2xl rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden z-50 animate-in slide-in-from-right">
             <ChatSimulator 
                flow={getCurrentFlowState()}
                onBack={() => setIsTestMode(false)}
                botSettings={{ typingDelay: 1000, inactivityThresholdSeconds: 120, inactivityWarningMessage: 'Ola?', autoHandoffSeconds: 300, autoHandoffMessage: '...', autoArchiveMinutes: 60 }}
             />
          </div>
      )}
    </div>
  );
};