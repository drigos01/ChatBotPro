import React, { useState, useEffect } from 'react';
import { ViewState } from '../types';
import { X, ChevronRight, Lightbulb, Check } from 'lucide-react';

interface TourGuideProps {
    currentView: ViewState;
    onCompleteTour: () => void;
    isTourCompleted: boolean;
}

// Configuration of the tour steps per view
const TOUR_STEPS: Record<string, { title: string; content: string; target?: string }[]> = {
    dashboard: [
        { 
            title: "Bem-vindo ao Dashboard!", 
            content: "Aqui você tem uma visão geral da sua operação. Acompanhe métricas de atendimento, status dos robôs e atividade semanal em tempo real." 
        },
        { 
            title: "Ações Rápidas", 
            content: "Use os botões de ação rápida para criar novos fluxos ou ajustar configurações sem perder tempo." 
        }
    ],
    conversations: [
        { 
            title: "Central de Atendimento", 
            content: "Gerencie todas as conversas em um só lugar. Use as abas para filtrar entre 'Robô', 'Fila' e 'Meus Atendimentos'." 
        },
        {
            title: "Kanban & Tabela",
            content: "Você pode alternar a visualização entre Lista, Kanban (para funil de vendas) e Tabela usando os ícones no topo."
        },
        { 
            title: "Auxiliar de Escrita", 
            content: "Ao digitar, nosso sistema sugere respostas rápidas e corrige erros automaticamente. Pressione TAB para aceitar." 
        }
    ],
    flows: [
        { 
            title: "Gerenciador de Fluxos", 
            content: "Aqui ficam seus 'cérebros'. Crie diferentes fluxos para Vendas, Suporte ou Financeiro. Ative ou desative-os com um clique." 
        }
    ],
    'flow-builder': [
        { 
            title: "Construtor Visual", 
            content: "Arraste e solte cartões da esquerda para criar seu fluxo. Conecte as perguntas puxando a linha de um card para o outro." 
        },
        {
            title: "Tipos de Cartão",
            content: "Temos cartões básicos (texto), avançados (menus, validação) e multimídia (áudio, vídeo, arquivos)."
        }
    ],
    connect: [
        { 
            title: "Conexão WhatsApp", 
            content: "Escaneie o QR Code para conectar seu número. Você pode usar o modo 'Simulação' para testar sem um celular real." 
        }
    ],
    subscription: [
        {
            title: "Sua Assinatura",
            content: "Gerencie seu plano, veja sua data de renovação e aproveite os bônus exclusivos incluídos na sua licença."
        }
    ]
};

export const TourGuide: React.FC<TourGuideProps> = ({ currentView, onCompleteTour, isTourCompleted }) => {
    const [stepIndex, setStepIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [hasSeenView, setHasSeenView] = useState<Record<string, boolean>>({});

    useEffect(() => {
        // If tour is globally completed, never show
        if (isTourCompleted) return;

        // Check if there are steps for this view and if we haven't dismissed it for this view session
        const steps = TOUR_STEPS[currentView];
        if (steps && !hasSeenView[currentView]) {
            setStepIndex(0);
            // Small delay for animation effect
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [currentView, isTourCompleted, hasSeenView]);

    const handleNext = () => {
        const steps = TOUR_STEPS[currentView];
        if (stepIndex < steps.length - 1) {
            setStepIndex(prev => prev + 1);
        } else {
            // Finished steps for THIS view
            dismissForView();
        }
    };

    const dismissForView = () => {
        setIsVisible(false);
        setHasSeenView(prev => ({ ...prev, [currentView]: true }));
        
        // If user has seen mostly everything (basic logic), or explicitly skips all
        // For now, we just hide per view. The "Pular Tutorial Completo" handles global finish.
    };

    const handleSkipAll = () => {
        setIsVisible(false);
        onCompleteTour(); // Sets global flag in App/User
    };

    if (!isVisible || isTourCompleted || !TOUR_STEPS[currentView]) return null;

    const currentStepData = TOUR_STEPS[currentView][stepIndex];
    const totalSteps = TOUR_STEPS[currentView].length;

    return (
        <div className="fixed bottom-6 right-6 z-[60] max-w-sm w-full animate-in slide-in-from-bottom-10 fade-in duration-500">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-emerald-100 dark:border-emerald-900 overflow-hidden relative">
                {/* Decor */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                
                <div className="p-5">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Lightbulb size={20} />
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-gray-800 dark:text-white text-base mb-1">{currentStepData.title}</h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {currentStepData.content}
                            </p>
                        </div>
                        <button onClick={dismissForView} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                            {Array.from({ length: totalSteps }).map((_, i) => (
                                <div 
                                    key={i} 
                                    className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIndex ? 'w-6 bg-emerald-500' : 'w-1.5 bg-gray-200 dark:bg-gray-700'}`}
                                />
                            ))}
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleSkipAll}
                                className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium underline decoration-dotted"
                            >
                                Não mostrar mais
                            </button>
                            <button 
                                onClick={handleNext}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-sm flex items-center gap-1 transition-all active:scale-95"
                            >
                                {stepIndex === totalSteps - 1 ? 'Entendi' : 'Próximo'} 
                                {stepIndex === totalSteps - 1 ? <Check size={14} /> : <ChevronRight size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};