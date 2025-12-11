import React, { useState, useEffect } from 'react';
import { ApiConfig, Contact, Conversation } from '../types';
import { Search, User, Users, MessageSquare, RefreshCw, AlertCircle, Phone } from 'lucide-react';

interface ContactListProps {
    apiConfig: ApiConfig;
    onStartChat: (contact: Contact) => void;
    existingConversations: Conversation[];
}

export const ContactList: React.FC<ContactListProps> = ({ apiConfig, onStartChat, existingConversations }) => {
    const [contacts, setContacts] = useState<(Contact & { avatarUrl?: string })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchContacts();
    }, []);

    const fetchAvatar = async (chatId: string): Promise<string | undefined> => {
        const cleanHost = apiConfig.hostUrl.replace(/\/$/, '');
        try {
            const res = await fetch(`${cleanHost}/waInstance${apiConfig.idInstance}/getAvatar/${apiConfig.apiTokenInstance}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ chatId })
            });
            if(res.ok) {
                const data = await res.json();
                return data.urlAvatar;
            }
        } catch(e) { return undefined; }
    };

    const fetchContacts = async () => {
        if (!apiConfig.idInstance || !apiConfig.apiTokenInstance) {
            setError("Configure a API primeiro.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const cleanHost = apiConfig.hostUrl.replace(/\/$/, '');
        
        try {
            // Fetch contacts from Green API
            const response = await fetch(`${cleanHost}/waInstance${apiConfig.idInstance}/getContacts/${apiConfig.apiTokenInstance}`);
            
            if (!response.ok) {
                throw new Error('Falha ao buscar contatos.');
            }

            const data = await response.json();
            
            // Map to internal Contact interface
            const mappedContacts = data.map((c: any) => ({
                id: c.id,
                name: c.name || c.contactName || c.id.split('@')[0],
                type: c.type || 'user',
                contactName: c.contactName
            }));

            // Basic dedup
            const uniqueContacts = Array.from(new Map(mappedContacts.map((item: any) => [item.id, item])).values());
            
            setContacts(uniqueContacts as any);

            // Lazy fetch avatars for visible items (limit to first 20 to save API calls)
            // In a real app, use IntersectionObserver
            const contactsWithAvatars = [...(uniqueContacts as any[])];
            let changed = false;

            // Fetch first 10 avatars asynchronously
            const batch = uniqueContacts.slice(0, 15);
            
            Promise.all(batch.map(async (c: any) => {
                const url = await fetchAvatar(c.id);
                if (url) {
                    const idx = contactsWithAvatars.findIndex((x:any) => x.id === c.id);
                    if (idx !== -1) {
                        contactsWithAvatars[idx] = { ...contactsWithAvatars[idx], avatarUrl: url };
                        changed = true;
                    }
                }
            })).then(() => {
                if(changed) setContacts([...contactsWithAvatars] as any);
            });

        } catch (err: any) {
            console.error("Error fetching contacts:", err);
            let msg = err.message || "Erro desconhecido ao carregar contatos.";
            if (msg === 'Failed to fetch') {
                msg = 'Erro de conexão. Verifique se o Host URL está correto (https://...) e se sua internet está ativa.';
            }
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredContacts = contacts.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.id.includes(searchTerm)
    );

    const getExistingStatus = (contactId: string) => {
        const convo = existingConversations.find(c => c.chatId === contactId || c.customerPhone.includes(contactId.split('@')[0]));
        return convo ? convo.status : null;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Meus Contatos</h1>
                    <p className="text-gray-500 dark:text-gray-400">Contatos sincronizados do WhatsApp.</p>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input 
                            type="text" 
                            placeholder="Buscar nome ou número..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm dark:text-white"
                        />
                        <Search className="absolute left-3 top-3 text-gray-400" size={18} />
                    </div>
                    <button 
                        onClick={fetchContacts}
                        disabled={isLoading}
                        className="bg-white dark:bg-gray-800 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors shadow-sm"
                        title="Atualizar Lista"
                    >
                        <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-xl flex items-center gap-3 text-red-700 dark:text-red-400 shrink-0">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="overflow-y-auto flex-1 p-2">
                    {filteredContacts.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                            <Users size={48} className="mb-4 opacity-50" />
                            <p>Nenhum contato encontrado.</p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredContacts.map(contact => {
                            const status = getExistingStatus(contact.id);
                            const phoneNumber = contact.id.split('@')[0];
                            const isGroup = contact.type === 'group' || contact.id.includes('@g.us');

                            return (
                                <div key={contact.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 hover:shadow-md transition-all group bg-gray-50 dark:bg-gray-700/30">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm shrink-0 overflow-hidden ${isGroup ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                                                {contact.avatarUrl ? (
                                                    <img src={contact.avatarUrl} className="w-full h-full object-cover" />
                                                ) : (
                                                    isGroup ? <Users size={18} /> : <User size={18} />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 dark:text-white text-sm truncate" title={contact.name}>{contact.name}</h3>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono flex items-center gap-1">
                                                    {isGroup ? 'Grupo' : <><Phone size={10} /> {phoneNumber}</>}
                                                </p>
                                            </div>
                                        </div>
                                        {status && (
                                            <span className={`px-2 py-0.5 text-[10px] rounded-full uppercase font-bold tracking-wide border shrink-0 ${
                                                status === 'active' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                status === 'human_handoff' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                status === 'in_progress' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                                {status === 'in_progress' ? 'Atendendo' : status === 'active' ? 'Robô' : 'Fila'}
                                            </span>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => onStartChat(contact)}
                                        className="w-full py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <MessageSquare size={16} />
                                        {status ? 'Abrir Conversa' : 'Iniciar Conversa'}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500 text-center">
                    Mostrando {filteredContacts.length} contatos
                </div>
            </div>
        </div>
    );
};