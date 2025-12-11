import React, { useState, useEffect } from 'react';
import { WebhookConfig } from '../types';
import { Webhook, Save, Zap, AlertCircle, CheckCircle2, Copy, Send, GitBranch, Plus, Trash2, Info, ChevronDown, ChevronUp, ArrowDownToLine, ArrowUpRight, Activity, Terminal } from 'lucide-react';

interface DeveloperAreaProps {
    webhookConfig: WebhookConfig;
    onUpdateWebhookConfig: (config: WebhookConfig) => void;
}

export const DeveloperArea: React.FC<DeveloperAreaProps> = ({ webhookConfig, onUpdateWebhookConfig }) => {
    const [config, setConfig] = useState<WebhookConfig>(webhookConfig);
    const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing'>('incoming');
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [testing, setTesting] = useState<string | null>(null);
    const [logs, setLogs] = useState<string[]>([]);

    // Ensure incoming token exists
    useEffect(() => {
        if (!config.incomingToken) {
            const newToken = 'sk_live_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
            const newConfig = { ...config, incomingToken: newToken };
            setConfig(newConfig);
            onUpdateWebhookConfig(newConfig);
        }
    }, []);

    // Sync if props change
    useEffect(() => {
        if(webhookConfig.defaultRoute !== config.defaultRoute) {
            setConfig(webhookConfig);
        }
    }, [webhookConfig]);

    const handleSave = () => {
        setIsSaving(true);
        onUpdateWebhookConfig(config);
        
        // Persist to local storage
        localStorage.setItem('chatpro_webhook_config', JSON.stringify(config));

        setTimeout(() => {
            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 2000);
        }, 800);
    };

    const handleRegenerateToken = () => {
        if (window.confirm("Isso invalidará a URL anterior. Deseja continuar?")) {
            const newToken = 'sk_live_' + Math.random().toString(36).substr(2, 16) + Date.now().toString(36);
            const newConfig = { ...config, incomingToken: newToken };
            setConfig(newConfig);
            onUpdateWebhookConfig(newConfig);
            localStorage.setItem('chatpro_webhook_config', JSON.stringify(newConfig));
        }
    };

    const handleCopyUrl = (url: string) => {
        navigator.clipboard.writeText(url);
        alert("URL copiada para a área de transferência!");
    };

    const simulateIncomingEvent = () => {
        const fakePayload = {
            id: 'evt_' + Math.random().toString(36).substr(2, 9),
            type: 'message.received',
            data: {
                from: '5511999999999',
                body: 'Olá, isso é um teste vindo do seu site!',
                timestamp: new Date().toISOString()
            }
        };
        const logEntry = `[${new Date().toLocaleTimeString()}] RECEBIDO: ${JSON.stringify(fakePayload, null, 2)}`;
        setLogs(prev => [logEntry, ...prev]);
    };

    const handleTestTrigger = async (type: 'default' | 'message' | 'call' | 'status') => {
        let url = config.defaultRoute;
        if (type === 'message' && config.messageRoute) url = config.messageRoute;
        if (type === 'call' && config.callRoute) url = config.callRoute;
        if (type === 'status' && config.statusRoute) url = config.statusRoute;

        if (!url) {
            alert("URL não configurada para este gatilho.");
            return;
        }

        setTesting(type);

        const payload = {
            event: type === 'message' ? 'incoming_message' : type === 'call' ? 'incoming_call' : 'status_change',
            timestamp: new Date().toISOString(),
            data: {
                id: 'test_123',
                from: '5511999999999',
                body: 'Teste de integração do ChatBot Pro',
                type: 'text'
            }
        };

        try {
            await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            alert(`Disparo de teste enviado com sucesso para ${url}`);
        } catch (error) {
            console.error(error);
            alert("Erro ao tentar disparar o webhook. Verifique o console ou se a URL permite CORS.");
        } finally {
            setTesting(null);
        }
    };

    const generatedUrl = `https://api.chatbotpro.com/v1/webhook/${config.incomingToken || '...'}`;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Webhook className="text-purple-600" /> Área do Dev
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Integre o ChatBot Pro com seus sistemas externos.</p>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit border border-gray-200 dark:border-gray-700">
                <button 
                    onClick={() => setActiveTab('incoming')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'incoming' ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <ArrowDownToLine size={16} /> Receber Dados (Entrada)
                </button>
                <button 
                    onClick={() => setActiveTab('outgoing')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'outgoing' ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                >
                    <ArrowUpRight size={16} /> Enviar Dados (Saída)
                </button>
            </div>

            {activeTab === 'incoming' ? (
                // --- INCOMING WEBHOOK SECTION ---
                <div className="grid md:grid-cols-2 gap-6 animate-in slide-in-from-left-4 fade-in">
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                                <Zap size={18} className="text-amber-500" /> Sua URL de Integração
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Copie a URL abaixo e cole no seu site externo para enviar dados (mensagens, eventos) para o ChatBot Pro.
                            </p>
                            
                            <div className="relative group">
                                <input 
                                    readOnly 
                                    value={generatedUrl} 
                                    className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono pr-24 outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <div className="absolute right-1 top-1 flex gap-1">
                                    <button 
                                        onClick={() => handleCopyUrl(generatedUrl)}
                                        className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md text-gray-500 transition-colors shadow-sm"
                                        title="Copiar URL"
                                    >
                                        <Copy size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                    <Activity size={12} className="text-emerald-500 animate-pulse" /> Escutando eventos...
                                </span>
                                <button 
                                    onClick={handleRegenerateToken}
                                    className="text-xs text-red-500 hover:text-red-700 underline decoration-dotted"
                                >
                                    Gerar novo token
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5">
                            <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <Info size={16} /> Como funciona?
                            </h4>
                            <p className="text-xs text-blue-700 dark:text-blue-200 leading-relaxed">
                                Quando seu site externo fizer um <strong>POST</strong> para esta URL com um JSON, o ChatBot Pro processará a informação. Certifique-se de enviar o campo <code>phone</code> e <code>message</code> no corpo da requisição.
                            </p>
                        </div>
                    </div>

                    {/* Console Log Simulator */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-lg p-4 flex flex-col h-[400px]">
                        <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
                            <span className="text-xs font-mono text-gray-400 flex items-center gap-2">
                                <Terminal size={14} /> Console de Eventos
                            </span>
                            <button 
                                onClick={simulateIncomingEvent}
                                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-white text-[10px] rounded border border-gray-700 transition-colors"
                            >
                                Simular Evento
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 custom-scrollbar">
                            {logs.length === 0 ? (
                                <div className="text-gray-600 italic text-center mt-10">Aguardando dados...</div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="text-emerald-400 break-all border-l-2 border-emerald-900 pl-2">
                                        {log}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                // --- OUTGOING WEBHOOK SECTION (Existing) ---
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in">
                    {/* Instruction Banner */}
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-6">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm uppercase tracking-wide">
                                <Info size={16} /> Configurar Saída
                            </div>
                            <ul className="space-y-2 text-sm text-emerald-900 dark:text-emerald-200 list-disc list-inside">
                                <li>Insira aqui a URL do seu sistema (n8n, Zapier, Backend Próprio).</li>
                                <li>O ChatBot Pro enviará um <strong>POST</strong> para esta URL sempre que uma mensagem for recebida ou enviada.</li>
                            </ul>
                        </div>
                    </div>

                    {/* Config Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <GitBranch size={18} className="text-emerald-500" /> Rotas de Saída
                            </h3>
                            <button 
                                onClick={handleSave} 
                                disabled={isSaving}
                                className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${saveStatus === 'success' ? 'bg-green-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                            >
                                {isSaving ? 'Salvando...' : saveStatus === 'success' ? 'Salvo!' : 'Salvar Alterações'}
                                {saveStatus === 'success' ? <CheckCircle2 size={16} /> : <Save size={16} />}
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Default Route */}
                            <div className="space-y-2">
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Rota Padrão (Webhook Global)</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={config.defaultRoute}
                                        onChange={(e) => setConfig({ ...config, defaultRoute: e.target.value })}
                                        placeholder="https://seu-endpoint.com/webhook/principal"
                                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white font-mono"
                                    />
                                    <button 
                                        onClick={() => handleTestTrigger('default')}
                                        disabled={!config.defaultRoute || !!testing}
                                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-xl font-medium text-sm flex items-center gap-2 transition-colors border border-gray-200 dark:border-gray-600"
                                    >
                                        {testing === 'default' ? <span className="animate-spin">⏳</span> : <Send size={16} />}
                                        <span className="hidden sm:inline">Testar</span>
                                    </button>
                                </div>
                            </div>

                            {/* Advanced Toggle */}
                            <div>
                                <button 
                                    onClick={() => setShowAdvanced(!showAdvanced)}
                                    className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 font-medium transition-colors"
                                >
                                    {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    {showAdvanced ? 'Ocultar Rotas Específicas' : 'Configurar Rotas Separadas (Opcional)'}
                                </button>
                            </div>

                            {/* Specific Routes */}
                            {showAdvanced && (
                                <div className="grid md:grid-cols-1 gap-6 pt-4 animate-in slide-in-from-top-4 fade-in">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-100 dark:border-gray-700 space-y-4">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Mensagens Recebidas</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={config.messageRoute || ''}
                                                    onChange={(e) => setConfig({ ...config, messageRoute: e.target.value })}
                                                    placeholder="https://.../webhook/mensagens"
                                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none dark:text-white"
                                                />
                                                <button 
                                                    onClick={() => handleTestTrigger('message')}
                                                    disabled={!config.messageRoute}
                                                    className="p-2 text-gray-500 hover:text-emerald-600"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Chamadas Perdidas</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={config.callRoute || ''}
                                                    onChange={(e) => setConfig({ ...config, callRoute: e.target.value })}
                                                    placeholder="https://.../webhook/chamadas"
                                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none dark:text-white"
                                                />
                                                <button 
                                                    onClick={() => handleTestTrigger('call')}
                                                    disabled={!config.callRoute}
                                                    className="p-2 text-gray-500 hover:text-emerald-600"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase">Mudança de Status (Conexão)</label>
                                            <div className="flex gap-2">
                                                <input 
                                                    type="text" 
                                                    value={config.statusRoute || ''}
                                                    onChange={(e) => setConfig({ ...config, statusRoute: e.target.value })}
                                                    placeholder="https://.../webhook/status"
                                                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 outline-none dark:text-white"
                                                />
                                                <button 
                                                    onClick={() => handleTestTrigger('status')}
                                                    disabled={!config.statusRoute}
                                                    className="p-2 text-gray-500 hover:text-emerald-600"
                                                >
                                                    <Send size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};