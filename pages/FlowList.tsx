import React from 'react';
import { Flow } from '../types';
import { Plus, Edit2, Trash2, ToggleRight, ToggleLeft, Lock } from 'lucide-react';

interface FlowListProps {
  flows: Flow[];
  onEditFlow: (flowId: string) => void;
  onDeleteFlow: (flowId: string) => void;
  onCreateFlow: () => void;
  isAdmin: boolean;
}

export const FlowList: React.FC<FlowListProps> = ({ flows, onEditFlow, onDeleteFlow, onCreateFlow, isAdmin }) => {
  if (!isAdmin) {
      return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                  <Lock size={32} />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Acesso Restrito</h2>
              <p className="text-gray-500 max-w-md">Você não tem permissão para gerenciar os fluxos do bot. Entre em contato com o administrador.</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Fluxos de Conversa</h1>
          <p className="text-gray-500">Crie e gerencie seus chatbots personalizados</p>
        </div>
        <button 
          onClick={onCreateFlow}
          className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus size={18} />
          <span>Novo Fluxo</span>
        </button>
      </div>

      <div className="grid gap-4">
        {flows.map(flow => (
          <div key={flow.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center justify-between md:justify-start mb-2">
                <h3 className="text-lg font-semibold text-gray-900 mr-3">{flow.name}</h3>
                <button className={`text-2xl ${flow.isActive ? 'text-emerald-500' : 'text-gray-300'}`}>
                    {flow.isActive ? <ToggleRight /> : <ToggleLeft />}
                </button>
              </div>
              <p className="text-gray-500 text-sm mb-3">{flow.description}</p>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-md font-medium ${flow.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'}`}>
                    {flow.isActive ? 'Ativo' : 'Inativo'}
                </span>
                <span className="px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-600 font-medium">
                    {flow.steps.length} perguntas
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
              <button 
                onClick={() => onEditFlow(flow.id)}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-emerald-600 transition-colors w-full md:w-auto justify-center"
              >
                <Edit2 size={16} />
                <span>Editar</span>
              </button>
              <button 
                onClick={() => onDeleteFlow(flow.id)}
                className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {flows.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">Você ainda não criou nenhum fluxo.</p>
                <button onClick={onCreateFlow} className="text-emerald-600 font-medium hover:underline">Criar Primeiro Fluxo</button>
            </div>
        )}
      </div>
    </div>
  );
};
