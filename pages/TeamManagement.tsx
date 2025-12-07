import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { UserPlus, Trash2, Mail, Lock, User as UserIcon, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

interface TeamManagementProps {
    currentUser: User;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({ currentUser }) => {
    const [teamMembers, setTeamMembers] = useState<User[]>([]);
    
    // Form State
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        loadTeam();
    }, [currentUser]);

    const loadTeam = () => {
        const dbString = localStorage.getItem('chatpro_users_db');
        if (dbString) {
            const allUsers: (User & { password?: string, ownerId?: string })[] = JSON.parse(dbString);
            // Filter users who have currentUser.id as their ownerId
            const members = allUsers.filter(u => u.ownerId === currentUser.id);
            setTeamMembers(members);
        }
    };

    const handleAddMember = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!newName || !newEmail || !newPassword) {
            setError('Preencha todos os campos.');
            return;
        }

        const dbString = localStorage.getItem('chatpro_users_db');
        const allUsers: (User & { password?: string, ownerId?: string })[] = dbString ? JSON.parse(dbString) : [];

        if (allUsers.find(u => u.email === newEmail)) {
            setError('Este e-mail já está em uso.');
            return;
        }

        const newMember: User & { password?: string } = {
            id: Date.now().toString(),
            name: newName,
            email: newEmail,
            role: 'user',
            status: 'offline',
            password: newPassword, // In a real app, this would be handled securely backend-side
            ownerId: currentUser.id,
            avatar: newName.substring(0, 2).toUpperCase(),
            color: 'bg-blue-500'
        };

        const updatedUsers = [...allUsers, newMember];
        localStorage.setItem('chatpro_users_db', JSON.stringify(updatedUsers));
        
        setNewName('');
        setNewEmail('');
        setNewPassword('');
        setSuccess('Membro adicionado com sucesso!');
        loadTeam();
    };

    const handleRemoveMember = (memberId: string) => {
        if (window.confirm('Tem certeza que deseja remover este membro da equipe? Ele perderá o acesso imediatamente.')) {
            const dbString = localStorage.getItem('chatpro_users_db');
            if (dbString) {
                const allUsers: User[] = JSON.parse(dbString);
                const updatedUsers = allUsers.filter(u => u.id !== memberId);
                localStorage.setItem('chatpro_users_db', JSON.stringify(updatedUsers));
                loadTeam();
            }
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Gestão de Equipe</h1>
                <p className="text-gray-500 dark:text-gray-400">Cadastre funcionários para acessarem o sistema utilizando a sua conexão de WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 sticky top-6">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                            <UserPlus size={20} className="text-emerald-600" />
                            Novo Membro
                        </h2>
                        
                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 text-xs p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                <AlertCircle size={14} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-4 bg-green-50 text-green-600 text-xs p-3 rounded-lg border border-green-100 flex items-center gap-2">
                                <CheckCircle2 size={14} /> {success}
                            </div>
                        )}

                        <form onSubmit={handleAddMember} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Nome do Funcionário</label>
                                <div className="relative">
                                    <UserIcon size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">E-mail de Acesso</label>
                                <div className="relative">
                                    <Mail size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="email" 
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                        placeholder="joao@suaempresa.com"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Senha Provisória</label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-2.5 text-gray-400" />
                                    <input 
                                        type="text" 
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 outline-none dark:text-white"
                                        placeholder="Ex: mudar123"
                                    />
                                </div>
                            </div>
                            <button className="w-full bg-emerald-600 text-white font-bold py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm flex items-center justify-center gap-2">
                                <UserPlus size={18} /> Cadastrar Acesso
                            </button>
                        </form>
                        <p className="mt-4 text-xs text-gray-400 text-center">
                            O funcionário usará este e-mail e senha para logar e atender seus clientes.
                        </p>
                    </div>
                </div>

                {/* List Section */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Membros Ativos ({teamMembers.length})</h2>
                            <div className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 font-medium">
                                Plano Atual: Ilimitado
                            </div>
                        </div>

                        {teamMembers.length === 0 ? (
                            <div className="text-center py-10 text-gray-400">
                                <div className="bg-gray-100 dark:bg-gray-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <UserIcon size={32} className="opacity-50" />
                                </div>
                                <p>Nenhum membro cadastrado.</p>
                                <p className="text-sm">Use o formulário ao lado para adicionar.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:border-emerald-200 transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-full flex items-center justify-center font-bold text-sm">
                                                {member.avatar || member.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">{member.name}</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <span className="text-[10px] font-bold uppercase text-gray-400 block">Permissão</span>
                                                <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1 justify-end">
                                                    <Shield size={10} /> Atendente
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => handleRemoveMember(member.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Remover Acesso"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};