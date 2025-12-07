import React, { useState, useEffect } from 'react';
import { ApiConfig } from '../types';
import { Activity, CheckCircle2, XCircle, Send, Smartphone, Battery, Server, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';

interface SystemHealthProps {
    apiConfig: ApiConfig;
}

export const SystemHealth: React.FC<SystemHealthProps> = ({ apiConfig }) => {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline' | 'error'>('checking');
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const [testPhone, setTestPhone] = useState('');
    const [testMessage, setTestMessage] = useState('Olá! Teste de conexão do ChatBot Pro.');
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<{success: boolean, msg: string} | null>(null);
    const [lastError, setLastError] = useState<string | null>(null);

    useEffect(() => {
        checkHealth();
    }, []);

    const checkHealth = async () => {
        setStatus('checking');
        setDeviceInfo(null);
        setLastError(null);
        
        if (!apiConfig.idInstance || !apiConfig.apiTokenInstance) {
            setStatus('error');
            setLastError("Credenciais não configuradas.");
            return;
        }

        const cleanHost = apiConfig.hostUrl.replace(/\/$/, '');

        try {
            // Check State (Green API Endpoint: getStateInstance)
            const statusRes = await fetch(`${cleanHost}/waInstance${apiConfig.idInstance}/getStateInstance/${apiConfig.apiTokenInstance}`);
            
            if (!statusRes.ok) {
                throw new Error(`HTTP Error: ${statusRes.status} - ${statusRes.statusText}`);
            }

            const statusData = await statusRes.json();

            // Green API returns { stateInstance: "authorized" }
            if (statusData.stateInstance === 'authorized') {
                setStatus('online');
                setDeviceInfo({ smartphone: 'Conectado (Green API)' }); 
            } else {
                setStatus('offline');
                setLastError(`Status: ${statusData.stateInstance || 'Desconhecido'}`);
            }
        } catch (error: any) {
            console.error("Health check failed", error);
            let msg = error.message;
            if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                msg = 'Falha de conexão. Possível bloqueio CORS ou URL incorreta. Verifique se o Host URL está correto e acessível.';
            }
            setLastError(msg);
            setStatus('error');
        }
    };

    const handleSendTest = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendResult(null);

        const cleanHost = apiConfig.hostUrl.replace(/\/$/, '');
        // Format phone: remove non-digits
        const cleanPhone = testPhone.replace(/\D/g, '');
        const chatId = `${cleanPhone}@c.us`;

        try {
            const response = await fetch(`${cleanHost}/waInstance${apiConfig.idInstance}/sendMessage/${apiConfig.apiTokenInstance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chatId: chatId,
                    message: testMessage
                })
            });

            if (!response.ok) {
                 const txt = await response.text();
                 throw new Error(`HTTP Error: ${response.status} - ${txt}`);
            }

            const data = await response.json();

            if (data.idMessage) {
                setSendResult({ success: true, msg: `Mensagem enviada! ID: ${data.idMessage}` });
            } else {
                setSendResult({ success: false, msg: `API respondeu, mas sem ID.` });
            }

        } catch (error: any) {
            let msg = error.message;
            if (msg.includes('Failed to fetch')) msg = 'Erro de rede/CORS. Verifique sua conexão ou configurações da API.';
            setSendResult({ success: false, msg });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Activity className="text-emerald-500" /> Status do Sistema
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Diagnóstico de conexão Green API.</p>
                </div>
                <button 
                    onClick={checkHealth} 
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                    <RefreshCw size={16} className={status === 'checking' ? 'animate-spin' : ''} /> Atualizar Status
                </button>
            </div>

            {/* Status Cards */}
            <div className="grid md:grid-cols-3 gap-6">
                {/* Connection Status */}
                <div className={`p-6 rounded-xl border shadow-sm flex flex-col items-center text-center ${
                    status === 'online' ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800' : 
                    status === 'error' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                    'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                }`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                        status === 'online' ? 'bg-emerald-100 text-emerald-600' : 
                        status === 'error' ? 'bg-red-100 text-red-600' : 
                        'bg-gray-200 text-gray-500'
                    }`}>
                        {status === 'online' ? <CheckCircle2 size={32} /> : status === 'checking' ? <RefreshCw size={32} className="animate-spin" /> : <XCircle size={32} />}
                    </div>
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                        {status === 'online' ? 'Conectado' : status === 'checking' ? 'Verificando...' : 'Desconectado'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">{apiConfig.hostUrl}</p>
                    {lastError && <p className="text-xs text-red-500 mt-2 font-medium break-words px-2">{lastError}</p>}
                </div>

                {/* Instance Info */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                            <Server size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Instância</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                            <span className="text-gray-500">ID:</span>
                            <span className="font-mono font-bold text-gray-800 dark:text-white">{apiConfig.idInstance || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-700 pb-1">
                            <span className="text-gray-500">Smartphone:</span>
                            <span className={`font-bold ${deviceInfo?.smartphone ? 'text-green-600' : 'text-gray-400'}`}>
                                {deviceInfo?.smartphone || 'Desconhecido'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Device/Battery */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col justify-between">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                            <Smartphone size={20} />
                        </div>
                        <h4 className="font-bold text-gray-700 dark:text-gray-200">Dispositivo</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                         <div className="flex justify-between items-center">
                            <span className="text-gray-500">Bateria:</span>
                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 text-xs font-bold">N/A</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-500">API Status:</span>
                            <span className="font-mono">OK</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Test Message Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center gap-2">
                    <Send size={18} className="text-emerald-600" />
                    <h3 className="font-bold text-gray-800 dark:text-white">Teste de Envio (Green API)</h3>
                </div>
                
                <div className="p-6">
                    <form onSubmit={handleSendTest} className="max-w-xl space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Telefone de Destino</label>
                                <input 
                                    type="text" 
                                    placeholder="5511999999999" 
                                    value={testPhone}
                                    onChange={(e) => setTestPhone(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                                    required
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Inclua o código do país (55) e DDD. Apenas números.</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensagem</label>
                            <textarea 
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none h-24 resize-none"
                                required
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <button 
                                type="submit" 
                                disabled={sending || status !== 'online'}
                                className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-all"
                            >
                                {sending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                                Enviar Teste
                            </button>
                            
                            {status !== 'online' && (
                                <span className="text-xs text-red-500 flex items-center gap-1 font-medium">
                                    <AlertTriangle size={12} /> API Offline - Não é possível enviar.
                                </span>
                            )}
                        </div>
                    </form>

                    {sendResult && (
                        <div className={`mt-6 p-4 rounded-lg border flex items-start gap-3 animate-in slide-in-from-top-2 ${
                            sendResult.success 
                            ? 'bg-green-50 border-green-200 text-green-800' 
                            : 'bg-red-50 border-red-200 text-red-800'
                        }`}>
                            {sendResult.success ? <ShieldCheck size={20} className="mt-0.5" /> : <XCircle size={20} className="mt-0.5" />}
                            <div>
                                <h4 className="font-bold text-sm">{sendResult.success ? 'Sucesso' : 'Falha no Envio'}</h4>
                                <p className="text-xs mt-1 font-mono">{sendResult.msg}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};