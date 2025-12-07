import React, { useState } from 'react';
import { User, UserSubscription } from '../types';
import { Check, Star, Shield, Zap, Crown, Calendar, AlertTriangle, Key, ArrowRight, Loader2 } from 'lucide-react';

interface SubscriptionPageProps {
    user: User;
    onUpdateSubscription: (sub: UserSubscription) => void;
}

const PLANS = [
    {
        id: 'monthly',
        name: 'Mensal',
        price: 97,
        period: 'mês',
        durationDays: 30,
        features: ['1 Número WhatsApp', 'Fluxos Ilimitados', 'Atendentes Ilimitados', 'Suporte por Email'],
        recommended: false
    },
    {
        id: 'quarterly',
        name: 'Trimestral',
        price: 267,
        period: '3 meses',
        durationDays: 90,
        monthlyEquivalent: 89,
        features: ['Tudo do Mensal', 'Prioridade no Suporte', 'Bônus: Pack de Fluxos Prontos'],
        recommended: false
    },
    {
        id: 'yearly',
        name: 'Anual',
        price: 897,
        period: 'ano',
        durationDays: 365,
        monthlyEquivalent: 74.75,
        features: ['Tudo do Trimestral', 'Gerente de Contas', 'Acesso Antecipado (Beta)', 'Bônus: Treinamento Vendas'],
        recommended: true
    }
];

const BONUSES = [
    {
        title: "Pack de Fluxos Prontos",
        desc: "Templates validados para Pizzaria, Imobiliária, Clínica e Vendas de Infoprodutos. Só copiar e colar.",
        value: "R$ 497,00",
        icon: <Zap className="text-yellow-500" />
    },
    {
        title: "Treinamento: Vendas no Whats",
        desc: "Curso rápido ensinando como converter leads frios em clientes usando gatilhos mentais.",
        value: "R$ 297,00",
        icon: <Crown className="text-purple-500" />
    },
    {
        title: "Suporte VIP",
        desc: "Acesso direto ao nosso time de especialistas para tirar dúvidas de configuração.",
        value: "Inestimável",
        icon: <Shield className="text-emerald-500" />
    }
];

export const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ user, onUpdateSubscription }) => {
    const [isLoading, setIsLoading] = useState<string | null>(null);
    const [activationKey, setActivationKey] = useState('');
    const [activationLoading, setActivationLoading] = useState(false);
    const [activationMessage, setActivationMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    const handleSubscribe = (planId: string, durationDays: number) => {
        setIsLoading(planId);
        // Simulate payment processing
        setTimeout(() => {
            const currentExpiry = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : new Date();
            const now = new Date();
            // Start from mostly recently of (now, currentExpiry)
            const startDate = currentExpiry > now ? currentExpiry : now;
            
            const newSub: UserSubscription = {
                planId,
                status: 'active',
                startDate: new Date(), // Sign up date logic
                expiresAt: new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
            };
            onUpdateSubscription(newSub);
            setIsLoading(null);
            alert(`Parabéns! Você assinou o plano ${PLANS.find(p => p.id === planId)?.name}.`);
        }, 1500);
    };

    const handleActivateKey = (e: React.FormEvent) => {
        e.preventDefault();
        setActivationLoading(true);
        setActivationMessage(null);

        // Simulate API Key Validation
        setTimeout(() => {
            const key = activationKey.trim().toUpperCase();
            let daysToAdd = 0;
            let planName = '';

            // Mock Keys Logic
            if (key === 'PRO30') { daysToAdd = 30; planName = 'Promo Mensal'; }
            else if (key === 'VIP90') { daysToAdd = 90; planName = 'Parceiro Trimestral'; }
            else if (key === 'YEAR365') { daysToAdd = 365; planName = 'Anual Vitalício'; }
            else if (key.startsWith('TEST')) { daysToAdd = 7; planName = 'Extensão de Teste'; }
            else {
                setActivationMessage({ type: 'error', text: 'Chave de ativação inválida ou expirada.' });
                setActivationLoading(false);
                return;
            }

            // Calculate new date
            const currentExpiry = user.subscription?.expiresAt ? new Date(user.subscription.expiresAt) : new Date();
            const now = new Date();
            const baseDate = currentExpiry > now ? currentExpiry : now;
            const newExpiresAt = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

            const newSub: UserSubscription = {
                planId: 'key_activated',
                status: 'active',
                startDate: user.subscription?.startDate || new Date(),
                expiresAt: newExpiresAt
            };

            onUpdateSubscription(newSub);
            setActivationMessage({ type: 'success', text: `Sucesso! Chave "${planName}" ativada. +${daysToAdd} dias adicionados.` });
            setActivationKey('');
            setActivationLoading(false);
        }, 1500);
    };

    const isTrial = user.subscription?.status === 'trial';
    const isActive = user.subscription?.status === 'active';
    
    // Calculate days left
    const daysLeft = user.subscription?.expiresAt 
        ? Math.ceil((new Date(user.subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) 
        : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-12 animate-in fade-in duration-500 pb-12">
            
            {/* Header / Status Section */}
            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">Escolha o plano ideal para escalar seu negócio</h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                    Desbloqueie todo o potencial da automação. Cancele quando quiser.
                </p>

                {/* Current Status Banner */}
                <div className="mt-6 inline-flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className={`p-3 rounded-full ${isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        {isActive ? <Shield size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Status Atual</p>
                        <p className="text-lg font-bold text-gray-800 dark:text-white">
                            {isActive ? 'Assinatura Ativa' : isTrial ? 'Período de Teste Grátis' : 'Plano Expirado'}
                        </p>
                    </div>
                    <div className="h-8 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>
                    <div className="text-left">
                        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wide">Expira em</p>
                        <p className={`text-lg font-bold ${daysLeft < 3 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                            {daysLeft} dias
                        </p>
                    </div>
                </div>
            </div>

            {/* License Key Activation Section */}
            <div className="max-w-2xl mx-auto bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-1 shadow-lg">
                <div className="bg-white dark:bg-gray-900 rounded-xl p-6 md:p-8">
                    <div className="flex items-start gap-4 mb-6">
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Key size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Possui uma Chave de Ativação?</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Insira sua licença abaixo para desbloquear o sistema instantaneamente ou estender seu período.
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleActivateKey} className="relative">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={activationKey}
                                onChange={(e) => setActivationKey(e.target.value)}
                                placeholder="EX: PRO-2024-X892" 
                                className="flex-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 font-mono uppercase tracking-wider"
                            />
                            <button 
                                type="submit"
                                disabled={activationLoading || !activationKey.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {activationLoading ? <Loader2 size={20} className="animate-spin" /> : <>Ativar <ArrowRight size={18} /></>}
                            </button>
                        </div>
                        {activationMessage && (
                            <div className={`mt-3 text-sm font-medium flex items-center gap-2 animate-in slide-in-from-top-2 ${activationMessage.type === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                                {activationMessage.type === 'success' ? <Check size={16} /> : <AlertTriangle size={16} />}
                                {activationMessage.text}
                            </div>
                        )}
                        <p className="mt-3 text-xs text-gray-400 text-center">
                            Chaves de exemplo para teste: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">PRO30</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">VIP90</code>
                        </p>
                    </form>
                </div>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-3 gap-8 px-4">
                {PLANS.map((plan) => (
                    <div 
                        key={plan.id} 
                        className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 border-2 shadow-lg transition-all transform hover:-translate-y-2 flex flex-col ${
                            plan.recommended 
                            ? 'border-emerald-500 dark:border-emerald-500 ring-4 ring-emerald-500/10' 
                            : 'border-transparent dark:border-gray-700 hover:border-emerald-200'
                        }`}
                    >
                        {plan.recommended && (
                            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-md">
                                Mais Popular
                            </div>
                        )}

                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline justify-center gap-1">
                                <span className="text-sm text-gray-400">R$</span>
                                <span className="text-5xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                                <span className="text-gray-400">/{plan.period}</span>
                            </div>
                            {plan.monthlyEquivalent && (
                                <p className="text-sm text-emerald-600 font-medium mt-2">
                                    Equivale a R$ {plan.monthlyEquivalent.toFixed(2)}/mês
                                </p>
                            )}
                        </div>

                        <ul className="space-y-4 mb-8 flex-1">
                            {plan.features.map((feat, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <div className="p-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {feat}
                                </li>
                            ))}
                        </ul>

                        <button 
                            onClick={() => handleSubscribe(plan.id, plan.durationDays)}
                            disabled={!!isLoading}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-md ${
                                plan.recommended 
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                        >
                            {isLoading === plan.id ? 'Processando...' : 'Escolher Plano'}
                        </button>
                    </div>
                ))}
            </div>

            {/* Bonuses Section */}
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                {/* Background Patterns */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

                <div className="relative z-10">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl md:text-3xl font-bold mb-4">Bônus Exclusivos Inclusos</h2>
                        <p className="text-indigo-200 max-w-xl mx-auto">
                            Assinando qualquer plano hoje, você garante acesso imediato a estas ferramentas que aceleram seus resultados.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {BONUSES.map((bonus, i) => (
                            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl hover:bg-white/15 transition-colors">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-3 bg-white/10 rounded-xl">
                                        {bonus.icon}
                                    </div>
                                    <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/30">
                                        Valor: {bonus.value}
                                    </span>
                                </div>
                                <h3 className="font-bold text-lg mb-2">{bonus.title}</h3>
                                <p className="text-sm text-indigo-100 leading-relaxed">
                                    {bonus.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Guarantee */}
            <div className="text-center max-w-2xl mx-auto">
                <div className="inline-flex items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-full mb-4 text-emerald-600 dark:text-emerald-400">
                    <Shield size={32} />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-xl mb-2">Garantia Incondicional de 7 Dias</h3>
                <p className="text-gray-500 dark:text-gray-400">
                    Se você não gostar da plataforma, devolvemos 100% do seu investimento. Sem perguntas, sem letras miúdas.
                </p>
            </div>
        </div>
    );
};