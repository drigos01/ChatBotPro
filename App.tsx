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
import { ToastContainer, ToastMessage } from './components/Toast';
import { TourGuide } from './components/TourGuide';
import { WelcomeModal } from './components/WelcomeModal';
import { 
  User, ViewState, Conversation, Flow, WhatsAppSession, ApiConfig, 
  BotSettings, TagDefinition, UserSubscription, Message, MessageType, 
  SuperRobotTrigger, CannedResponse, Contact 
} from './types';

// Mock Data for Initial State (Empty for Production feel)
const INITIAL_CONVERSATIONS: Conversation[] = [];

const INITIAL_FLOWS: Flow[] = [
    {
        id: '1',
        name: 'Fluxo Exemplo',
        description: 'Fluxo básico de atendimento',
        isActive: true,
        welcomeMessage: 'Olá! Bem-vindo.',
        endMessage: 'Até logo!',
        steps: [
            { id: 's1', stepType: 'welcome', question: 'Olá! Como posso ajudar?', fieldName: '', position: { x: 100, y: 100 } }
        ]
    }
];

const INITIAL_TAGS: TagDefinition[] = [
    { id: '1', name: 'Cliente', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { id: '2', name: 'Suporte', color: 'bg-orange-100 text-orange-800 border-orange-200' },
];

const App: React.FC = () => {
    // Auth & View State
    const [user, setUser] = useState<User | null>(null);
    const [view, setView] = useState<ViewState>('dashboard');
    const [darkMode, setDarkMode] = useState(false);
    
    // Data State
    const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
    const [flows, setFlows] = useState<Flow[]>(INITIAL_FLOWS);
    const [tags, setTags] = useState<TagDefinition[]>(INITIAL_TAGS);
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
    
    const [apiConfig, setApiConfig] = useState<ApiConfig>({
        idInstance: '',
        apiTokenInstance: '',
        hostUrl: 'https://7103.api.greenapi.com'
    });

    const [whatsappSession, setWhatsappSession] = useState<WhatsAppSession>({
        status: 'disconnected'
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

    // Effects
    useEffect(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setDarkMode(true);
        }
    }, []);

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
        } else {
            stopStatusCheck();
            stopMessagePolling();
        }
        return () => {
            stopStatusCheck();
            stopMessagePolling();
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
        const cleanHost = hostUrl.replace(/\/$/, '');

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

    // --- RECEIVE MESSAGES (POLLING) ---
    const startMessagePolling = () => {
        if (messagePollingRef.current) return;
        
        console.log("Iniciando recepção de mensagens...");
        messagePollingRef.current = setInterval(async () => {
            await receiveMessages();
        }, 5000); // Check every 5 seconds
    };

    const stopMessagePolling = () => {
        if (messagePollingRef.current) {
            clearInterval(messagePollingRef.current);
            messagePollingRef.current = null;
        }
    };

    const fetchAvatar = async (chatId: string): Promise<string | undefined> => {
        const { hostUrl, idInstance, apiTokenInstance } = apiConfig;
        const cleanHost = hostUrl.replace(/\/$/, '');
        try {
            const res = await fetch(`${cleanHost}/waInstance${idInstance}/getAvatar/${apiTokenInstance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });
            if(res.ok) {
                const data = await res.json();
                return data.urlAvatar;
            }
        } catch(e) {
            console.error("Failed to fetch avatar", e);
        }
        return undefined;
    };

    const receiveMessages = async () => {
        const { hostUrl, idInstance, apiTokenInstance } = apiConfig;
        const cleanHost = hostUrl.replace(/\/$/, '');

        try {
            // receiveNotification deletes the message from queue only if we call deleteNotification
            const response = await fetch(`${cleanHost}/waInstance${idInstance}/receiveNotification/${apiTokenInstance}`);
            if (!response.ok) return;

            const data = await response.json();
            
            // If no data or null, stop
            if (!data || !data.receiptId) return;

            // Process Notification
            const body = data.body;
            
            // Handle Incoming Message
            if (body.typeWebhook === 'incomingMessageReceived' || body.typeWebhook === 'incomingMessage') {
                const messageData = body.messageData;
                const senderData = body.senderData;
                
                const chatId = senderData.chatId;
                const senderName = senderData.senderName || senderData.chatName || chatId.split('@')[0];
                const textMessage = messageData?.textMessageData?.textMessage || messageData?.extendedTextMessageData?.text || '';
                
                if (textMessage) {
                    // Check if conversation exists
                    let convoId = '';
                    let isNew = false;

                    setConversations(prev => {
                        const existing = prev.find(c => c.chatId === chatId);
                        
                        if (existing) {
                            convoId = existing.id;
                            // Update existing
                            const newMessage: Message = {
                                id: body.idMessage || Date.now().toString(),
                                text: textMessage,
                                sender: 'user',
                                timestamp: new Date(body.timestamp * 1000),
                                type: 'text'
                            };
                            return prev.map(c => c.id === existing.id ? {
                                ...c,
                                messages: [...c.messages, newMessage],
                                lastActivity: new Date(),
                                unreadCount: (c.unreadCount || 0) + 1
                            } : c);
                        } else {
                            // Create New
                            isNew = true;
                            const newId = Date.now().toString();
                            convoId = newId;
                            
                            // Placeholder while we fetch
                            return prev; // We handle new creation in async step below to fetch avatar
                        }
                    });

                    if (isNew) {
                        const avatarUrl = await fetchAvatar(chatId);
                        const newConvo: Conversation = {
                            id: Date.now().toString(),
                            chatId: chatId,
                            customerName: senderName,
                            customerPhone: chatId.split('@')[0],
                            avatarUrl: avatarUrl,
                            status: 'active', // Bot Active by default
                            stage: 'new',
                            lastActivity: new Date(),
                            messages: [{
                                id: body.idMessage,
                                text: textMessage,
                                sender: 'user',
                                timestamp: new Date(),
                                type: 'text'
                            }],
                            collectedData: {},
                            currentStepIndex: 0,
                            flowId: 'default',
                            tags: [],
                            unreadCount: 1
                        };
                        setConversations(prev => [newConvo, ...prev]);
                        showToast(`Nova mensagem de ${senderName}`, 'info');
                    }
                }
            }

            // Delete notification to acknowledge receipt
            await fetch(`${cleanHost}/waInstance${idInstance}/deleteNotification/${apiTokenInstance}/${data.receiptId}`, {
                method: 'DELETE'
            });

        } catch (error) {
            console.error("Polling Error:", error);
        }
    };

    // --- SENDING LOGIC (GREEN API) ---
    
    const sendZapMessage = async (chatId: string, text: string, type: MessageType, mediaUrl?: string) => {
        if (!apiConfig.idInstance || !apiConfig.apiTokenInstance) return;
        
        const cleanHost = apiConfig.hostUrl.replace(/\/$/, '');
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
        
        // Try fetch avatar
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

    // Handle simulation incoming
    const handleSimulateIncoming = (convoId: string, text: string) => {
        setConversations(prev => prev.map(c => {
            if (c.id === convoId) {
                const newMessage: Message = {
                    id: Date.now().toString(),
                    text,
                    sender: 'user',
                    timestamp: new Date(),
                    type: 'text'
                };
                return {
                    ...c,
                    messages: [...c.messages, newMessage],
                    lastActivity: new Date(),
                    unreadCount: (c.unreadCount || 0) + 1
                };
            }
            return c;
        }));
        showToast('Mensagem simulada recebida', 'info');
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
    };

    const handleDisconnectWhatsApp = () => {
        setWhatsappSession({ status: 'disconnected' });
        showToast('Desconectado', 'info');
        stopStatusCheck();
        stopMessagePolling();
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
        setTags(prev => prev.filter(t => t.id !== id));
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