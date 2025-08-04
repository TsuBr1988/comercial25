import React, { useState, memo, useMemo, useCallback } from 'react';
import { Plus, Filter, DollarSign, Calendar, TrendingUp, User, Search, ArrowUpDown } from 'lucide-react';
import { ChevronDown, Check } from 'lucide-react';
import { ProposalCard } from './ProposalCard';
import { ProposalForm } from './ProposalForm';
import { Proposal } from '../../types';
import { ProbabilityScores } from './ProbabilityModal';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { supabase } from '../../lib/supabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { clearQueryCache } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';

interface ProposalsProps {
  onDataChange?: () => void;
}

export const Proposals: React.FC<ProposalsProps> = memo(({ onDataChange }) => {
  const { selectedYear } = useYear();
  const { canEdit } = useSystemVersion();
  const canEditProposals = canEdit('proposals');
  
  // Otimizar query com campos específicos
  const { data: proposalsData = [], loading, refetch } = useSupabaseQuery('proposals', {
    select: 'id, client, monthly_value, months, total_value, status, commission, commission_rate, closer_id, sdr_id, closing_date, lost_date, lost_reason, created_at, updated_at',
    orderBy: { column: 'created_at', ascending: false }
  });
  
  // Query separada para probability_scores apenas quando necessário
  const { data: probabilityData = [] } = useSupabaseQuery('probability_scores', {
    select: 'proposal_id, economic_buyer, metrics, decision_criteria, decision_process, identify_pain, champion, competition, engagement'
  });
  
  // Transform database data to match our Proposal interface
  const proposals: Proposal[] = useMemo(() => proposalsData.map(p => ({
    id: p.id,
    client: p.client,
    monthlyValue: p.monthly_value,
    months: p.months,
    totalValue: p.total_value,
    status: p.status,
    commission: p.commission,
    commissionRate: p.commission_rate,
    closerId: p.closer_id || '',
    sdrId: p.sdr_id || undefined,
    closingDate: p.closing_date || undefined,
    lostDate: p.lost_date || undefined,
    lostReason: p.lost_reason || undefined,
    probabilityScores: (() => {
      const probData = probabilityData.find(pd => pd.proposal_id === p.id);
      return probData ? {
        economicBuyer: probData.economic_buyer,
        metrics: probData.metrics,
        decisionCriteria: probData.decision_criteria,
        decisionProcess: probData.decision_process,
        identifyPain: probData.identify_pain,
        champion: probData.champion,
        competition: probData.competition,
        engagement: probData.engagement
      } : undefined;
    })(),
    createdAt: p.created_at,
    updatedAt: p.updated_at
  })).filter(proposal => {
    // Filtrar propostas baseado no ano selecionado
    // Propostas em aberto (Proposta/Negociação) sempre são mostradas
    if (proposal.status === 'Proposta' || proposal.status === 'Negociação') {
      return true; // Sempre mostrar propostas em aberto
    }
    
    // Para propostas fechadas/perdidas, filtrar por ano
    if (proposal.status === 'Fechado' && proposal.closingDate) {
      return new Date(proposal.closingDate).getFullYear() === selectedYear;
    }
    
    if (proposal.status === 'Perdido' && proposal.lostDate) {
      return new Date(proposal.lostDate).getFullYear() === selectedYear;
    }
    
    // Fallback para data de criação se não houver data específica
    return new Date(proposal.createdAt).getFullYear() === selectedYear;
  }), [proposalsData, probabilityData, selectedYear]);

  const [filter, setFilter] = useState('all');
  const [selectedMonths, setSelectedMonths] = useState<string[]>(['all']);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'client' | 'created_at' | 'status' | 'monthly_value'>('status');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Generate available months from proposals
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    proposals.forEach(proposal => {
      const date = new Date(proposal.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    return Array.from(months).sort().reverse(); // Most recent first
  }, [proposals]);

  const formatMonthLabel = useCallback((monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, []);

  const handleMonthToggle = useCallback((monthKey: string) => {
    if (monthKey === 'all') {
      // Toggle all - se já tem todos selecionados, limpar; senão selecionar todos
      if (selectedMonths.includes('all') || selectedMonths.length === availableMonths.length) {
        setSelectedMonths([]);
      } else {
        setSelectedMonths(['all']);
      }
    } else {
      setSelectedMonths(prev => {
        // Remove 'all' se estiver presente
        let newSelection = prev.filter(m => m !== 'all');
        
        if (prev.includes(monthKey)) {
          // Remove o mês se já estiver selecionado
          newSelection = newSelection.filter(m => m !== monthKey);
        } else {
          // Adiciona o mês se não estiver selecionado
          newSelection = [...newSelection, monthKey];
        }
        
        // Se todos os meses estão selecionados, mostrar como 'all'
        if (newSelection.length === availableMonths.length) {
          return ['all'];
        }
        
        return newSelection;
      });
    }
  }, [availableMonths]);

  // Filter and search proposals
  const filteredProposals = useMemo(() => {
    let filtered = proposals.filter(proposal => {
      // Filter by status
      const statusMatch = filter === 'all' || proposal.status === filter;
      
      // Filter by search term (client name - partial match, case insensitive)
      const searchMatch = searchTerm === '' || 
        proposal.client.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Filter by month
      if (selectedMonths.includes('all') || selectedMonths.length === 0) {
        return statusMatch && searchMatch;
      }
      
      const proposalDate = new Date(proposal.createdAt);
      const proposalMonthKey = `${proposalDate.getFullYear()}-${String(proposalDate.getMonth() + 1).padStart(2, '0')}`;
      const monthMatch = selectedMonths.includes(proposalMonthKey);
      
      return statusMatch && searchMatch && monthMatch;
    });
    
    // Sort proposals
    return filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'client':
          aValue = a.client.toLowerCase();
          bValue = b.client.toLowerCase();
          break;
        case 'created_at':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          // Order: Análise de contrato, Negociação, Proposta, Fechado, Perdido
          const statusOrder = { 
            'Análise de contrato': 1, 
            'Negociação': 2, 
            'Proposta': 3, 
            'Fechado': 4, 
            'Perdido': 5 
          };
          aValue = statusOrder[a.status as keyof typeof statusOrder];
          bValue = statusOrder[b.status as keyof typeof statusOrder];
          break;
        case 'monthly_value':
          aValue = a.monthlyValue;
          bValue = b.monthlyValue;
          break;
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });
  }, [proposals, filter, searchTerm, selectedMonths, sortBy, sortOrder]);

  // Calculate stats based on filtered proposals
  const stats = useMemo(() => {
    const totalValue = filteredProposals.reduce((sum, p) => sum + p.totalValue, 0);
    
    // Usar a mesma lógica do Dashboard - TODAS as propostas ativas, não só as filtradas
    const activeProposals = proposals.filter(p => p.status === 'Proposta' || p.status === 'Negociação');
    const calculateTotalPossibleCommission = () => {
      const commissionsByEmployee: { [key: string]: { closerCommission: number, sdrCommission: number } } = {};
      
      activeProposals.forEach(proposal => {
        const proposalCommission = Number(proposal.commission || 0);
        
        // Comissão do Closer
        if (proposal.closerId) {
          if (!commissionsByEmployee[proposal.closerId]) {
            commissionsByEmployee[proposal.closerId] = { closerCommission: 0, sdrCommission: 0 };
          }
          commissionsByEmployee[proposal.closerId].closerCommission += proposalCommission;
        }
        
        // Comissão do SDR (mesma comissão que o closer)
        if (proposal.sdrId) {
          if (!commissionsByEmployee[proposal.sdrId]) {
            commissionsByEmployee[proposal.sdrId] = { closerCommission: 0, sdrCommission: 0 };
          }
          commissionsByEmployee[proposal.sdrId].sdrCommission += proposalCommission;
        }
      });
      
      return Object.values(commissionsByEmployee).reduce(
        (sum, employee) => sum + employee.closerCommission + employee.sdrCommission, 0
      );
    };
    
    const totalPossibleCommission = calculateTotalPossibleCommission();
    
    const evaluatedProposals = filteredProposals.filter(p => p.probabilityScores);
    let averageProbability = 0;
    let averageProbabilityLabel = 'Não avaliada';
    
    if (evaluatedProposals.length > 0) {
      const totalScore = evaluatedProposals.reduce((sum, p) => {
        const scores = Object.values(p.probabilityScores!).reduce((s, score) => s + score, 0);
        return sum + scores;
      }, 0);
      
      const avgScore = totalScore / evaluatedProposals.length;
      averageProbability = Math.round((avgScore / 24) * 100);
      
      if (avgScore < 12) averageProbabilityLabel = 'Baixa';
      else if (avgScore <= 18) averageProbabilityLabel = 'Média';
      else averageProbabilityLabel = 'Alta';
    }
    
    return {
      totalValue,
      totalPossibleCommission,
      averageProbability,
      averageProbabilityLabel,
      evaluatedCount: evaluatedProposals.length
    };
  }, [filteredProposals, proposals]); // Adicionar proposals como dependência
  
  const handleAddProposal = useCallback((newProposal: Omit<Proposal, 'id' | 'createdAt' | 'updatedAt'>) => {
    const insertProposal = async () => {
      try {
        // Usar a data da proposta fornecida pelo usuário
        const proposalDate = new Date(newProposal.proposalDate).toISOString();
        
        const proposalData = {
          client: newProposal.client,
          monthly_value: newProposal.monthlyValue,
          months: newProposal.months,
          total_value: newProposal.totalValue,
          status: newProposal.status,
          commission: newProposal.commission,
          commission_rate: newProposal.commissionRate,
          closer_id: newProposal.closerId,
          sdr_id: newProposal.sdrId || null,
          closing_date: newProposal.closingDate || null,
          lost_date: newProposal.lostDate || null,
          lost_reason: newProposal.lostReason || null,
          created_at: proposalDate,
          updated_at: proposalDate
        };

        console.log('Dados sendo inseridos no Supabase:', proposalData);

        const { data, error } = await supabase
          .from('proposals')
          .insert(proposalData)
          .select()
          .single();

        if (error) {
          console.error('Error inserting proposal:', error);
          alert(`Erro ao criar proposta: ${error.message}`);
          return;
        }

        console.log('Proposal created successfully:', data);
        
        // Refresh the data
        await refetch();
        setShowForm(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        alert('Erro inesperado ao criar proposta. Tente novamente.');
      }
    };

    insertProposal();
  }, [refetch]);

  const handleUpdateProbability = useCallback((proposalId: string, scores: ProbabilityScores) => {
    const updateScores = async () => {
      try {
        const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
        
        // Limpar cache antes de fazer a operação
        clearQueryCache('probability_scores');
        clearQueryCache('proposals');
        
        // Verificar se já existe um registro de probabilidade
        const { data: existingScore, error: checkError } = await supabase
          .from('probability_scores')
          .select('id')
          .eq('proposal_id', proposalId)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        // Preparar dados para salvar no banco
        const scoreData = {
          economic_buyer: scores.economicBuyer,
          metrics: scores.metrics,
          decision_criteria: scores.decisionCriteria,
          decision_process: scores.decisionProcess,
          identify_pain: scores.identifyPain,
          champion: scores.champion,
          competition: scores.competition,
          engagement: scores.engagement,
          updated_at: new Date().toISOString()
        };

        let result;
        if (existingScore) {
          const { data, error } = await supabase
            .from('probability_scores')
            .update(scoreData)
            .eq('proposal_id', proposalId)
            .select()
            .single();
          
          result = { data, error };
        } else {
          const { data, error } = await supabase
            .from('probability_scores')
            .insert({
              proposal_id: proposalId,
              ...scoreData
            })
            .select()
            .single();
          
          result = { data, error };
        }

        if (result.error) {
          alert(`Erro ao atualizar probabilidade: ${result.error.message}`);
          return;
        }

        // Limpar cache após salvar
        clearQueryCache('probability_scores');
        clearQueryCache('proposals');
        
        // Forçar atualização completa dos dados
        await refetch();
        
        // Pequeno delay para garantir que os dados foram atualizados
        setTimeout(() => {
          window.location.reload();
        }, 500);
        
      } catch (err) {
        alert(`Erro inesperado ao atualizar probabilidade: ${err instanceof Error ? err.message : 'Tente novamente.'}`);
      }
    };

    updateScores();
  }, [refetch]);

  const handleUpdateProposal = useCallback((updatedProposal: Proposal) => {
    const updateProposal = async () => {
      try {
        console.log('Updating proposal:', updatedProposal.id, 'with data:', updatedProposal);
        
        const proposalData = {
          client: updatedProposal.client,
          monthly_value: updatedProposal.monthlyValue,
          months: updatedProposal.months,
          total_value: updatedProposal.totalValue,
          status: updatedProposal.status,
          commission: updatedProposal.commission,
          commission_rate: updatedProposal.commissionRate,
          closer_id: updatedProposal.closerId,
          sdr_id: updatedProposal.sdrId || null,
          closing_date: updatedProposal.closingDate || null,
          lost_date: updatedProposal.lostDate || null,
          lost_reason: updatedProposal.lostReason || null,
          updated_at: new Date().toISOString()
        };

        console.log('Sending to Supabase:', proposalData);
        
        const { data, error } = await supabase
          .from('proposals')
          .update(proposalData)
          .eq('id', updatedProposal.id)
          .select()
          .single();

        if (error) {
          console.error('Supabase update error:', error);
          alert(`Erro ao atualizar proposta: ${error.message}`);
          return;
        }
        
        console.log('Update successful:', data);
        
        // Clear cache to force refresh
        clearQueryCache('proposals');
        clearQueryCache('probability_scores');

        // Force refresh of all data to update the entire system
        await refetch();
        if (onDataChange) onDataChange();
        
        // Small delay to ensure UI updates
        setTimeout(() => {
          console.log('Proposal update completed');
        }, 100);
        
      } catch (err) {
        console.error('Unexpected error updating proposal:', err);
        alert('Erro inesperado ao atualizar proposta.');
      }
    };

    updateProposal();
  }, [refetch, onDataChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-700">Carregando Propostas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Propostas {selectedYear}</h1>
          <p className="text-gray-600">
            Gerencie suas propostas e acompanhe comissões para {selectedYear}
            {(filter === 'Proposta' || filter === 'Negociação' || filter === 'all') && 
             ' (propostas em aberto de todos os anos)'}
          </p>
        </div>
        {canEditProposals ? (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Proposta</span>
          </button>
        ) : (
          <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Modo Somente Leitura</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Comissão Total Possível</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalPossibleCommission)}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Propostas em andamento (Proposta e Negociação)
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Propostas</p>
              <p className="text-2xl font-bold text-gray-900">{proposals.length}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avaliação Média</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-orange-600">{stats.averageProbability}%</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  stats.averageProbabilityLabel === 'Alta' ? 'bg-green-100 text-green-800' :
                  stats.averageProbabilityLabel === 'Média' ? 'bg-yellow-100 text-yellow-800' :
                  stats.averageProbabilityLabel === 'Baixa' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {stats.averageProbabilityLabel}
                </span>
              </div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-orange-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Baseado em {stats.evaluatedCount} avaliações
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="flex items-center space-x-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome do cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <ArrowUpDown className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="created_at">Data de Inclusão</option>
              <option value="client">Nome do Cliente</option>
              <option value="status">Situação</option>
              <option value="monthly_value">Valor Mensal</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              title={`Ordenação ${sortOrder === 'asc' ? 'crescente' : 'decrescente'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
        
        {/* Status and Month Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Filtrar por status:</span>
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">Todas</option>
            <option value="Proposta">Proposta</option>
            <option value="Negociação">Negociação</option>
            <option value="Fechado">Fechado</option>
            <option value="Perdido">Perdido</option>
          </select>
          
          {/* Month Filter */}
          <div className="relative flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-700">Mês de inclusão:</span>
            
            {/* Custom Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 min-w-[200px] bg-white flex items-center justify-between"
              >
                <span>
                  {selectedMonths.includes('all') || selectedMonths.length === 0
                    ? '📅 Todos os meses'
                    : selectedMonths.length === 1
                    ? formatMonthLabel(selectedMonths[0])
                    : `${selectedMonths.length} meses selecionados`
                  }
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showMonthDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showMonthDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                  {/* Todos os meses option */}
                  <label className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedMonths.includes('all') || selectedMonths.length === availableMonths.length}
                      onChange={() => handleMonthToggle('all')}
                      className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-sm">Todos os meses</span>
                    {(selectedMonths.includes('all') || selectedMonths.length === availableMonths.length) && (
                      <Check className="w-4 h-4 ml-auto text-green-600" />
                    )}
                  </label>
                  
                  <div className="border-t border-gray-200"></div>
                  
                  {/* Individual months */}
                  {availableMonths.map(monthKey => (
                    <label key={monthKey} className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedMonths.includes('all') || selectedMonths.includes(monthKey)}
                        onChange={() => handleMonthToggle(monthKey)}
                        className="mr-3 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-sm flex-1">{formatMonthLabel(monthKey)}</span>
                      {(selectedMonths.includes('all') || selectedMonths.includes(monthKey)) && (
                        <Check className="w-4 h-4 text-green-600" />
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Summary */}
          <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
            Mostrando {filteredProposals.length} de {proposals.length} propostas
            {searchTerm && ` • Busca: "${searchTerm}"`}
            {selectedMonths.includes('all') || selectedMonths.length === 0
              ? ' (todos os meses)'
              : selectedMonths.length === 1
              ? ` (${formatMonthLabel(selectedMonths[0])})`
              : ` (${selectedMonths.length} meses selecionados)`
            }
            {` • Ano: ${selectedYear}`}
            {` • Ordenado por ${
              sortBy === 'created_at' ? 'Data de Inclusão' :
              sortBy === 'client' ? 'Nome do Cliente' :
              sortBy === 'status' ? 'Situação' :
              'Valor Mensal'
            } (${sortOrder === 'asc' ? 'crescente' : 'decrescente'})`}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showMonthDropdown && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setShowMonthDropdown(false)}
        ></div>
      )}

      {/* Proposals Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredProposals.map((proposal) => (
          <ProposalCard 
            key={proposal.id} 
            proposal={proposal} 
            onUpdateProbability={canEditProposals ? handleUpdateProbability : undefined}
            onUpdateProposal={canEditProposals ? handleUpdateProposal : undefined}
            readOnly={!canEditProposals}
          />
        ))}
        
        {filteredProposals.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhuma proposta encontrada' : 'Nenhuma proposta'}
            </h3>
            <p className="text-gray-500">
              {searchTerm 
                ? `Não encontramos propostas com "${searchTerm}". Tente outro termo de busca.`
                : 'Clique em "Nova Proposta" para começar.'
              }
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Limpar Busca
              </button>
            )}
          </div>
        )}
      </div>

      {/* Proposal Form Modal */}
      {showForm && canEditProposals && (
        <ProposalForm
          onSubmit={handleAddProposal}
          onCancel={() => setShowForm(false)}
        />
      )}
      
    </div>
  );
});