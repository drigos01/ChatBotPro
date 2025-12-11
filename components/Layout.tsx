import React, { useState } from 'react';
import { ViewState, User } from '../types';
import { LayoutDashboard, GitMerge, MessageSquare, Smartphone, LogOut, Menu, X, User as UserIcon, Shield, Settings, Edit3, Camera, Save, Phone, Info, Moon, Sun, MessageCircle, ChevronLeft, ChevronRight, PanelLeftClose, PanelLeft, CreditCard, Clock, AlertTriangle, AlertCircle, Users, Contact, Activity, Code } from 'lucide-react';

interface LayoutProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  onUpdateProfile?: (user: User) => void;
  darkMode?: boolean;
  toggleDarkMode?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ currentView, onChangeView, children, user, onLogout, onUpdateProfile, darkMode, toggleDarkMode }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Profile Edit State
  const [editName, setEditName] = useState(user?.name || '');
  const [editNickname, setEditNickname] = useState(user?.nickname || '');
  const [editAbout, setEditAbout] = useState(user?.about || '');
  const [editColor, setEditColor] = useState(user?.color || 'bg-blue-600');

  const handleSaveProfile = () => {
      if (user && onUpdateProfile) {
          onUpdateProfile({
              ...user,
              name: editName,
              nickname: editNickname,
              about: editAbout,
              color: editColor
          });
          setIsProfileModalOpen(false);
      }
  };

  const NavItem = ({ view, icon: Icon, label, restricted }: { view: ViewState; icon: any; label: string, restricted?: boolean }) => {
      if (restricted && user?.role !== 'admin') return null;

      return (
        <button
          onClick={() => {
            onChangeView(view);
            setIsMobileMenuOpen(false);
          }}
          title={isSidebarCollapsed ? label : ''}
          className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 ${
            currentView === view
              ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium border-l-4 border-emerald-600'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
          } ${isSidebarCollapsed ? 'justify-center px-0' : ''}`}
        >
          <Icon size={22} className="shrink-0" />
          {!isSidebarCollapsed && <span className="truncate">{label}</span>}
        </button>
      );
  };

  const colors = ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600', 'bg-pink-600', 'bg-amber-600', 'bg-gray-800'];

  // --- Subscription Logic ---
  const getSubscriptionStatus = () => {
      if (!user?.subscription) return null;
      
      const now = new Date();
      const expires = new Date(user.subscription.expiresAt);
      const diffTime = expires.getTime() - now.getTime();
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const isTrial = user.subscription.status === 'trial';
      
      // Status Configuration
      if (daysLeft <= 0) {
          return {
              days: 0,
              badgeColor: 'bg-red-100 text-red-600 border-red-200',
              indicatorColor: 'bg-red-500',
              textColor: 'text-red-500',
              icon: AlertCircle,
              text: 'Expirado',
              fullText: 'Licença Expirada',
              urgent: true
          };
      }
      
      if (daysLeft <= 3) {
          return {
              days: daysLeft,
              badgeColor: 'bg-red-100 text-red-600 border-red-200 animate-pulse',
              indicatorColor: 'bg-red-500',
              textColor: 'text-red-500',
              icon: AlertTriangle,
              text: `${daysLeft}d restantes`,
              fullText: `Expira em ${daysLeft} dias`,
              urgent: true
          };
      }

      if (daysLeft <= 7) {
          return {
              days: daysLeft,
              badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
              indicatorColor: 'bg-amber-500',
              textColor: 'text-amber-500',
              icon: Clock,
              text: `${daysLeft}d restantes`,
              fullText: `Expira em ${daysLeft} dias`,
              urgent: true
          };
      }

      // Safe state (Green/Subtle)
      return {
          days: daysLeft,
          badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800',
          indicatorColor: 'bg-emerald-500',
          textColor: 'text-emerald-500',
          icon: Shield,
          text: isTrial ? 'Trial' : 'PRO',
          fullText: `${isTrial ? 'Teste' : 'Premium'} • ${daysLeft} dias`,
          urgent: false
      };
  };

  const subStatus = getSubscriptionStatus();

  // Subtle Header Indicator Component
  const SubscriptionHeaderIndicator = () => {
      if (!subStatus) return null;
      return (
          <div 
            className="flex items-center gap-1.5 ml-2 cursor-pointer group relative"
            onClick={() => { onChangeView('subscription'); setIsMobileMenuOpen(false); }}
          >
              <div className={`w-2 h-2 rounded-full ${subStatus.indicatorColor} ${subStatus.urgent ? 'animate-pulse' : ''}`}></div>
              <span className={`text-[10px] font-bold uppercase tracking-wide ${subStatus.textColor} hidden md:inline-block opacity-80 group-hover:opacity-100`}>
                  {subStatus.days <= 0 ? 'Expirado' : subStatus.days <= 7 ? `${subStatus.days} dias` : 'Ativo'}
              </span>
              
              {/* Tooltip for Mobile/Desktop */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {subStatus.fullText}
              </div>
          </div>
      );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-gray-800 z-50 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <MessageCircle size={20} fill="currentColor" className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <span className="font-bold text-gray-800 dark:text-white">ChatBot Pro</span>
          {/* Mobile Status Indicator */}
          <SubscriptionHeaderIndicator />
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="dark:text-white p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Desktop - Fixed Position */}
      <div className={`
        fixed inset-y-0 left-0 z-40 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out flex flex-col shadow-lg md:shadow-none
        ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'}
        ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
      `}>
        {/* Header Logo */}
        <div className={`h-16 flex items-center border-b border-gray-100 dark:border-gray-700 ${isSidebarCollapsed ? 'justify-center' : 'justify-between px-6'}`}>
            <div className={`flex items-center gap-3 ${isSidebarCollapsed ? 'justify-center w-full' : ''}`}>
                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-sm shrink-0">
                    <MessageCircle size={22} fill="currentColor" />
                </div>
                {!isSidebarCollapsed && (
                    <div className="flex flex-col">
                        <span className="font-bold text-lg text-gray-800 dark:text-white tracking-tight leading-none">ChatBot Pro</span>
                        <div className="flex items-center mt-0.5">
                             <SubscriptionHeaderIndicator />
                        </div>
                    </div>
                )}
            </div>
             {/* Mobile Close Button */}
             <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500">
                <X size={20}/>
             </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-hide">
          <NavItem view="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem view="conversations" icon={MessageSquare} label="Atendimento" />
          <NavItem view="contacts" icon={Contact} label="Meus Contatos" />
          <NavItem view="connect" icon={Smartphone} label="Conexão" />
          <NavItem view="health" icon={Activity} label="Status Sistema" />
          
          {user?.role === 'admin' && (
              <>
                {!isSidebarCollapsed && (
                    <div className="pt-4 pb-2 px-4 animate-in fade-in">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Admin</p>
                    </div>
                )}
                {isSidebarCollapsed && <div className="h-4"></div>}
                
                <NavItem view="flows" icon={GitMerge} label="Fluxos" restricted={true} />
                <NavItem view="team" icon={Users} label="Equipe" restricted={true} />
                <NavItem view="subscription" icon={CreditCard} label="Minha Assinatura" restricted={true} />
                <NavItem view="developer" icon={Code} label="Área do Dev" restricted={true} />
              </>
          )}
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
           {/* Collapse Button (Desktop Only) */}
           <div className="hidden md:flex justify-end p-2 border-b border-gray-100 dark:border-gray-700">
                <button 
                    onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    title={isSidebarCollapsed ? "Expandir Menu" : "Minimizar Menu"}
                >
                    {isSidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
                </button>
           </div>

           <div className="p-3">
               {toggleDarkMode && (
                   <button 
                      onClick={toggleDarkMode}
                      title="Alternar Tema"
                      className={`w-full flex items-center space-x-3 px-3 py-2 mb-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
                   >
                       {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                       {!isSidebarCollapsed && <span className="text-sm font-medium">{darkMode ? 'Claro' : 'Escuro'}</span>}
                   </button>
               )}

              <div 
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                onClick={() => setIsProfileModalOpen(true)}
                title="Editar Perfil"
              >
                 <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold shadow-sm relative overflow-hidden shrink-0 ${user?.color || (user?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600')}`}>
                    {user?.avatar?.includes('http') ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                        <span>{user?.avatar || user?.name.substring(0, 2).toUpperCase()}</span>
                    )}
                 </div>
                 
                 {!isSidebarCollapsed && (
                     <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-1">
                            {user?.nickname || user?.name}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{user?.about || 'Disponível'}</p>
                     </div>
                 )}
              </div>
              
              <button 
                onClick={onLogout}
                title="Sair"
                className={`w-full flex items-center space-x-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-sm mt-1 ${isSidebarCollapsed ? 'justify-center' : ''}`}
              >
                <LogOut size={18} />
                {!isSidebarCollapsed && <span>Sair</span>}
              </button>
           </div>
        </div>
      </div>

      {/* Main Content Area - Optimized for Height and Layout */}
      <main className={`
          flex-1 flex flex-col h-full overflow-hidden bg-gray-100 dark:bg-gray-900 
          pt-14 md:pt-0 transition-all duration-300 ease-in-out relative
          ${isSidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}
      `}>
        {/* Layer container: Adapts perfectly to the view type */}
        <div className={`flex-1 flex flex-col min-h-0 w-full relative ${currentView === 'conversations' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto'}`}>
          {children}
        </div>
      </main>
      
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Profile Modal */}
      {isProfileModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                      <h3 className="font-bold text-gray-800 dark:text-white text-lg">Editar Perfil</h3>
                      <button onClick={() => setIsProfileModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <X size={20} />
                      </button>
                  </div>
                  <div className="p-6 space-y-6">
                      <div className="flex flex-col items-center gap-4">
                          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-inner relative ${editColor}`}>
                              {user?.avatar?.includes('http') ? (
                                <img src={user.avatar} className="w-full h-full object-cover rounded-full" />
                              ) : (
                                <span>{editName.substring(0, 2).toUpperCase()}</span>
                              )}
                          </div>
                          <div className="flex gap-2">
                              {colors.map(c => (
                                  <button 
                                    key={c}
                                    onClick={() => setEditColor(c)}
                                    className={`w-6 h-6 rounded-full ${c} ${editColor === c ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                  />
                              ))}
                          </div>
                      </div>
                      <div className="space-y-4">
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Seu Nome</label>
                              <div className="relative">
                                  <UserIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                  <input value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Apelido</label>
                              <div className="relative">
                                  <UserIcon size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                  <input value={editNickname} onChange={(e) => setEditNickname(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
                              </div>
                          </div>
                          <div>
                              <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-1 block">Recado</label>
                              <div className="relative">
                                  <Info size={18} className="absolute left-3 top-2.5 text-gray-400" />
                                  <input value={editAbout} onChange={(e) => setEditAbout(e.target.value)} className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"/>
                              </div>
                          </div>
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                      <button onClick={() => setIsProfileModalOpen(false)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 font-medium">Cancelar</button>
                      <button onClick={handleSaveProfile} className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-2"><Save size={16} /> Salvar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};