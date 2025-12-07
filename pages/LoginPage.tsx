import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { MessageSquare, Lock, User as UserIcon, ArrowRight, Mail, Eye, EyeOff, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLogin: (user: User) => void;
}

interface StoredUser extends User {
    password?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize Mock Database
  useEffect(() => {
      const db = localStorage.getItem('chatpro_users_db');
      if (!db) {
          const defaultUsers: StoredUser[] = [
              {
                  id: '1',
                  name: 'Administrador',
                  email: 'admin@chatpro.com',
                  role: 'admin',
                  avatar: 'AD',
                  password: 'admin'
              },
              {
                  id: '2',
                  name: 'Atendente',
                  email: 'user@chatpro.com',
                  role: 'user',
                  avatar: 'AT',
                  password: 'user'
              }
          ];
          localStorage.setItem('chatpro_users_db', JSON.stringify(defaultUsers));
      }
  }, []);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    setTimeout(() => {
        const dbString = localStorage.getItem('chatpro_users_db');
        const users: StoredUser[] = dbString ? JSON.parse(dbString) : [];

        if (isRegistering) {
            // REGISTER LOGIC
            if (password !== confirmPassword) {
                setError('As senhas não coincidem.');
                setIsLoading(false);
                return;
            }
            
            if (password.length < 4) {
                setError('A senha deve ter pelo menos 4 caracteres.');
                setIsLoading(false);
                return;
            }

            const existing = users.find(u => u.email === email);
            if (existing) {
                setError('Este e-mail já está cadastrado.');
                setIsLoading(false);
                return;
            }

            const newUser: StoredUser = {
                id: Date.now().toString(),
                name,
                email,
                role: 'admin', // Default role is now admin for new signups
                avatar: name.substring(0, 2).toUpperCase(),
                password: password,
                status: 'online'
            };

            const updatedUsers = [...users, newUser];
            localStorage.setItem('chatpro_users_db', JSON.stringify(updatedUsers));
            
            setSuccess('Conta criada com sucesso! Entrando...');
            
            setTimeout(() => {
                const { password, ...userSafe } = newUser;
                onLogin(userSafe);
            }, 1000);

        } else {
            // LOGIN LOGIC
            const foundUser = users.find(u => u.email === email && u.password === password);
            
            if (foundUser) {
                const { password, ...userSafe } = foundUser;
                onLogin(userSafe);
            } else {
                setError('E-mail ou senha incorretos.');
                setIsLoading(false);
            }
        }
    }, 800); // Simulate network delay
  };

  const toggleMode = () => {
      setIsRegistering(!isRegistering);
      setError('');
      setSuccess('');
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[600px] animate-in fade-in zoom-in-95 duration-500">
        
        {/* Left Side: Info & Toggle */}
        <div className={`w-full md:w-5/12 p-10 flex flex-col justify-between text-white transition-all duration-500 ease-in-out ${isRegistering ? 'bg-emerald-800 order-last md:order-first' : 'bg-emerald-600'}`}>
            <div>
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6 backdrop-blur-sm">
                    <MessageSquare size={24} className="text-white" />
                </div>
                <h1 className="text-3xl font-bold mb-2">ChatBot Pro</h1>
                <p className="text-emerald-100 text-sm leading-relaxed opacity-90">
                    {isRegistering 
                        ? "Junte-se à plataforma mais avançada de automação para WhatsApp. Crie fluxos, gerencie atendimentos e escale seu negócio."
                        : "Acesse seu painel de controle e gerencie seus bots, fluxos de conversa e atendimentos em tempo real."
                    }
                </p>
            </div>

            <div className="mt-12">
                <p className="text-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
                    {isRegistering ? "Já tem uma conta?" : "Ainda não tem conta?"}
                </p>
                <button 
                    onClick={toggleMode}
                    className="w-full py-3 px-6 rounded-xl border-2 border-white/30 hover:bg-white/10 text-white font-semibold transition-all flex items-center justify-center gap-2 group"
                >
                    {isRegistering ? <LogIn size={18} /> : <UserPlus size={18} />}
                    {isRegistering ? "Fazer Login" : "Criar Conta Grátis"}
                </button>
            </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-7/12 p-8 md:p-12 bg-white relative flex flex-col justify-center">
            <div className="max-w-sm mx-auto w-full">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-1">{isRegistering ? "Crie sua conta" : "Bem-vindo de volta"}</h2>
                    <p className="text-gray-500 text-sm">
                        {isRegistering ? "Preencha os dados abaixo para começar." : "Insira suas credenciais para acessar."}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 bg-green-50 text-green-600 text-sm p-3 rounded-lg border border-green-100 flex items-center gap-2 animate-in slide-in-from-top-2">
                        <CheckCircle2 size={16} /> {success}
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {isRegistering && (
                        <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-300">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                            <div className="relative group">
                                <UserIcon size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    type="text" 
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700"
                                    placeholder="Seu nome"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase ml-1">E-mail Corporativo</label>
                        <div className="relative group">
                            <Mail size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type="email" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700"
                                placeholder="nome@empresa.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Senha</label>
                            {!isRegistering && (
                                <button type="button" className="text-xs text-emerald-600 hover:text-emerald-700 font-medium">Esqueceu a senha?</button>
                            )}
                        </div>
                        <div className="relative group">
                            <Lock size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700"
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {isRegistering && (
                        <div className="space-y-1 animate-in slide-in-from-left-4 fade-in duration-300">
                            <label className="text-xs font-bold text-gray-500 uppercase ml-1">Confirmar Senha</label>
                            <div className="relative group">
                                <Lock size={18} className="absolute left-3 top-3 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
                                <input 
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all text-sm font-medium text-gray-700"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group mt-6 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            <>
                                {isRegistering ? 'Criar Minha Conta' : 'Acessar Plataforma'}
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                {!isRegistering && (
                    <div className="mt-8 pt-6 border-t border-gray-100 text-center">
                        <p className="text-xs text-gray-400 mb-2">Credenciais padrão (se banco vazio):</p>
                        <div className="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-gray-500">
                            <span className="bg-gray-100 px-2 py-1 rounded border">admin@chatpro.com / admin</span>
                            <span className="bg-gray-100 px-2 py-1 rounded border">user@chatpro.com / user</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};