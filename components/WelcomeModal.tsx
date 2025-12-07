import React, { useState } from 'react';
import { X, ArrowRight, CheckCircle2, Zap, MessageSquare, ShieldCheck } from 'lucide-react';

interface WelcomeModalProps {
    onClose: () => void;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    const [step, setStep] = useState(0);

    const slides = [
        {
            title: "Bem-vindo ao ChatBot Pro",
            desc: "A revolução no seu atendimento via WhatsApp começa agora. Automatize, organize e venda mais.",
            icon: <Zap size={48} className="text-yellow-500" />,
            image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Meeting/Business
            color: "bg-emerald-600"
        },
        {
            title: "Fluxos Inteligentes",
            desc: "Crie robôs de atendimento complexos apenas arrastando e soltando cartões. Sem necessidade de programação.",
            icon: <MessageSquare size={48} className="text-blue-500" />,
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Analytics/Dashboard feel
            color: "bg-blue-600"
        },
        {
            title: "Segurança & Estabilidade",
            desc: "Seus dados protegidos e conexão estável. Use a API oficial ou nossa emulação de alta performance.",
            icon: <ShieldCheck size={48} className="text-green-500" />,
            image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80", // Tech/Security
            color: "bg-indigo-600"
        }
    ];

    const currentSlide = slides[step];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px] animate-in zoom-in-95 duration-500 relative">
                
                <button onClick={onClose} className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white bg-black/20 hover:bg-black/40 p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>

                {/* Left Side: Image */}
                <div className="w-full md:w-1/2 relative bg-gray-100 overflow-hidden hidden md:block">
                    <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 transition-colors duration-500`}></div>
                    <img 
                        src={currentSlide.image} 
                        alt="Feature" 
                        className="w-full h-full object-cover transition-all duration-700 transform hover:scale-105"
                    />
                    <div className="absolute bottom-8 left-8 z-20 text-white">
                        <div className="flex gap-2 mb-4">
                            {slides.map((_, i) => (
                                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-white' : 'w-2 bg-white/40'}`} />
                            ))}
                        </div>
                        <h3 className="text-2xl font-bold max-w-xs leading-tight">{currentSlide.title}</h3>
                    </div>
                </div>

                {/* Right Side: Content */}
                <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
                    <div className="mb-8 animate-in slide-in-from-right-8 duration-500 key={step}"> {/* Key forces re-render for animation */}
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl inline-block shadow-sm">
                            {currentSlide.icon}
                        </div>
                        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">{currentSlide.title}</h2>
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                            {currentSlide.desc}
                        </p>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-medium text-sm"
                        >
                            Pular Apresentação
                        </button>
                        
                        <button 
                            onClick={handleNext}
                            className={`${currentSlide.color} text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex items-center gap-2`}
                        >
                            {step === slides.length - 1 ? 'Começar Agora' : 'Próximo'}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};