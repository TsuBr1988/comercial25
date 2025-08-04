import React, { useState } from 'react';
import { Target, TrendingUp, Calendar, DollarSign, AlertTriangle, CheckCircle, X, Info } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { formatCurrency } from '../../utils/formatCurrency';
import { useYear } from '../../contexts/YearContext';

interface MonthlyGoal {
  month: number;
  year: number;
  monthName: string;
  targetContracts: number;
  targetRevenue: number;
  actualContracts: number;
  actualRevenue: number;
  surplus: number;
  deficit: number;
  adjustedTarget: number;
}

interface ContractAllocation {
  id: string;
  client: string;
  monthlyValue: number;
  annualValue: number;
  signedMonth: number;
  signedYear: number;
  allocatedMonth: number;
  allocatedYear: number;
  closingDate: string;
}

export const CommercialGoalCard: React.FC = () => {
  const [showDetails, setShowDetails] = useState(false);
  const [selectedMonthDetails, setSelectedMonthDetails] = useState<number | null>(null);
  const { selectedYear } = useYear();
  const { data: proposals = [], loading } = useSupabaseQuery('proposals');
  const { monthlyGoals, getMonthGoal, getAnnualGoal, loading: goalsLoading } = useMonthlyGoals();
  
  // Configurações da meta (agora dinâmicas)
  const TARGET_ANNUAL_REVENUE = getAnnualGoal(); // Valor dinâmico do Supabase
  
  // Período da meta: Março a Dezembro
  const GOAL_START_MONTH = 1; // Janeiro
  const GOAL_END_MONTH = 12; // Dezembro
  const CURRENT_YEAR = selectedYear;

  // Escutar mudanças nas metas
  React.useEffect(() => {
    const handleGoalsUpdate = (event: CustomEvent) => {
      console.log('🔄 Metas atualizadas - forçando atualização do CommercialGoalCard');
      // Forçar re-render completo do componente
      window.location.reload();
    };

    window.addEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    
    return () => {
      window.removeEventListener('monthlyGoalsUpdated', handleGoalsUpdate as EventListener);
    };
  }, [selectedYear]);

  if (loading || goalsLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Filtrar contratos fechados no período da meta
  const closedContracts = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado' || !proposal.closing_date) return false;
    
    const closingDate = new Date(proposal.closing_date);
    const month = closingDate.getMonth() + 1;
    const year = closingDate.getFullYear();
    
    return year === CURRENT_YEAR && month >= GOAL_START_MONTH && month <= GOAL_END_MONTH;
  });

  // Calcular alocação de contratos por mês
  const calculateContractAllocations = (): ContractAllocation[] => {
    const allocations: ContractAllocation[] = [];
    let monthlyDeficits: { [key: string]: number } = {};
    
    // Inicializar déficits mensais
    for (let month = GOAL_START_MONTH; month <= GOAL_END_MONTH; month++) {
      monthlyDeficits[`${CURRENT_YEAR}-${month}`] = getMonthGoal(month);
    }
    
    // Ordenar contratos por data de fechamento
    const sortedContracts = [...closedContracts].sort((a, b) => 
      new Date(a.closing_date!).getTime() - new Date(b.closing_date!).getTime()
    );
    
    sortedContracts.forEach(contract => {
      const closingDate = new Date(contract.closing_date!);
      const signedMonth = closingDate.getMonth() + 1;
      const annualValue = contract.monthly_value * 12; // Valor anual do contrato (mantém a multiplicação para contratos)
      
      let remainingValue = annualValue;
      let currentMonth = signedMonth;
      
      // Alocar valor começando pelo mês de assinatura
      while (remainingValue > 0 && currentMonth <= GOAL_END_MONTH) {
        const monthKey = `${CURRENT_YEAR}-${currentMonth}`;
        const monthDeficit = monthlyDeficits[monthKey] || 0;
        
        if (monthDeficit > 0) {
          const allocatedValue = Math.min(remainingValue, monthDeficit);
          
          allocations.push({
            id: contract.id,
            client: contract.client,
            monthlyValue: contract.monthly_value,
            annualValue: allocatedValue,
            signedMonth,
            signedYear: CURRENT_YEAR,
            allocatedMonth: currentMonth,
            allocatedYear: CURRENT_YEAR,
            closingDate: contract.closing_date!
          });
          
          monthlyDeficits[monthKey] -= allocatedValue;
          remainingValue -= allocatedValue;
        }
        
        currentMonth++;
      }
    });
    
    return allocations;
  };

  const contractAllocations = calculateContractAllocations();

  // Calcular dados mensais
  const calculateMonthlyData = (): (MonthlyGoal & { 
    cumulativeDeficit: number; 
    adjustedTargetFromDeficit: number; 
    effectiveTarget: number;
    inheritedCarryOver: number;
    carryOverToNext: number;
  })[] => {
    const monthlyData: MonthlyGoal[] = [];
    let carryOverFromPreviousMonth = 0;
    
    for (let month = GOAL_START_MONTH; month <= GOAL_END_MONTH; month++) {
      const monthName = new Date(CURRENT_YEAR, month - 1, 1).toLocaleDateString('pt-BR', { month: 'long' });
      const targetRevenue = getMonthGoal(month); // Meta dinâmica do Supabase (valor direto das configurações)
      
      // Contratos fechados neste mês (valor total fica no mês de fechamento)
      const monthContracts = closedContracts.filter(contract => {
        const closingDate = new Date(contract.closing_date!);
        return closingDate.getMonth() + 1 === month && closingDate.getFullYear() === CURRENT_YEAR;
      });
      
      const actualRevenue = monthContracts.reduce(
        (sum, contract) => sum + (contract.monthly_value * 12), 0 // Valor anual dos contratos fechados
      );
      
      // Calcular meta efetiva considerando superávit/déficit herdado
      // Se carryOver > 0: é déficit (soma na meta)
      // Se carryOver < 0: é superávit (subtrai da meta)
      const effectiveTarget = Math.max(0, targetRevenue + carryOverFromPreviousMonth);
      
      // Guardar o valor herdado para exibição
      const inheritedCarryOver = carryOverFromPreviousMonth;
      
      // Calcular déficit/superávit real comparando com a meta efetiva
      const realDeficit = Math.max(0, effectiveTarget - actualRevenue);
      const realSurplus = Math.max(0, actualRevenue - effectiveTarget);
      
      // Calcular carryover para o próximo mês
      let carryOverToNext = 0;
      if (targetRevenue > 0) {
        if (realSurplus > 0) {
          // Superávit que será abatido do próximo mês (valor negativo)
          carryOverToNext = -realSurplus;
        } else {
          // Déficit que será acumulado para o próximo mês (valor positivo)
          carryOverToNext = realDeficit;
        }
      }
      
      // Atualizar carryOver para a próxima iteração
      carryOverFromPreviousMonth = carryOverToNext;
      
      const currentMonthData = {
        month,
        year: CURRENT_YEAR,
        monthName,
        targetContracts: Math.ceil(targetRevenue / (targetRevenue > 0 ? targetRevenue / 12 : 300000)),
        targetRevenue,
        actualContracts: monthContracts.length,
        actualRevenue,
        surplus: realSurplus,
        deficit: realDeficit,
        adjustedTarget: effectiveTarget, // Manter compatibilidade
        cumulativeDeficit: Math.max(0, carryOverFromPreviousMonth), // Manter compatibilidade
        adjustedTargetFromDeficit: effectiveTarget, // Manter compatibilidade
        effectiveTarget,
        inheritedCarryOver,
        carryOverToNext
      };
      
      monthlyData.push(currentMonthData);
    }
    
    return monthlyData as any;
  };

  const monthlyData = calculateMonthlyData();
  
  // Calcular totais
  const totalActualRevenue = closedContracts.reduce(
    (sum, contract) => sum + (contract.monthly_value * 12), 0 // Valor anual dos contratos
  );
  const totalActualContracts = closedContracts.length;
  const totalTargetContracts = Math.ceil(TARGET_ANNUAL_REVENUE / (TARGET_ANNUAL_REVENUE > 0 ? TARGET_ANNUAL_REVENUE / 12 : 300000)); // Baseado nas metas
  const progressPercentage = (totalActualRevenue / TARGET_ANNUAL_REVENUE) * 100;
  const remainingRevenue = TARGET_ANNUAL_REVENUE - totalActualRevenue;
  
  // Alertas
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  const alerts = [];
  
  // Verificar meses sem contratos
  monthlyData.forEach(month => {
    if (month.month < currentMonth && month.actualRevenue < month.targetRevenue) {
      alerts.push({
        type: 'warning' as const,
        message: `${month.monthName}: ${month.actualContracts} contratos fechados - Déficit de ${formatCurrency(month.deficit)}`
      });
    }
    
    if (month.actualRevenue > month.targetRevenue) {
      alerts.push({
        type: 'success' as const,
        message: `${month.monthName}: Meta superada em ${formatCurrency(month.surplus)}`
      });
    }
  });

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Função auxiliar para determinar se o mês já passou
  const isMonthPast = (month: number) => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth() retorna 0-11
    const currentYear = now.getFullYear();
    
    return CURRENT_YEAR < currentYear || (CURRENT_YEAR === currentYear && month <= currentMonth);
  };

  // Função para renderizar um card mensal
  const renderMonthCard = (monthData: MonthlyGoal & { 
    cumulativeDeficit: number; 
    adjustedTargetFromDeficit: number; 
    effectiveTarget: number;
    carryOverToNext: number;
  }) => {
    const isPast = isMonthPast(monthData.month);
    const hasAlert = monthData.month < currentMonth && monthData.actualRevenue < monthData.targetRevenue;
    const hasSuccess = monthData.actualRevenue > monthData.targetRevenue;
    const hasNoGoal = monthData.targetRevenue <= 0;
    
    const handleCardClick = () => {
      setSelectedMonthDetails(monthData.month);
    };
    
    return (
      <button 
        key={monthData.month}
        onClick={handleCardClick}
        className={`rounded-lg p-2 md:p-4 border transition-all ${
          hasNoGoal
            ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
            : !isPast 
            ? 'bg-gray-100 border-gray-200 opacity-60 cursor-default' 
            : hasSuccess
            ? 'bg-green-50 border-green-200 hover:bg-green-100'
            : hasAlert
            ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100'
            : 'bg-white border-gray-200 hover:bg-gray-50'
        } text-left w-full disabled:cursor-not-allowed`}
        disabled={hasNoGoal}
      >
        <div className="flex items-center justify-between mb-2">
          <h4 className={`font-medium text-xs md:text-sm ${
            hasNoGoal ? 'text-gray-400' : !isPast ? 'text-gray-400' : 'text-gray-900'
          }`}>
            {monthData.monthName}
          </h4>
          {isPast && !hasNoGoal && (
            hasSuccess ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : hasAlert ? (
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            ) : null
          )}
        </div>
        
        <div className={`space-y-1 text-xs md:text-sm ${
          hasNoGoal ? 'text-gray-400' : !isPast ? 'text-gray-400' : 'text-gray-700'
        }`}>
          <div className="text-center">
            <div className={`text-sm md:text-lg font-bold ${
              hasNoGoal ? 'text-gray-400' : 
              !isPast ? 'text-gray-500' :
              monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'
            }`}>
              {hasNoGoal ? 'Sem meta' : (
                <>
                  {formatCurrency(monthData.effectiveTarget)}
                  <div className="text-xs md:text-xs text-gray-500 font-normal mt-1 hidden md:block">
                    ({formatCurrency(monthData.effectiveTarget / 12)}/mês)
                  </div>
                </>
              )}
            </div>
            <div className="text-gray-500">Meta Efetiva</div>
          </div>
          
          {isPast && !hasNoGoal && (
            <div className="text-center mt-2">
              <div className="font-medium text-xs md:text-sm">{formatCurrency(monthData.actualRevenue)}</div>
              <div className="text-gray-500 text-xs">{monthData.actualContracts} contrato{monthData.actualContracts !== 1 ? 's' : ''}</div>
            </div>
          )}
        </div>
      </button>
    );
  };

  // Modal para detalhes do mês
  const MonthDetailsModal: React.FC<{ monthData: any; onClose: () => void }> = ({ monthData, onClose }) => {
    const isPast = isMonthPast(monthData.month);
    const hasData = monthData.targetRevenue > 0;
    const carryOver = monthData.inheritedCarryOver || 0;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{monthData.monthName} {CURRENT_YEAR}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            {hasData ? (
              <>
                {/* Status Banner */}
                <div className={`border rounded-lg p-4 ${
                  !isPast ? 'bg-blue-50 border-blue-200' :
                  monthData.actualRevenue >= monthData.effectiveTarget ? 'bg-green-50 border-green-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {isPast && hasData && (
                      monthData.actualRevenue >= monthData.effectiveTarget ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      )
                    )}
                    <div>
                      <h3 className={`text-lg font-semibold ${
                        !isPast ? 'text-blue-900' :
                        monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {!isPast ? 'Mês Futuro' :
                         monthData.actualRevenue >= monthData.effectiveTarget ? 'Meta Atingida' : 'Meta Não Atingida'}
                      </h3>
                      <p className={`text-sm ${
                        !isPast ? 'text-blue-700' :
                        monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {!isPast ? 'Aguardando dados do mês' :
                         monthData.actualRevenue >= monthData.effectiveTarget ? 
                         `Superou a meta efetiva em ${formatCurrency(monthData.actualRevenue - monthData.effectiveTarget)}` :
                         `Déficit de ${formatCurrency(monthData.effectiveTarget - monthData.actualRevenue)}`}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Dados do Mês */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Meta Original</label>
                      <div className="text-xl font-bold text-blue-600">{formatCurrency(monthData.targetRevenue)}</div>
                    </div>
                    
                    {carryOver !== 0 && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">
                          {carryOver > 0 ? 'Déficit Herdado' : 'Superávit Herdado'}
                        </label>
                        <div className={`text-xl font-bold ${carryOver > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {carryOver > 0 ? '+' : ''}{formatCurrency(Math.abs(carryOver))}
                        </div>
                        <div className="text-xs text-gray-500">Do mês anterior</div>
                      </div>
                    )}
                    
                    <div>
                      <label className="text-sm font-medium text-gray-600">Meta Efetiva</label>
                      <div className={`text-2xl font-bold ${
                        monthData.effectiveTarget > monthData.targetRevenue ? 'text-red-600' : 
                        monthData.effectiveTarget < monthData.targetRevenue ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {formatCurrency(monthData.effectiveTarget)}
                      </div>
                      {monthData.effectiveTarget !== monthData.targetRevenue && (
                        <div className="text-xs text-gray-500">
                          {monthData.effectiveTarget > monthData.targetRevenue ? 
                            `+${formatCurrency(monthData.effectiveTarget - monthData.targetRevenue)}` :
                            `-${formatCurrency(monthData.targetRevenue - monthData.effectiveTarget)}`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {isPast && (
                      <>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Realizado</label>
                          <div className={`text-xl font-bold ${
                            monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(monthData.actualRevenue)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {monthData.actualContracts} contrato{monthData.actualContracts !== 1 ? 's' : ''}
                          </div>
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium text-gray-600">
                            {monthData.actualRevenue >= monthData.effectiveTarget ? 'Superávit' : 'Déficit'}
                          </label>
                          <div className={`text-xl font-bold ${
                            monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(Math.abs(monthData.actualRevenue - monthData.effectiveTarget))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Impacto no Próximo Mês */}
                {isPast && hasData && monthData.carryOverToNext !== 0 && (
                  <div className={`p-4 rounded-lg border ${
                    monthData.carryOverToNext > 0 ? 'bg-red-100 border-red-200' : 'bg-green-100 border-green-200'
                  }`}>
                    <h4 className={`font-medium ${
                      monthData.carryOverToNext > 0 ? 'text-red-800' : 'text-green-800'
                    } mb-2`}>
                      Impacto no Próximo Mês
                    </h4>
                    <p className={`text-sm ${
                      monthData.carryOverToNext > 0 ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {monthData.carryOverToNext > 0 ? 
                        `Déficit de ${formatCurrency(monthData.carryOverToNext)} será acumulado para o próximo mês` :
                        `Superávit de ${formatCurrency(Math.abs(monthData.carryOverToNext))} será abatido do próximo mês`
                      }
                    </p>
                  </div>
                )}
                
                {/* Cálculo Detalhado */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Cálculo Detalhado</h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <span>Meta Original:</span>
                      <span className="font-medium">{formatCurrency(monthData.targetRevenue)}</span>
                    </div>
                    {carryOver !== 0 && (
                      <div className="flex justify-between">
                        <span>{carryOver > 0 ? 'Déficit' : 'Superávit'} Herdado:</span>
                        <span className={`font-medium ${carryOver > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {carryOver > 0 ? '+' : ''}{formatCurrency(Math.abs(carryOver))}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-bold">
                      <span>Meta Efetiva:</span>
                      <span>{formatCurrency(monthData.effectiveTarget)}</span>
                    </div>
                    {isPast && (
                      <>
                        <div className="flex justify-between">
                          <span>Realizado:</span>
                          <span className="font-medium">{formatCurrency(monthData.actualRevenue)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold">
                          <span>{monthData.actualRevenue >= monthData.effectiveTarget ? 'Superávit:' : 'Déficit:'}</span>
                          <div className={monthData.actualRevenue >= monthData.effectiveTarget ? 'text-green-600' : 'text-red-600'}>
                            <span>{formatCurrency(Math.abs(monthData.actualRevenue - monthData.effectiveTarget))}</span>
                            <div className="text-xs text-gray-500 font-normal">
                              ({formatCurrency(Math.abs(monthData.actualRevenue - monthData.effectiveTarget) / 12)}/mês)
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">
                  <Target className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">Sem Meta Definida</h3>
                  <p className="text-sm">Este mês não possui meta comercial configurada</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-xl shadow-sm border-2 border-blue-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Meta Comercial {CURRENT_YEAR}</h2>
            <p className="text-gray-600">Janeiro a Dezembro • Meta anual: {formatCurrency(TARGET_ANNUAL_REVENUE)}</p>
          </div>
        </div>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>{showDetails ? 'Ocultar Detalhes' : 'Ver Detalhes'}</span>
        </button>
      </div>

      {/* Visão Geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Meta Anual</h3>
            <Target className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatCurrency(TARGET_ANNUAL_REVENUE)}</div>
          <div className="text-sm text-gray-500">
            {totalTargetContracts} contratos • <span className="text-xs">({formatCurrency(TARGET_ANNUAL_REVENUE / 12)}/mês)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Total Vendido</h3>
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalActualRevenue)}</div>
          <div className="text-sm text-gray-500">
            {totalActualContracts} contratos fechados • <span className="text-xs">({formatCurrency(totalActualRevenue / 12)}/mês)</span>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Progresso</h3>
            <TrendingUp className="w-5 h-5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold text-purple-600">{progressPercentage.toFixed(1)}%</div>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div 
              className={`h-2 rounded-full transition-all ${getProgressColor(progressPercentage)}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Falta Atingir</h3>
            <Calendar className="w-5 h-5 text-orange-500" />
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {remainingRevenue > 0 ? (
              <>
                {formatCurrency(remainingRevenue)}
                <div className="text-xs text-gray-500 font-normal mt-1">
                  ({formatCurrency(remainingRevenue / 12)}/mês)
                </div>
              </>
            ) : 'Meta Atingida!'}
          </div>
          <div className="text-sm text-gray-500">
            {remainingRevenue > 0 ? 'Para atingir meta anual' : '🎉 Parabéns!'}
          </div>
        </div>
      </div>

      {/* Cards Mensais */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Acompanhamento Mensal - {CURRENT_YEAR}</h3>
        
        {/* Layout Desktop: 2 linhas x 6 colunas */}
        <div className="hidden md:block">
          {/* Primeira linha - Janeiro a Junho */}
          <div className="grid grid-cols-6 gap-4 mb-4">
            {monthlyData.slice(0, 6).map(monthData => renderMonthCard(monthData))}
          </div>
          
          {/* Segunda linha - Julho a Dezembro */}
          <div className="grid grid-cols-6 gap-4">
            {monthlyData.slice(6, 12).map(monthData => renderMonthCard(monthData))}
          </div>
        </div>
        
        {/* Layout Mobile: 4 linhas x 3 colunas */}
        <div className="md:hidden">
          <div className="grid grid-cols-2 gap-3 space-y-0">
            {monthlyData.map(monthData => renderMonthCard(monthData))}
          </div>
        </div>
      </div>

      {/* Detalhes Expandidos */}
      {showDetails && (
        <div className="space-y-6">

          {/* Lista de Contratos */}
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contratos Fechados {CURRENT_YEAR} ({totalActualContracts})</h3>
            {closedContracts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Cliente</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Mês Assinatura</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Valor Mensal</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-600">Valor Anual</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedContracts.map((contract) => {
                      const annualValue = contract.monthly_value * 12;
                      const closingDate = new Date(contract.closing_date!);
                      const closingMonth = closingDate.getMonth() + 1;
                      
                      return (
                        <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{contract.client}</td>
                        <td className="py-3 px-4 text-center">
                          {new Date(contract.closing_date!).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                        </td>
                        <td className="py-3 px-4 text-center">{formatCurrency(contract.monthly_value)}</td>
                        <td className="py-3 px-4 text-center font-medium text-green-600">
                          {formatCurrency(annualValue)}
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum contrato fechado em {CURRENT_YEAR}</p>
                <p className="text-sm text-gray-400">Os contratos fechados aparecerão aqui automaticamente</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Modal de Detalhes do Mês */}
      {selectedMonthDetails !== null && (
        <MonthDetailsModal
          monthData={monthlyData.find(m => m.month === selectedMonthDetails)}
          onClose={() => setSelectedMonthDetails(null)}
        />
      )}
    </div>
  );
};