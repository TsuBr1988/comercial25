/**
 * Dashboard Principal
 * 
 * Componente organizador que importa e exibe todos os cards do dashboard.
 * Cada card é um componente independente para facilitar manutenção e reutilização.
 * 
 * Estrutura:
 * 1. Header com título e ano fiscal
 * 2. KPIs Comerciais (métricas principais)
 * 3. Meta Comercial (acompanhamento anual)
 * 4. Resumo Executivo (4 indicadores principais)
 * 5. Gráficos e Análises (performance mensal e propostas ativas)
 * 6. Comissões (garantidas e possíveis)
 * 7. Funil de Vendas (análise do pipeline)
 */

import React from 'react';
import { Calendar } from 'lucide-react';

// Dashboard Component Imports - Each card is an independent, reusable component
import { SalesChart } from './SalesChart';
import { EmployeeHighlight } from './EmployeeHighlight';
import { SalesFunnelCard } from './SalesFunnelCard';
import { CommercialGoalCard } from './CommercialGoalCard';
import { CommercialKPIs } from './CommercialKPIs';
import { TopSummaryCards } from './TopSummaryCards';
import { ActiveProposalsCard } from './ActiveProposalsCard';
import { GuaranteedCommissions } from './GuaranteedCommissions';
import { PossibleCommissions } from './PossibleCommissions';
import { ChallengesAndRewardsCard } from './ChallengesAndRewardsCard';

import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';

export const Dashboard: React.FC = () => {
  const { selectedYear } = useYear();
  
  // Global loading state for dashboard initialization
  const { loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { loading: employeesLoading } = useSupabaseQuery('employees');

  if (proposalsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* ==================== HEADER ==================== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard {selectedYear}</h1>
          <p className="text-gray-600">Visão geral do desempenho comercial</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 px-3 py-2 rounded-lg">
          <Calendar className="w-4 h-4" />
          <span>Ano Fiscal: {selectedYear}</span>
        </div>
      </div>

      {/* ==================== KPIs COMERCIAIS ==================== */}
      {/* Indicadores principais: Ticket Médio, CAC, ROI, LTV/CAC */}
      <h2 className="text-xl font-semibold text-gray-800 mb-2">KPI's comerciais</h2>
      <p className="text-sm text-gray-500 mb-4">Indicadores-chave de performance do negócio</p>
      <CommercialKPIs />

      {/* ==================== META COMERCIAL ==================== */}
      {/* Acompanhamento mensal da meta anual de vendas */}
      <CommercialGoalCard />

      {/* ==================== RESUMO EXECUTIVO ==================== */}
      {/* 4 indicadores principais: Propostas Ativas, Comissão, Fechados, Conversão */}
      <TopSummaryCards />

      {/* ==================== GRÁFICOS E ANÁLISES ==================== */}
      {/* Performance mensal de vendas e propostas ativas detalhadas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesChart />
        <ActiveProposalsCard />
      </div>

      {/* ==================== COMISSÕES ==================== */}
      {/* Comissões já garantidas (fechadas) e possíveis (em aberto) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GuaranteedCommissions />
        <PossibleCommissions />
      </div>

      {/* ==================== ANÁLISE DO PIPELINE ==================== */}
      {/* Funil de vendas com análise de conversão entre estágios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesFunnelCard />
        <ChallengesAndRewardsCard />
      </div>
    </div>
  );
};