import React from 'react';
import { Target, DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/formatCurrency';

export const TopSummaryCards: React.FC = () => {
  const activeProposals = 4;
  const activeValue = 558095.76;
  const monthlyValue = 46507.98;
  const commissionOpen = 4234.74;
  const closedDeals = 3;
  const conversionRate = 21;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">

      {/* Propostas Ativas */}
      <div className="flex justify-between items-start p-4 border rounded shadow bg-white h-full">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">Propostas Ativas</h3>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(activeValue)}</p>
          <p className="text-xs text-gray-500">{formatCurrency(monthlyValue)} valor mensal</p>
          <p className="text-xs text-gray-500">{activeProposals} propostas ativas</p>
        </div>
        <div className="rounded-full bg-blue-100 p-2">
          <Target className="w-4 h-4 text-blue-600" />
        </div>
      </div>

      {/* Comissão Potencial */}
      <div className="flex justify-between items-start p-4 border rounded shadow bg-white h-full">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">Possibilidade de comissão</h3>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(commissionOpen)}</p>
          <p className="text-xs text-gray-500">Propostas em aberto</p>
        </div>
        <div className="rounded-full bg-green-100 p-2">
          <DollarSign className="w-4 h-4 text-green-600" />
        </div>
      </div>

      {/* Negócios Fechados */}
      <div className="flex justify-between items-start p-4 border rounded shadow bg-white h-full">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">Negócios Fechados</h3>
          <p className="text-xl font-bold text-gray-900">{closedDeals}</p>
          <p className="text-xs text-gray-500">Total do sistema</p>
        </div>
        <div className="rounded-full bg-purple-100 p-2">
          <TrendingUp className="w-4 h-4 text-purple-600" />
        </div>
      </div>

      {/* Taxa de Conversão */}
      <div className="flex justify-between items-start p-4 border rounded shadow bg-white h-full">
        <div>
          <h3 className="text-sm text-gray-500 font-medium">Taxa de Conversão</h3>
          <p className="text-xl font-bold text-gray-900">{conversionRate}%</p>
          <p className="text-xs text-gray-500">Proposta → Fechado</p>
        </div>
        <div className="rounded-full bg-orange-100 p-2">
          <TrendingUp className="w-4 h-4 text-orange-600" />
        </div>
      </div>
    </div>
  );
};