import React from 'react';
import { Conversation, ViewState } from '../types';
import { MessageSquare, Clock, CheckCircle2, TrendingUp, Plus, Settings, Smartphone, Users, BarChart3, Headphones } from 'lucide-react';

interface DashboardProps {
  conversations: Conversation[];
  onChangeView: (view: ViewState) => void;
  onOpenSettings?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ conversations, onChangeView, onOpenSettings }) => {
  const totalConvos = conversations.length;
  const completedConvos = conversations.filter(c => c.status === 'completed').length;
  const inProgressConvos = conversations.filter(c => c.status === 'in_progress').length;
  const pendingConvos = conversations.filter(c => c.status === 'human_handoff').length;
  
  // Fake simple metrics for demo
  const todayConvos = 5; 

  const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
           <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-full">+12% essa semana</span>
      </div>
      <div>
        <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{value}</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">{title}</p>
        {subtext && <p className="text-xs text-gray-400 mt-2">{subtext}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400">Visão geral e métricas de atendimento</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            Sistema Operacional
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Em Atendimento" value={inProgressConvos} icon={Headphones} color="bg-emerald-500 text-emerald-600" />
        <StatCard title="Pendentes" value={pendingConvos} icon={Clock} color="bg-amber-500 text-amber-600" subtext="Aguardando Humano" />
        <StatCard title="Finalizados" value={completedConvos} icon={CheckCircle2} color="bg-gray-500 text-gray-600" />
        <StatCard title="Total de Conversas" value={totalConvos} icon={MessageSquare} color="bg-blue-500 text-blue-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart Section */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <BarChart3 size={20} className="text-gray-400" />
                Atividade Semanal
            </h2>
          </div>
          
          <div className="h-48 flex items-end space-x-4 px-2">
             {[
                 { day: 'Seg', val: 35 },
                 { day: 'Ter', val: 55 },
                 { day: 'Qua', val: 40 },
                 { day: 'Qui', val: 70 },
                 { day: 'Sex', val: 85 },
                 { day: 'Sáb', val: 30 },
                 { day: 'Dom', val: 20 }
             ].map((item, idx) => (
                 <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                     <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative h-40 overflow-hidden">
                         <div 
                            style={{ height: `${item.val}%` }} 
                            className="absolute bottom-0 w-full bg-emerald-500 rounded-t-lg group-hover:bg-emerald-600 transition-all duration-300"
                         ></div>
                     </div>
                     <span className="text-xs font-medium text-gray-500 dark:text-gray-400 group-hover:text-emerald-600">{item.day}</span>
                 </div>
             ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6 flex flex-col">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Ações Rápidas</h2>
          <div className="space-y-3 flex-1">
            <button 
              onClick={() => onChangeView('flow-builder')}
              className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800">
                <Plus size={18} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-700 dark:text-gray-200 block text-sm">Criar Fluxo</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Novo roteiro de conversa</span>
              </div>
            </button>
            <button 
                onClick={onOpenSettings}
                className="w-full flex items-center space-x-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-all group"
            >
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800">
                <Settings size={18} className="text-emerald-700 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="font-bold text-gray-700 dark:text-gray-200 block text-sm">Configurações</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Ajustes gerais do bot</span>
              </div>
            </button>
            
            <div className="pt-4 mt-auto">
                 <button 
                onClick={() => onChangeView('connect')}
                className="w-full flex items-center justify-center space-x-2 p-3 bg-gray-900 dark:bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
                >
                <Smartphone size={18} />
                <span className="font-medium">Gerenciar Conexão</span>
                </button>
            </div>
          </div>
        </div>

        {/* Recent Conversations List */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Conversas Recentes</h2>
                <button 
                onClick={() => onChangeView('conversations')}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-lg"
                >
                Ver todas <span className="ml-1">→</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 uppercase text-xs">
                        <tr>
                            <th className="px-4 py-3 rounded-l-lg">Cliente</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Data</th>
                            <th className="px-4 py-3 text-right rounded-r-lg">Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {conversations.slice(0, 5).map((convo) => (
                            <tr key={convo.id} className="border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${convo.status === 'completed' ? 'bg-gray-400' : convo.status === 'human_handoff' ? 'bg-red-500' : 'bg-emerald-500'}`}>
                                        {convo.customerName.charAt(0).toUpperCase()}
                                    </div>
                                    {convo.customerName}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                                        convo.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                        convo.status === 'human_handoff' ? 'bg-amber-100 text-amber-800' : 
                                        convo.status === 'in_progress' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {convo.status === 'completed' ? 'Concluído' : convo.status === 'human_handoff' ? 'Pendente' : convo.status === 'in_progress' ? 'Atendendo' : 'Robô'}
                                    </span>
                                </td>
                                <td className="px-4 py-3">{convo.lastActivity.toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => onChangeView('conversations')} className="text-emerald-600 hover:underline">Abrir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};