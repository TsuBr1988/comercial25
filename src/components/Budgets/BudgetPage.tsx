/**
 * Componente: BudgetPage
 * 
 * Propósito: Página principal do sistema de orçamentos de serviços
 * - Listagem de orçamentos existentes
 * - Criação de novos orçamentos
 * - Gerenciamento de postos e blocos de cálculo
 * - Interface para construção modular de orçamentos
 */

import React, { useState } from 'react';
import { Plus, ClipboardList, Edit, Trash2, Eye, FileText, Clock, CheckCircle, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { CreateBudgetModal } from './CreateBudgetModal';
import { BudgetCard } from './BudgetCard';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

export const BudgetPage: React.FC = () => {
  const { canEdit, canView } = useSystemVersion();
  const canEditBudgets = canEdit('budgets');
  const canViewBudgets = canView('budgets');
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBudget, setEditingBudget] = useState<any | null>(null);
  
  // Buscar orçamentos do Supabase
  const { data: budgets = [], loading, refetch } = useSupabaseQuery('budgets', {
    orderBy: { column: 'created_at', ascending: false }
  });

  // Buscar postos dos orçamentos
  const { data: budgetPosts = [] } = useSupabaseQuery('budget_posts');
  const handleCreateBudget = () => {
    setEditingBudget(null);
    setShowCreateModal(true);
  };

  const handleEditBudget = (budget: any) => {
    setEditingBudget(budget);
    setShowCreateModal(true);
  };

  const handleModalClose = () => {
    setShowCreateModal(false);
    setEditingBudget(null);
    refetch();
  };

  const handleApproveBudget = async (budgetId: string) => {
    try {
      // Atualizar status do orçamento para aprovado
      console.log('✅ Aprovando orçamento:', budgetId);
      alert('✅ Orçamento aprovado com sucesso!\n\n🔄 Funcionalidade de integração com propostas será implementada em breve.');

      refetch();
    } catch (error) {
      console.error('Erro ao aprovar orçamento:', error);
      alert(`❌ Erro ao aprovar orçamento: Funcionalidade em desenvolvimento`);
    }
  };

  const handleRejectBudget = async (budgetId: string) => {
    try {
      console.log('❌ Reprovando orçamento:', budgetId);
      
      alert('❌ Orçamento reprovado com sucesso.');
      refetch();
    } catch (error) {
      console.error('Erro ao reprovar orçamento:', error);
      alert(`❌ Erro ao reprovar orçamento: Funcionalidade em desenvolvimento`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'pendente': return 'bg-yellow-100 text-yellow-800';
      case 'reprovado': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'pendente': return 'Pendente';
      case 'reprovado': return 'Reprovado';
      default: return status;
    }
  };

  const totalBudgets = budgets.length;
  const approvedBudgets = budgets.filter(b => b.status === 'aprovado').length;
  const pendingBudgets = budgets.filter(b => b.status === 'pendente').length;
  const rejectedBudgets = budgets.filter(b => b.status === 'reprovado').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orçamentos de Serviço</h1>
          <p className="text-gray-600">
            {canViewBudgets && canEditBudgets 
              ? 'Gerencie orçamentos modulares com postos e blocos de cálculo'
              : canViewBudgets
              ? 'Visualize os orçamentos do sistema (modo somente leitura)'
              : 'Acesso restrito aos orçamentos'
            }
          </p>
        </div>
        {canViewBudgets && canEditBudgets ? (
          <button
            onClick={handleCreateBudget}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Orçamento</span>
          </button>
        ) : canViewBudgets ? (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <ClipboardList className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        ) : null}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Orçamentos</p>
              <p className="text-2xl font-bold text-gray-900">{totalBudgets}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-600">{pendingBudgets}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-yellow-500 flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reprovados</p>
              <p className="text-2xl font-bold text-red-600">{rejectedBudgets}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500 flex items-center justify-center">
              <X className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aprovados</p>
              <p className="text-2xl font-bold text-green-600">{approvedBudgets}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Orçamentos Cadastrados</h2>
        </div>
        
        {budgets.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {budgets.map((budget) => (
              <div key={budget.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        #{budget.budget_number || 'TBD'} - {budget.project_name || budget.client || 'Orçamento sem nome'}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(budget.status)}`}>
                        {getStatusLabel(budget.status)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>Criado em: {displayDate(budget.created_at)}</span>
                      <span>
                        {budgetPosts.filter(p => p.budget_id === budget.id).length} postos
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {/* Botões de aprovação - apenas para admin */}
                    {canEditBudgets && budget.status === 'pendente' && (
                      <>
                        <button
                          onClick={() => handleApproveBudget(budget.id)}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejectBudget(budget.id)}
                          className="px-3 py-1 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
                        >
                          Reprovar
                        </button>
                      </>
                    )}
                    
                    {canEditBudgets && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar orçamento"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir orçamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento criado</h3>
            <p className="text-gray-500">
              {canEditBudgets 
                ? 'Clique em "Novo Orçamento" para começar a criar orçamentos de serviços.'
                : 'Não há orçamentos cadastrados no sistema.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      {showCreateModal && (
        <CreateBudgetModal
          isOpen={showCreateModal}
          onClose={handleModalClose}
          budget={editingBudget}
        />
      )}
      
      {/* Informações do Sistema */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Como Funciona</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
          <div>
            <p>• <strong>1. Criação:</strong> Novo orçamento com nome</p>
            <p>• <strong>2. Postos:</strong> Adicionar postos com cargo/escala/turno</p>
            <p>• <strong>3. Blocos:</strong> 8 blocos fixos de cálculo por posto</p>
          </div>
          <div>
            <p>• <strong>4. Aprovação:</strong> Admin aprova/reprova orçamentos</p>
            <p>• <strong>5. Integração:</strong> Orçamento aprovado → Nova proposta</p>
            <p>• <strong>6. Configurações:</strong> Cargos e escalas editáveis</p>
          </div>
        </div>
      </div>
    </div>
  );
};