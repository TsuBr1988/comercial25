/**
 * Componente: BudgetCard
 * 
 * Propósito: Card individual para exibir orçamento na listagem
 * - Informações básicas do orçamento
 * - Status visual com cores
 * - Ações de edição e visualização
 * - Preview dos postos incluídos
 */

import React from 'react';
import { Edit, Eye, Trash2, Users } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

interface BudgetCardProps {
  budget: any;
  onEdit?: (budget: any) => void;
  onView?: (budget: any) => void;
  onDelete?: (budgetId: string) => void;
  readOnly?: boolean;
  readOnly?: boolean;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  onEdit,
  onView,
  onDelete,
  readOnly = false
  readOnly = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aprovado': return 'bg-green-100 text-green-800 border-green-200';
      case 'Pendente': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Rascunho': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'Rejeitado': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            #{budget.budget_number} - {budget.project_name}
          </h3>
          <p className="text-sm text-gray-600">Cliente: {budget.client}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(budget.status)}`}>
          {budget.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Valor Total</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(budget.total_value)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Criado em</p>
          <p className="text-sm font-medium text-gray-900">{displayDate(budget.created_at)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Users className="w-4 h-4" />
          <span>0 postos cadastrados</span>
        </div>
        
        {!readOnly && (
          <div className="flex items-center space-x-2">
            {onView && (
              <button
                onClick={() => onView(budget)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Visualizar orçamento"
              >
                <Eye className="w-4 h-4" />
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(budget)}
                className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Editar orçamento"
              >
                <Edit className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(budget.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir orçamento"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
          </div>
        )}
      </div>
    </div>
  );
};