import React, { useState, useEffect } from 'react';
import { WhatsAppSession, ApiConfig } from '../types';
import { Smartphone, RefreshCw, Power, ShieldCheck, Link, Key, AlertTriangle, QrCode, CheckCircle2, Settings, Server } from 'lucide-react';

interface WhatsAppConnectProps {
    session: WhatsAppSession;
    onConnect: () => void;
    onSimulateScan: () => void;
    onDisconnect: () => void;
    apiConfig: ApiConfig;
    onUpdateConfig: (config: ApiConfig) => void;
}

export const WhatsAppConnect: React.FC<WhatsAppConnectProps> = ({ 
    session, 
    onConnect, 
    onSimulateScan, 
    onDisconnect,
    apiConfig,
    onUpdateConfig
}) => {
  const [loadingQr, setLoadingQr] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);

  // Defaults for Green API
  useEffect(() => {
      if (!apiConfig.hostUrl || apiConfig.hostUrl.includes('z-api')) {
          onUpdateConfig({ ...apiConfig, hostUrl: 'https://7103.api.greenapi.com' });
      }
  }, []);

  const handleConfigChange = (field: keyof ApiConfig, value: string) => {
      onUpdateConfig({
          ...apiConfig,
          [field]: value
      });
      setConnectionError(null);
  };

  // --- GREEN API CONNECTION LOGIC ---
  const handleGenerateQrCode = async () => {
      setConnectionError(null);
      setQrCodeBase64(null);

      if (!apiConfig.idInstance || !apiConfig.apiTokenInstance) {
          setConnectionError("Preencha o ID da Instância e o Token.");
          return;
      }

      setLoadingQr(true);
      onConnect(); 

      const cleanHost = (apiConfig.hostUrl || 'https://7103.api.greenapi.com').replace(/\/$/, '');
      const { idInstance, apiTokenInstance } = apiConfig;

      try {
          // 1. Check Status First (getStateInstance)
          const statusRes = await fetch(`${cleanHost}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`);
          
          if (!statusRes.ok) {
               if(statusRes.status === 401) throw new Error("Não autorizado. Verifique ID e Token.");
               throw new Error(`Erro ao verificar status: ${statusRes.status}`);
          }

          const statusData = await statusRes.json();
          
          if (statusData.stateInstance === 'authorized') {
              onSimulateScan(); // Already connected
              return;
          }

          // 2. Fetch QR Code (Green API returns JSON with Base64)
          const qrRes = await fetch(`${cleanHost}/waInstance${idInstance}/qrCode/${apiTokenInstance}`);
          
          if (!qrRes.ok) {
              throw new Error("Falha ao buscar QR Code. Verifique sua conexão.");
          }

          const qrData = await qrRes.json();

          if (qrData && qrData.type === 'qrCode' && qrData.message) {
              // Green API returns raw base64 string in 'message' field
              setQrCodeBase64(`data:image/png;base64,${qrData.message}`);
          } else {
             throw new Error("Formato de QR Code inválido recebido da API.");
          }

      } catch (error: any) {
          console.error("Connection Error:", error);
          let msg = error.message || 'Erro de conexão com a API.';
          
          if (msg.includes('Failed to fetch')) {
              msg = 'Falha de Conexão. Verifique se a URL do Host está correta (ex: https://7103.api.greenapi.com) e se sua internet está ativa.';
          }
          
          setConnectionError(msg);
      } finally {
          setLoadingQr(false);
      }
  };

  // Connected View
  if (session.status === 'connected') {
      return (
          <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
                  <div className="bg-emerald-600 px-8 py-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-6">
                          <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-inner">
                              <Smartphone size={40} className="text-white" />
                          </div>
                          <div>
                              <h1 className="text-3xl font-bold">WhatsApp Conectado</h1>
                              <div className="flex items-center gap-2 text-emerald-100 mt-1">
                                  <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400"></span>
                                  </span>
                                  <span className="font-medium text-sm">
                                      Instância: {apiConfig.idInstance}
                                  </span>
                              </div>
                          </div>
                      </div>
                      <button 
                        onClick={onDisconnect}
                        className="bg-white/10 hover:bg-white/20 border border-white/30 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 shadow-sm"
                      >
                          <Power size={18} /> Desconectar
                      </button>
                  </div>

                  <div className="p-8 bg-gray-50/50">
                      <div className="grid md:grid-cols-2 gap-6 mb-8">
                          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600">
                                  <ShieldCheck size={24} />
                              </div>
                              <div>
                                  <span className="text-gray-400 text-xs font-bold tracking-wider uppercase">Status da Sessão</span>
                                  <div className="text-lg font-bold text-gray-800">Autorizado</div>
                              </div>
                          </div>
                          <div className="p-5 bg-white rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                              <div className="p-3 bg-blue-50 rounded-lg text-blue-600">
                                  <Server size={24} />
                              </div>
                              <div>
                                  <span className="text-gray-400 text-xs font-bold tracking-wider uppercase">Gateway</span>
                                  <div className="text-sm font-bold text-gray-800 truncate max-w-[200px]">Green API</div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-white border border-emerald-100 rounded-2xl p-8 flex flex-col items-center text-center shadow-sm">
                          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                              <CheckCircle2 size={32} />
                          </div>
                          <h3 className="font-bold text-gray-800 text-xl mb-2">Tudo pronto!</h3>
                          <p className="text-gray-500 max-w-lg mb-6 leading-relaxed">
                              Seu bot está pronto para enviar mensagens. Certifique-se de configurar o Webhook no painel da Green API para receber respostas.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  // Disconnected View
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 animate-in fade-in duration-500">
       <div className="text-center space-y-4">
            <h1 className="text-3xl font-bold text-gray-900">Conexão WhatsApp</h1>
            <p className="text-gray-500 max-w-lg mx-auto">
                Configure sua instância (Green API) para iniciar a automação.
            </p>
       </div>

       {/* Error Display */}
       {connectionError && (
           <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-start gap-3 shadow-sm animate-in shake">
               <AlertTriangle className="text-red-500 shrink-0" />
               <div>
                   <h3 className="font-bold text-red-800 text-sm">Erro de Conexão</h3>
                   <p className="text-red-600 text-sm mt-1">{connectionError}</p>
               </div>
           </div>
       )}

       {/* Config Card */}
       <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden">
           <div className="p-8 space-y-5">
               <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase ml-1">ID da Instância (idInstance)</label>
                        <div className="relative">
                            <Settings size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="text" 
                                value={apiConfig.idInstance}
                                onChange={(e) => handleConfigChange('idInstance', e.target.value)}
                                placeholder="Ex: 7103123456"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase ml-1">Token da Instância</label>
                        <div className="relative">
                            <Key size={18} className="absolute left-3 top-3 text-gray-400" />
                            <input 
                                type="password" 
                                value={apiConfig.apiTokenInstance}
                                onChange={(e) => handleConfigChange('apiTokenInstance', e.target.value)}
                                placeholder="Token Green API"
                                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                            />
                        </div>
                    </div>
               </div>

               {/* Advanced Settings (Host) */}
               <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase ml-1">API Host</label>
                    <div className="relative">
                        <Link size={18} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            type="text" 
                            value={apiConfig.hostUrl}
                            onChange={(e) => handleConfigChange('hostUrl', e.target.value)}
                            placeholder="https://7103.api.greenapi.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
                        />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1 ml-1">Verifique o host correto no painel da Green API.</p>
               </div>

               {(session.status === 'qrcode' || session.status === 'connecting' || qrCodeBase64) && qrCodeBase64 ? (
                   <div className="flex flex-col items-center mt-6 p-4 border-t border-gray-100 animate-in fade-in">
                        <h4 className="font-bold text-gray-800 mb-4">Escaneie o QR Code</h4>
                        <div className="p-4 bg-white border-4 border-emerald-100 rounded-xl shadow-inner">
                            <img 
                                src={qrCodeBase64} 
                                alt="QR Code" 
                                className="w-64 h-64 object-contain bg-white" 
                            />
                        </div>
                        <p className="text-xs text-gray-400 mt-4">Abra o WhatsApp {'>'} Aparelhos Conectados {'>'} Conectar</p>
                        <button onClick={handleGenerateQrCode} className="text-emerald-600 text-sm mt-2 hover:underline">Atualizar Código</button>
                        
                        <div className="mt-4 w-full">
                            <button 
                                onClick={onSimulateScan}
                                className="w-full py-2 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-200"
                            >
                                Já escaneei (Confirmar Conexão)
                            </button>
                        </div>
                   </div>
               ) : (
                   <button 
                       onClick={handleGenerateQrCode}
                       disabled={loadingQr}
                       className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                   >
                       {loadingQr ? <RefreshCw className="animate-spin" /> : <QrCode />}
                       Gerar QR Code
                   </button>
               )}
           </div>
       </div>
    </div>
  );
};