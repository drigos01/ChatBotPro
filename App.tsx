import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { Dashboard } from './pages/Dashboard';
import { ConversationList } from './pages/ConversationList';
import { FlowList } from './pages/FlowList';
import { FlowBuilder } from './pages/FlowBuilder';
import { WhatsAppConnect } from './pages/WhatsAppConnect';
import { TeamManagement } from './pages/TeamManagement';
import { SubscriptionPage } from './pages/SubscriptionPage';
import { ContactList } from './pages/ContactList'; 
import { SystemHealth } from './pages/SystemHealth'; 
import { DeveloperArea } from './pages/DeveloperArea';
import { ToastContainer, ToastMessage } from './components/Toast';
import { TourGuide } from './components/TourGuide';
import { WelcomeModal } from './components/WelcomeModal';
import { 
  User, ViewState, Conversation, Flow, WhatsAppSession, ApiConfig, 
  BotSettings, TagDefinition, UserSubscription, Message, MessageType, 
  SuperRobotTrigger, CannedResponse, Contact, WebhookConfig 
} from './types';

// Initial Tags fallback
const DEFAULT_TAGS: TagDefinition[] = [
    { id: '1', name: 'Cliente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: '2', name: 'Suporte', color: 'bg-orange-100 text-orange-800 border-orange-200' },
    { id: '3', name: 'Venda', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    { id: '4', name: 'Lead Frio', color: 'bg-gray-100 text-gray-800 border-gray-200' },
];

const App: React.FC = () => {
    // Auth & View State
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewState>('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    
    // Data State
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [flows, setFlows] = useState<Flow[]>([]);
    const [tags, setTags] = useState<TagDefinition[]>([]);
    const [cannedResponses] = useState<CannedResponse[]>([]);
    
    // Settings & Config
    const [botSettings, setBotSettings] = useState<BotSettings>({
        typingDelay: 1000,
        inactivityThresholdSeconds: 300,
        inactivityWarningMessage: 'Ainda está aí?',
        autoHandoffSeconds: 600,
        autoHandoffMessage: 'Transferindo para humano...',
        autoArchiveMinutes: 60,
        disableBotOnAgentInitiated: false,
        enableSmartCompose: true,
        fuzzySensitivity: 2
    });
    
    // Environment Variables Initialization for Vercel
    // Helper to safely access env vars without crashing if import.meta.env is undefined
    const getEnv = () => {
        try {
            return (import.meta as any).env || {};
        } catch {
            return {};
        }
    };

    const [apiConfig, setApiConfig] = useState<ApiConfig>(() => {
        const env = getEnv();
        const envId = env.VITE_GREEN_API_ID || '';
        const envToken = env.VITE_GREEN_API_TOKEN || '';
        const envHost = env.VITE_GREEN_API_HOST || 'https://7103.api.greenapi.com';
        return {
            idInstance: envId,
            apiTokenInstance: envToken,
            hostUrl: envHost
        };
    });

    const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
        defaultRoute: '',
        incomingToken: ''
    });

    const [whatsappSession, setWhatsappSession] = useState<WhatsAppSession>(() => {
        const env = getEnv();
        const isConnected = !!(env.VITE_GREEN_API_ID && env.VITE_GREEN_API_TOKEN);
        return {
            status: isConnected ? 'connected' : 'disconnected'
        };
    });

    const [superRobotDatabase, setSuperRobotDatabase] = useState<SuperRobotTrigger[]>([]);
    const [isSuperRobotActive, setIsSuperRobotActive] = useState(true);

    // UI States
    const [editingFlowId, setEditingFlowId] = useState<string | null>(null);
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);

    // Polling Refs
    const pollingRef = useRef<any>(null);
    const messagePollingRef = useRef<any>(null);
    const isPollingRef = useRef(false); // Controls the recursive loop
    const avatarSyncRef = useRef<any>(null);

    // --- PERSISTENCE EFFECT ---
    useEffect(() => {
        // Load Data on Mount
        const savedTags = localStorage.getItem('chatpro_tags');
        if (savedTags) {
            setTags(JSON.parse(savedTags));
        } else {
            setTags(DEFAULT_TAGS);
        }

        const savedConvos = localStorage.getItem('chatpro_conversations');
        if (savedConvos) {
            // Need to revive Dates
            const parsed = JSON.parse(savedConvos).map((c: any) => ({
                ...c,
                lastActivity: new Date(c.lastActivity),
                messages: c.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
            }));
            setConversations(parsed);
        }

        const savedFlows = localStorage.getItem('chatpro_flows');
        if(savedFlows) setFlows(JSON.parse(savedFlows));

        const savedWebhook = localStorage.getItem('chatpro_webhook_config');
        if(savedWebhook) setWebhookConfig(JSON.parse(savedWebhook));

        // Dark Mode
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }
    }, []);

    // Save Data on Change
    useEffect(() => {
        localStorage.setItem('chatpro_tags', JSON.stringify(tags));
    }, [tags]);

    useEffect(() => {
        localStorage.setItem('chatpro_conversations', JSON.stringify(conversations));
    }, [conversations]);

    useEffect(() => {
        localStorage.setItem('chatpro_flows', JSON.stringify(flows));
    }, [flows]);

    // Dark Mode Class
    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // --- GREEN API STATUS & MESSAGE POLLING ---
    useEffect(() => {
        if (whatsappSession.status === 'connected' && apiConfig.idInstance && apiConfig.apiTokenInstance) {
            startStatusCheck();
            startMessagePolling();
            startAvatarSync();
        } else {
            stopStatusCheck();
            stopMessagePolling();
            stopAvatarSync();
        }
        return () => {
            stopStatusCheck();
            stopMessagePolling();
            stopAvatarSync();
        };
    }, [whatsappSession.status, apiConfig]);

    const startStatusCheck = () => {
        if (pollingRef.current) return;
        pollingRef.current = setInterval(async () => {
            await checkStatus();
        }, 30000); 
    };

    const stopStatusCheck = () => {
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
    };

    const checkStatus = async () => {
        const { hostUrl, idInstance, apiTokenInstance } = apiConfig;
        const cleanHost = hostUrl.trim().replace(/\/$/, '');

        try {
            const response = await fetch(`${cleanHost}/waInstance${idInstance}/getStateInstance/${apiTokenInstance}`);
            if (response.ok) {
                const data = await response.json();
                if (data.stateInstance !== 'authorized') {
                    setWhatsappSession({ status: 'disconnected' });
                    showToast('WhatsApp desconectado', 'error');
                }
            }
        } catch (error) {}
    };

    // --- AVATAR SYNC (BACKGROUND) ---
    const startAvatarSync = () => {
        if (avatarSyncRef.current) return;
        // Check for missing avatars every 15 seconds
        avatarSyncRef.current = setInterval(async () => {
            await syncMissingAvatars();
        }, 15000);
    };

    const stopAvatarSync = () => {
        if (avatarSyncRef.current) {
            clearInterval(avatarSyncRef.current);
            avatarSyncRef.current = null;
        }
    };

    const fetchAvatar = async (chatId: string): Promise<string | undefined> => {
        const { hostUrl, idInstance, apiTokenInstance } = apiConfig;
        const cleanHost = hostUrl.trim().replace(/\/$/, '');
        try {
            const res = await fetch(`${cleanHost}/waInstance${idInstance}/getAvatar/${apiTokenInstance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });
            if(res.ok) {
                const data = await res.json();
                // Check if urlAvatar exists and is not empty
                if (data && data.urlAvatar) {
                    return data.urlAvatar;
                }
            }
        } catch(e) {
            // silent fail
        }
        return undefined;
    };

    const syncMissingAvatars = async () => {
        // Find conversations without avatarUrl
        const missing = conversations.filter(c => !c.avatarUrl && c.chatId);
        
        // Process one by one to avoid rate limits, limit to 3 per cycle
        const batch = missing.slice(0, 3);
        
        for (const convo of batch) {
            if (convo.chatId) {
                const url = await fetchAvatar(convo.chatId);
                if (url) {
                    setConversations(prev => prev.map(c => c.id === convo.id ? { ...c, avatarUrl: url } : c));
                }
            }
        }
    };

    // --- RECEIVE MESSAGES (POLLING - FAST QUEUE) ---
    const startMessagePolling = () => {
        if (isPollingRef.current) return;
        isPollingRef.current = true;
        // console.log("Iniciando recepção de mensagens (Fast Queue)...");
        pollMessagesLoop();
    };

    const stopMessagePolling = () => {
        isPollingRef.current = false;
        if (messagePollingRef.current) {
            clearTimeout(messagePollingRef.current);
            messagePollingRef.current = null;
        }
    };

    const pollMessagesLoop = async () => {
        if (!isPollingRef.current) return;

        const messageProcessed = await receiveMessages();
        
        // If a message was found, fetch the next one immediately (flush queue)
        // If no message, wait 3 seconds to save bandwidth
        const nextDelay = messageProcessed ? 100 : 3000;
        
        messagePollingRef.current = setTimeout(pollMessagesLoop, nextDelay);
    };

    const receiveMessages = async (): Promise<boolean> => {
        const { hostUrl, idInstance, apiTokenInstance } = apiConfig;
        const cleanHost = hostUrl.trim().replace(/\/$/, '');
        let processed = false;

        try {
            // receiveNotification deletes the message from queue only if we call deleteNotification
            const response = await fetch(`${cleanHost}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`);
            if (!response.ok) return false;

            const data = await response.json();
            
            // If no data or null, stop
            if (!data || !data.receiptId) return false;

            const body = data.body;
            processed = true;
            
            // 1. Handle Incoming Messages (From Customer)
            if (body.typeWebhook === 'incomingMessageReceived' || body.typeWebhook === 'incomingMessage') {
                const messageData = body.messageData;
                const senderData = body.senderData;
                
                const chatId = senderData.chatId;
                const senderName = senderData.senderName || senderData.chatName || chatId.split('@')[0];
                
                // Extract Text
                let textMessage = messageData?.textMessageData?.textMessage || messageData?.extendedTextMessageData?.text || '';
                // Handle Caption in Media
                if (!textMessage && (messageData?.fileMessageData?.caption)) {
                    textMessage = messageData.fileMessageData.caption;
                }

                // Identify Type
                let msgType: MessageType = 'text';
                
                if (messageData?.typeMessage === 'imageMessage') {
                    msgType = 'image';
                    textMessage = textMessage || '📷 Imagem Recebida'; 
                }

                if (textMessage || msgType !== 'text') {
                    await handleIncomingPayload(chatId, senderName, textMessage, msgType, body.timestamp, body.idMessage);
                }
            }
            
            // 2. Handle Outgoing Messages (Synced from Phone)
            else if (body.typeWebhook === 'outgoingMessageReceived' || body.typeWebhook === 'outgoingAPIMessageReceived') {
                 const messageData = body.messageData;
                 const senderData = body.senderData;
                 const chatId = senderData.chatId;
                 const textMessage = messageData?.textMessageData?.textMessage || messageData?.extendedTextMessageData?.text || '';
                 
                 if (textMessage) {
                     handleOutgoingPayload(chatId, textMessage, body.timestamp, body.idMessage);
                 }
            }

            // Delete notification to acknowledge receipt - CRITICAL
            await fetch(`${cleanHost}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${data.receiptId}`, {
                method: 'DELETE'
            });

        } catch (error) {
            // console.error("Polling Error:", error);
            // Even if error, allow loop to continue
        }
        return processed;
    };

    const handleIncomingPayload = async (chatId: string, senderName: string, text: string, type: MessageType, timestamp: number, idMessage: string) => {
        let isNew = false;
        let conversationId = '';
        let currentStatus = 'active';

        setConversations(prev => {
            const existing = prev.find(c => c.chatId === chatId);
            
            if (existing) {
                // Check if message already exists to avoid dupes
                if (existing.messages.some(m => m.id === idMessage)) return prev;

                const newMessage: Message = {
                    id: idMessage || Date.now().toString(),
                    text,
                    sender: 'user',
                    timestamp: new Date(timestamp * 1000),
                    type
                };
                conversationId = existing.id;
                currentStatus = existing.status;
                return prev.map(c => c.id === existing.id ? {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastActivity: new Date(),
                    unreadCount: (c.unreadCount || 0) + 1,
                } : c);
            } else {
                isNew = true;
                return prev;
            }
        });

        // Always show toast for incoming user message
        showToast(`Mensagem de ${senderName}: ${text.substring(0, 30)}${text.length > 30 ? '...' : ''}`, 'info');

        if (isNew) {
            // Fetch avatar immediately for new chat
            const avatarUrl = await fetchAvatar(chatId);
            
            const newConvo: Conversation = {
                id: Date.now().toString(),
                chatId: chatId,
                customerName: senderName,
                customerPhone: chatId.split('@')[0],
                avatarUrl: avatarUrl,
                status: 'active', // Default to Bot
                stage: 'new',
                lastActivity: new Date(),
                messages: [{
                    id: idMessage,
                    text,
                    sender: 'user',
                    timestamp: new Date(),
                    type
                }],
                collectedData: {},
                currentStepIndex: 0,
                flowId: 'default',
                tags: [],
                unreadCount: 1
            };
            setConversations(prev => [newConvo, ...prev]);
            conversationId = newConvo.id;
        }

        // Trigger Bot Engine if status is active
        if (conversationId && currentStatus === 'active') {
             processBotLogic(conversationId, text);
        }
    };

    const handleOutgoingPayload = (chatId: string, text: string, timestamp: number, idMessage: string) => {
        setConversations(prev => {
            const existing = prev.find(c => c.chatId === chatId);
            if (existing) {
                 if (existing.messages.some(m => m.id === idMessage)) return prev;

                 const newMessage: Message = {
                    id: idMessage,
                    text,
                    sender: 'agent', // Or 'me'
                    timestamp: new Date(timestamp * 1000),
                    type: 'text'
                };
                return prev.map(c => c.id === existing.id ? {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastActivity: new Date()
                } : c);
            }
            return prev;
        });
    };

    // --- SENDING LOGIC (GREEN API) ---
    
    const sendZapMessage = async (chatId: string, text: string, type: MessageType, mediaUrl?: string) => {
        if (!apiConfig.idInstance || !apiConfig.apiTokenInstance) return;
        
        const cleanHost = apiConfig.hostUrl.trim().replace(/\/$/, '');
        // Green API expects chatId format: "123456789@c.us"
        const finalChatId = chatId.includes('@') ? chatId : `${chatId}@c.us`;

        try {
            let endpoint = 'sendMessage';
            let body: any = { chatId: finalChatId, message: text };

            if (mediaUrl) {
                endpoint = 'sendFileByUrl';
                const fileName = type === 'document' ? 'document.pdf' : `${type}.jpg`;
                
                body = {
                    chatId: finalChatId,
                    urlFile: mediaUrl,
                    fileName: fileName,
                    caption: text
                };
            }

            const response = await fetch(`${cleanHost}/waInstance${apiConfig.idInstance}/${endpoint}/${apiConfig.apiTokenInstance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (!response.ok) {
                 const errText = await response.text();
                 console.error("Green API Error:", errText);
                 showToast("Erro ao enviar. Verifique a conexão.", "error");
            }

        } catch (error) {
            console.error("Erro no envio:", error);
            showToast("Falha no envio da mensagem.", "error");
        }
    };

    // --- BOT ENGINE LOGIC ---
    const validateInput = (text: string, type?: string) => {
        if (!type || type === 'text') return true;
        if (type === 'email') return /\S+@\S+\.\S+/.test(text);
        if (type === 'phone') return text.replace(/\D/g, '').length >= 8;
        if (type === 'number') return !isNaN(Number(text));
        if (type === 'date') return !isNaN(Date.parse(text));
        return true;
    };

    const processBotLogic = async (convoId: string, lastUserText: string) => {
        // Delay for natural feel
        await new Promise(r => setTimeout(r, 1500));

        setConversations(prev => {
            const convo = prev.find(c => c.id === convoId);
            // Safety check: if conversation status changed (e.g. human took over), stop bot.
            if (!convo || convo.status !== 'active') return prev;

            // Find Active Flow
            const flow = flows.find(f => f.id === convo.flowId) || flows[0];
            if (!flow || !flow.isActive) return prev;

            const steps = flow.steps;
            const currentIndex = convo.currentStepIndex;

            // If index is out of bounds, flow is done or invalid
            if (currentIndex >= steps.length) return prev;

            const currentStep = steps[currentIndex];

            // 1. Validate Input
            if (!validateInput(lastUserText, currentStep.validation)) {
                const errorText = currentStep.errorMessage || 'Resposta inválida. Por favor, tente novamente.';
                
                // Send Error Message
                const errorMsg: Message = {
                    id: Date.now().toString(),
                    text: errorText,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'text'
                };
                
                sendZapMessage(convo.chatId || convo.customerPhone, errorText, 'text');

                return prev.map(c => c.id === convoId ? {
                    ...c,
                    messages: [...c.messages, errorMsg]
                } : c);
            }

            // 2. Capture Data
            const newCollectedData = {
                ...convo.collectedData,
                [currentStep.fieldName || `step_${currentIndex}`]: lastUserText
            };

            // 3. Determine Next Step
            let nextIndex = currentIndex + 1;
            
            // Check Routes
            if (currentStep.routes && currentStep.routes.length > 0) {
                const match = currentStep.routes.find(r => 
                    lastUserText.toLowerCase().includes(r.condition.toLowerCase())
                );
                if (match) {
                    if (match.targetStepId === 'END') {
                        nextIndex = 9999; // Force End
                    } else {
                        const targetIdx = steps.findIndex(s => s.id === match.targetStepId);
                        if (targetIdx !== -1) nextIndex = targetIdx;
                    }
                }
            } else if (currentStep.nextStepId) {
                if (currentStep.nextStepId === 'END') {
                    nextIndex = 9999;
                } else {
                    const targetIdx = steps.findIndex(s => s.id === currentStep.nextStepId);
                    if (targetIdx !== -1) nextIndex = targetIdx;
                }
            }

            // 4. Handle End of Flow
            if (nextIndex >= steps.length) {
                const endText = flow.endMessage || 'Atendimento finalizado com sucesso.';
                
                // Generate Summary of collected data
                let summaryText = '';
                if (Object.keys(newCollectedData).length > 0) {
                    summaryText = Object.entries(newCollectedData)
                        .map(([key, val]) => `${key}: ${val}`)
                        .join('\n');
                }

                const endMsg: Message = {
                    id: Date.now().toString(),
                    text: endText,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'text'
                };
                
                sendZapMessage(convo.chatId || convo.customerPhone, endText, 'text');

                return prev.map(c => c.id === convoId ? {
                    ...c,
                    messages: [...c.messages, endMsg],
                    collectedData: newCollectedData,
                    status: 'completed',
                    stage: 'closed',
                    resolutionSummary: summaryText // Store summary in resolution
                } : c);
            }

            // 5. Execute Next Step
            const nextStep = steps[nextIndex];
            const nextText = nextStep.question;
            const nextMsg: Message = {
                id: Date.now().toString(),
                text: nextText,
                sender: 'bot',
                timestamp: new Date(),
                type: 'text'
            };

            // Send Media if present
            if (nextStep.mediaUrl) {
                const mediaType = nextStep.mediaType || 'image';
                const mediaCaption = nextStep.mediaType === 'image' ? '📷 Imagem' : '🎥 Vídeo';
                sendZapMessage(convo.chatId || convo.customerPhone, mediaCaption, mediaType, nextStep.mediaUrl);
            }

            // Send Text Question
            sendZapMessage(convo.chatId || convo.customerPhone, nextText, 'text');

            return prev.map(c => c.id === convoId ? {
                ...c,
                messages: [...c.messages, nextMsg],
                collectedData: newCollectedData,
                currentStepIndex: nextIndex
            } : c);
        });
    };

    // Helpers
    const showToast = (message: string, type: 'success' | 'error' | 'info') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    };

    const handleLogin = (loggedUser: User) => {
        setUser(loggedUser);
        setView('dashboard');
        showToast(`Bem-vindo, ${loggedUser.name}!`, 'success');
    };

    const handleLogout = () => {
        setUser(null);
        setView('dashboard'); // Reset view for next login
    };

    const handleUpdateProfile = (updatedUser: User) => {
        setUser(updatedUser);
        showToast('Perfil atualizado com sucesso!', 'success');
    };

    // Conversations Handlers
    const handleSendMessage = (convoId: string, text: string, type: MessageType, mediaUrl?: string, replyTo?: Message) => {
        const convo = conversations.find(c => c.id === convoId);
        
        // 1. Optimistic Update
        setConversations(prev => prev.map(c => {
            if (c.id === convoId) {
                const newMessage: Message = {
                    id: Date.now().toString(),
                    text,
                    sender: 'agent',
                    timestamp: new Date(),
                    type,
                    mediaUrl,
                    replyTo
                };
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastActivity: new Date(),
                    unreadCount: 0 
                };
            }
            return c;
        }));

        // 2. Real Send
        if (convo) {
            const dest = convo.chatId || convo.customerPhone.replace(/\D/g, '');
            sendZapMessage(dest, text, type, mediaUrl);
        }
    };

    const handleUpdateConversation = (id: string, updates: Partial<Conversation>) => {
        setConversations(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const handleAddNewConversation = async (newConvo: Conversation) => {
        // Ensure chatId exists for sending
        if (!newConvo.chatId) {
            const nums = newConvo.customerPhone.replace(/\D/g, '');
            newConvo.chatId = newConvo.isGroup ? `${nums}@g.us` : `${nums}@c.us`; 
        }
        
        // Try fetch avatar immediately
        if(newConvo.chatId) {
            const avatar = await fetchAvatar(newConvo.chatId);
            if(avatar) newConvo.avatarUrl = avatar;
        }

        setConversations(prev => [newConvo, ...prev]);
        showToast('Nova conversa iniciada', 'success');
    };

    // Start Chat from Contacts List
    const handleStartChatFromContact = async (contact: Contact) => {
        // Check if exists
        const existing = conversations.find(c => c.chatId === contact.id);
        if (existing) {
            setView('conversations');
            showToast('Conversa já existe. Busque na lista.', 'info');
        } else {
            const avatarUrl = await fetchAvatar(contact.id);
            const newConvo: Conversation = {
                id: Date.now().toString(),
                chatId: contact.id,
                customerName: contact.name,
                customerPhone: contact.id.split('@')[0],
                avatarUrl: avatarUrl,
                status: 'in_progress',
                stage: 'open',
                lastActivity: new Date(),
                messages: [],
                collectedData: {},
                currentStepIndex: 0,
                flowId: 'default',
                tags: [],
                isGroup: contact.type === 'group'
            };
            handleAddNewConversation(newConvo);
            setView('conversations');
        }
    };

    const handleSimulateIncoming = (convoId: string, text: string) => {
        // This is for manual simulation via menu
        const convo = conversations.find(c => c.id === convoId);
        if (convo && convo.chatId) {
            handleIncomingPayload(convo.chatId, convo.customerName, text, 'text', Date.now() / 1000, Date.now().toString());
        }
    };

    // Flow Handlers
    const handleSaveFlow = (flow: Flow) => {
        if (flows.find(f => f.id === flow.id)) {
            setFlows(prev => prev.map(f => f.id === flow.id ? flow : f));
            showToast('Fluxo atualizado', 'success');
        } else {
            setFlows(prev => [...prev, flow]);
            showToast('Fluxo criado', 'success');
        }
        setView('flows');
        setEditingFlowId(null);
    };

    const handleDeleteFlow = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este fluxo?')) {
            setFlows(prev => prev.filter(f => f.id !== id));
            showToast('Fluxo removido', 'success');
        }
    };

    // Connection Handlers
    const handleConnectWhatsApp = () => {
        setWhatsappSession({ status: 'connecting' });
    };

    const handleSimulateScan = () => {
        setWhatsappSession({ status: 'connected', phoneNumber: apiConfig.idInstance, batteryLevel: 100 });
        showToast('Green API Conectada!', 'success');
        startStatusCheck();
        startMessagePolling();
        startAvatarSync();
    };

    const handleDisconnectWhatsApp = () => {
        setWhatsappSession({ status: 'disconnected' });
        showToast('Desconectado', 'info');
        stopStatusCheck();
        stopMessagePolling();
        stopAvatarSync();
    };

    // Tags
    const handleCreateTag = (tag: TagDefinition) => {
        setTags(prev => [...prev, tag]);
        showToast('Tag criada', 'success');
    };

    const handleUpdateTag = (tag: TagDefinition) => {
        setTags(prev => prev.map(t => t.id === tag.id ? tag : t));
        showToast('Tag atualizada', 'success');
    };

    const handleDeleteTag = (id: string) => {
        if(window.confirm("Deseja realmente excluir esta tag?")) {
            setTags(prev => prev.filter(t => t.id !== id));
            showToast('Tag removida', 'success');
        }
    };

    // Subscription
    const handleUpdateSubscription = (sub: UserSubscription) => {
        if (user) {
            setUser({ ...user, subscription: sub });
            showToast('Assinatura atualizada!', 'success');
        }
    };

    if (!user) {
        return (
            <>
                <LoginPage onLogin={handleLogin} />
                <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            </>
        );
    }

    return (
        <Layout 
            currentView={view} 
            onChangeView={setView} 
            user={user} 
            onLogout={handleLogout}
            onUpdateProfile={handleUpdateProfile}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
        >
            {view === 'dashboard' && (
                <Dashboard 
                    conversations={conversations} 
                    onChangeView={setView} 
                    onOpenSettings={() => setView('settings' as ViewState)}
                />
            )}

            {view === 'conversations' && (
                <ConversationList 
                    user={user}
                    onUpdateAgentStatus={(status) => setUser({...user, status})}
                    conversations={conversations}
                    onSendMessageToConversation={handleSendMessage}
                    onMarkAsCompleted={(id) => handleUpdateConversation(id, { status: 'completed', stage: 'closed' })}
                    onUpdateStatus={(id, status) => handleUpdateConversation(id, { status })}
                    onUpdateConversation={handleUpdateConversation}
                    onAddNewConversation={handleAddNewConversation}
                    botSettings={botSettings}
                    availableTags={tags}
                    onCreateTag={handleCreateTag}
                    onUpdateTag={handleUpdateTag}
                    onDeleteTagDefinition={handleDeleteTag}
                    cannedResponses={cannedResponses}
                    isSuperRobotActive={isSuperRobotActive}
                    onToggleSuperRobot={() => setIsSuperRobotActive(!isSuperRobotActive)}
                    superRobotDatabase={superRobotDatabase}
                    onUpdateSuperRobotDatabase={setSuperRobotDatabase}
                    onSimulateIncomingMessage={handleSimulateIncoming}
                />
            )}

            {view === 'contacts' && (
                <ContactList 
                    apiConfig={apiConfig} 
                    onStartChat={handleStartChatFromContact}
                    existingConversations={conversations}
                />
            )}

            {view === 'health' && (
                <SystemHealth apiConfig={apiConfig} />
            )}

            {view === 'flows' && (
                <FlowList 
                    flows={flows} 
                    onEditFlow={(id) => { setEditingFlowId(id); setView('flow-builder'); }}
                    onDeleteFlow={handleDeleteFlow}
                    onCreateFlow={() => { setEditingFlowId(null); setView('flow-builder'); }}
                    isAdmin={user.role === 'admin'}
                />
            )}

            {view === 'flow-builder' && (
                <FlowBuilder 
                    initialFlow={editingFlowId ? flows.find(f => f.id === editingFlowId) : undefined}
                    onSave={handleSaveFlow}
                    onBack={() => setView('flows')}
                    onTest={() => {}}
                />
            )}

            {view === 'connect' && (
                <WhatsAppConnect 
                    session={whatsappSession}
                    onConnect={handleConnectWhatsApp}
                    onSimulateScan={handleSimulateScan}
                    onDisconnect={handleDisconnectWhatsApp}
                    apiConfig={apiConfig}
                    onUpdateConfig={setApiConfig}
                />
            )}

            {view === 'team' && (
                <TeamManagement currentUser={user} />
            )}

            {view === 'subscription' && (
                <SubscriptionPage user={user} onUpdateSubscription={handleUpdateSubscription} />
            )}

            {view === 'developer' && (
                <DeveloperArea 
                    webhookConfig={webhookConfig}
                    onUpdateWebhookConfig={setWebhookConfig}
                />
            )}

            {view === 'settings' && (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <h2 className="text-2xl font-bold mb-4">Configurações</h2>
                    <p>Painel de configurações gerais do sistema.</p>
                </div>
            )}

            <ToastContainer toasts={toasts} onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
            
            <TourGuide 
                currentView={view} 
                onCompleteTour={() => { 
                    if(user) setUser({...user, tourCompleted: true}); 
                    showToast('Tutorial concluído!', 'info');
                }}
                isTourCompleted={!!user.tourCompleted}
            />

            {showWelcomeModal && (
                <WelcomeModal onClose={() => {
                    setShowWelcomeModal(false);
                    localStorage.setItem('hasSeenWelcome', 'true');
                }} />
            )}
        </Layout>
    );
};

export default App;