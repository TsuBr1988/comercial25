import React, { useState } from 'react';
import { Settings as SettingsIcon, Users, DollarSign, Calendar, Target, ClipboardList, ArrowLeft, X, Plus, Trash2, Shield } from 'lucide-react';
import { useSupabaseQuery, useSupabaseUpdate } from '../../hooks/useSupabase';
import { configurationService, MonthlyGoal, CommissionTier, WeeklyMetric } from '../../services/configurationService';
import { EmployeeManagement } from '../Employees/EmployeeManagement';
import { UserManagement } from '../UserManagement/UserManagement';
import { BudgetParametersCard } from './BudgetParametersCard';
import { useMonthlyGoals } from '../../hooks/useMonthlyGoals';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { useYear } from '../../contexts/YearContext';

export const Settings: React.FC = () => {
  const { selectedYear } = useYear();
  const { canEdit, canView } = useSystemVersion();
  const canEditSettings = canEdit('settings');
  const canViewSettings = canView('settings');
  
  const [activeSection, setActiveSection] = useState<'employees' | 'users' | 'profile' | 'goals' | 'commissions' | 'weekly-metrics' | 'operational-costs' | 'budget-params' | null>(null);
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Hook para metas mensais
  const { 
    monthlyGoals, 
    loading: goalsLoading, 
    updateGoals,
    getAnnualGoal 
  } = useMonthlyGoals();

  // Estado local para edição das metas
  const [editingGoals, setEditingGoals] = useState<MonthlyGoal[]>([]);

  // Estados para Comissões
  const [commissionTiers, setCommissionTiers] = useState<CommissionTier[]>([]);

  // Estados para Performance Semanal
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetric[]>([]);

  // Estados para Custos Operacionais
  const [operationalCosts, setOperationalCosts] = useState<any[]>([]);
  const [costYears, setCostYears] = useState<number[]>([2024, 2025]);

  // Carregar configurações do Supabase
  React.useEffect(() => {
    const loadConfigurations = async () => {
      try {
        setLoading(true);
        const [tiers, metrics, costs] = await Promise.all([
          configurationService.getCommissionTiers(),
          configurationService.getWeeklyMetrics(),
          configurationService.getOperationalCosts()
        ]);
        
        setCommissionTiers(tiers);
        setWeeklyMetrics(metrics);
        
        // Converter estrutura antiga para nova estrutura multi-ano se necessário
        const convertedCosts = costs.map(cost => ({
          ...cost,
          years: cost.years || costYears.map(year => ({
            year,
            months: cost.months || Array.from({ length: 12 }, (_, index) => ({
              month: index + 1,
              value: 0
            }))
          }))
        }));
        
        setOperationalCosts(convertedCosts);
      } catch (error) {
        console.error('Error loading configurations:', error);
        alert('Erro ao carregar configurações. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    loadConfigurations();
  }, []);

  // Sincronizar metas quando carregadas
  React.useEffect(() => {
    if (monthlyGoals.length > 0) {
      setEditingGoals([...monthlyGoals]);
    }
  }, [monthlyGoals]);

  const handleGoalChange = (month: number, value: number) => {
    setEditingGoals(prevGoals => 
      prevGoals.map(goal => 
        goal.month === month 
          ? { ...goal, targetValue: value }
          : goal
      )
    );
  };

  const handleSaveGoals = async () => {
    try {
      setLoading(true);
      await updateGoals(editingGoals);
      alert('Metas atualizadas com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar metas:', error);
      alert('Erro ao salvar metas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const renderCostsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Custos Operacionais</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Custos Mensais - {selectedYear}</h3>
            <p className="text-gray-600">Configure os custos mensais para cálculo do CAC (Custo de Aquisição de Cliente)</p>
          </div>

          {/* Tabela de Custos */}
          <div className="overflow-x-auto border border-gray-200 rounded-lg max-w-full">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 sticky left-0 bg-gray-50" style={{ minWidth: '240px', width: '240px' }}>
                    Tipo de Custo
                  </th>
                  {costYears.map(year => (
                    <th key={year} className="border-l border-gray-300" colSpan={12}>
                      <div className="text-center text-lg font-bold text-gray-900 py-2 bg-blue-50">
                        {year}
                      </div>
                      <div className="grid grid-cols-12 bg-gray-50">
                        {Array.from({ length: 12 }, (_, index) => {
                          const month = new Date(year, index, 1).toLocaleDateString('pt-BR', { month: 'short' });
                          return (
                            <div key={index + 1} className="px-1 py-2 text-center text-xs font-medium text-gray-700 border-r border-gray-200" style={{ minWidth: '50px' }}>
                              {month}
                            </div>
                          );
                        })}
                      </div>
                    </th>
                  ))}
                  <th className="px-2 py-3 text-center text-sm font-medium text-gray-900 sticky right-0 bg-gray-50" style={{ minWidth: '80px' }}>
                    <button
                      onClick={addNewYear}
                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      title="Adicionar novo ano"
                    >
                      + Ano
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {operationalCosts.map((cost) => (
                  <tr key={cost.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 sticky left-0 bg-white">
                      <input
                        type="text"
                        value={cost.name}
                        onChange={(e) => updateCostName(cost.id, e.target.value)}
                       className="w-full px-3 py-2 text-base border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Nome do custo"
                      />
                    </td>
                    {costYears.map(year => (
                      <td key={year} className="border-l border-gray-200" colSpan={12}>
                        <div className="grid grid-cols-12">
                          {cost.years?.find((y: any) => y.year === year)?.months?.map((monthData: any) => (
                            <div key={`${year}-${monthData.month}`} className="px-1 py-2 border-r border-gray-100">
                              <input
                                type="number"
                                value={monthData.value}
                                onChange={(e) => updateCostValueForYear(cost.id, year, monthData.month, Number(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                style={{ minWidth: '45px' }}
                              />
                            </div>
                          )) || Array.from({ length: 12 }, (_, index) => (
                            <div key={`${year}-${index + 1}`} className="px-1 py-2 border-r border-gray-100">
                              <input
                                type="number"
                                value={0}
                                onChange={(e) => updateCostValueForYear(cost.id, year, index + 1, Number(e.target.value) || 0)}
                                className="w-full px-1 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                                placeholder="0"
                                min="0"
                                step="0.01"
                                style={{ minWidth: '45px' }}
                              />
                            </div>
                          ))}
                        </div>
                      </td>
                    ))}
                    <td className="px-2 py-3 text-center sticky right-0 bg-white">
                      <button
                        onClick={() => removeCostLine(cost.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Remover linha"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botão para adicionar nova linha */}
          <button
            onClick={addCostLine}
            className="w-full mt-4 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Linha de Custo</span>
          </button>

          {/* Resumo dos Custos */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-6">
            <h4 className="font-medium text-red-900 mb-3">Resumo dos Custos por Mês</h4>
            <div className="space-y-4">
              {costYears.map(year => (
                <div key={year}>
                  <h5 className="font-medium text-red-800 mb-2">{year}</h5>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    {Array.from({ length: 12 }, (_, index) => {
                      const month = index + 1;
                      const monthName = new Date(year, index, 1).toLocaleDateString('pt-BR', { month: 'long' });
                      const monthTotal = operationalCosts.reduce((sum, cost) => {
                        const yearData = cost.years?.find((y: any) => y.year === year);
                        const monthData = yearData?.months?.find((m: any) => m.month === month);
                        return sum + (monthData?.value || 0);
                      }, 0);
                       
                       return (
                  <div key={month} className="text-center">
                    <div className="font-bold text-red-600 capitalize">
                      {formatCurrency(monthTotal)}
                    </div>
                    <div className="text-red-700 text-xs capitalize">{monthName}</div>
                  </div>
                );
              })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-red-300 text-center">
              <div className="text-lg font-bold text-red-600">
                {formatCurrency(costYears.reduce((yearSum, year) => {
                  return yearSum + operationalCosts.reduce((sum, cost) => {
                    const yearData = cost.years?.find((y: any) => y.year === year);
                    return sum + (yearData?.months?.reduce((monthSum: number, monthData: any) => monthSum + (monthData.value || 0), 0) || 0);
                  }, 0);
                }, 0))}
              </div>
              <div className="text-sm text-red-700">Total Geral ({costYears.join(', ')})</div>
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button
              onClick={handleSaveCosts}
              disabled={loading}
              className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Custos'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBudgetParamsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Parâmetros para Orçamentos</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6 space-y-8">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Configurações Base para Orçamentos</h3>
            <p className="text-gray-600">Configure cargos, salários base e escalas de trabalho utilizadas nos orçamentos</p>
          </div>

          {/* Tabela de Cargos e Salários */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Cargos e Salários Base</h4>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Adicionar Cargo
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Cargo</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Salário Base (R$)</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Porteiro</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">R$ 1.412,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Controlador de Acesso</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">R$ 1.412,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Vigilante</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">R$ 1.412,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Supervisor de Segurança</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">R$ 2.000,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Auxiliar de Limpeza</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">R$ 1.412,00</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativo</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabela de Escalas de Trabalho */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Escalas de Trabalho</h4>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition-colors">
                <Plus className="w-4 h-4 inline mr-2" />
                Adicionar Escala
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Escala</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Quantidade de Pessoas</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Dias Trabalhados</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-medium text-gray-900">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">12h segunda a sexta</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">1,37</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">21</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativa</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">12x36 segunda a domingo</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">2,00</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">30,44</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativa</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">44hs segunda a sexta</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">1,00</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">22</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativa</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">44hs segunda a sábado</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">1,00</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">25</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativa</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">44hs segunda a domingo</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">1,30</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">30,44</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Ativa</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="text-blue-600 hover:text-blue-800 text-sm">Editar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Parâmetros'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const handleSaveCommissions = async () => {
    try {
      setLoading(true);
      await configurationService.updateCommissionTiers(commissionTiers);
      console.log('Comissões salvas no Supabase:', commissionTiers);
      alert('Configurações de comissão atualizadas com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar comissões:', error);
      alert('Erro ao salvar comissões. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMetrics = async () => {
    try {
      setLoading(true);
      await configurationService.updateWeeklyMetrics(weeklyMetrics);
      console.log('Métricas salvas no Supabase:', weeklyMetrics);
      alert('Métricas de performance atualizadas com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      alert('Erro ao salvar métricas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCosts = async () => {
    try {
      setLoading(true);
      await configurationService.updateOperationalCosts(operationalCosts);
      console.log('Custos salvos no Supabase:', operationalCosts);
      alert('Custos operacionais atualizados com sucesso!');
      setActiveCard(null);
    } catch (error) {
      console.error('Erro ao salvar custos:', error);
      alert('Erro ao salvar custos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const addCommissionTier = () => {
    const newTier: CommissionTier = {
      id: Date.now().toString(),
      percentage: 0.5,
      minValue: 0,
      maxValue: 100000,
      label: '0 - 100k'
    };
    setCommissionTiers([...commissionTiers, newTier]);
  };

  const removeCommissionTier = (id: string) => {
    setCommissionTiers(commissionTiers.filter(tier => tier.id !== id));
  };

  const addWeeklyMetric = () => {
    const newMetric: WeeklyMetric = {
      id: Date.now().toString(),
      name: 'Nova Métrica',
      points: 1,
      role: 'Both'
    };
    setWeeklyMetrics([...weeklyMetrics, newMetric]);
  };

  const removeWeeklyMetric = (id: string) => {
    setWeeklyMetrics(weeklyMetrics.filter(metric => metric.id !== id));
  };

  const addCostLine = () => {
    const newCost = {
      id: Date.now().toString(),
      name: 'Novo Custo',
      years: costYears.map(year => ({
        year,
        months: Array.from({ length: 12 }, (_, index) => ({
          month: index + 1,
          value: 0
        }))
      }))
    };
    setOperationalCosts([...operationalCosts, newCost]);
  };

  const removeCostLine = (id: string) => {
    setOperationalCosts(operationalCosts.filter(cost => cost.id !== id));
  };

  const updateCostName = (id: string, newName: string) => {
    setOperationalCosts(operationalCosts.map(cost => 
      cost.id === id ? { ...cost, name: newName } : cost
    ));
  };

  const updateCostValue = (costId: string, month: number, value: number) => {
    setOperationalCosts(operationalCosts.map(cost => 
      cost.id === costId 
        ? {
            ...cost,
            years: cost.years.map((yearData: any) => 
              yearData.year === selectedYear 
                ? {
                    ...yearData,
                    months: yearData.months.map((m: any) => 
                      m.month === month ? { ...m, value } : m
                    )
                  }
                : yearData
            )
          }
        : cost
    ));
  };

  const updateCostValueForYear = (costId: string, year: number, month: number, value: number) => {
    setOperationalCosts(operationalCosts.map(cost => 
      cost.id === costId 
        ? {
            ...cost,
            years: cost.years.map((yearData: any) => 
              yearData.year === year 
                ? {
                    ...yearData,
                    months: yearData.months.map((m: any) => 
                      m.month === month ? { ...m, value } : m
                    )
                  }
                : yearData
            )
          }
        : cost
    ));
  };

  const addNewYear = () => {
    const newYear = Math.max(...costYears) + 1;
    setCostYears([...costYears, newYear]);
    
    // Adicionar o novo ano a todos os custos existentes
    setOperationalCosts(operationalCosts.map(cost => ({
      ...cost,
      years: [
        ...cost.years,
        {
          year: newYear,
          months: Array.from({ length: 12 }, (_, index) => ({
            month: index + 1,
            value: 0
          }))
        }
      ]
    })));
  };
  const renderGoalsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Metas Comerciais</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Metas Mensais - {selectedYear}</h3>
            <p className="text-gray-600">Configure o valor de contratos que deve ser fechado em cada mês</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {editingGoals.map((goal) => (
              <div key={goal.month} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {goal.monthName}
                </label>
                <input
                  type="number"
                  value={goal.targetValue}
                  onChange={(e) => {
                    handleGoalChange(goal.month, Number(e.target.value) || 0);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="300000"
                  min="0"
                  step="1000"
                />
                <div className="text-xs text-gray-500 mt-1">
                  {formatCurrency(goal.targetValue)}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-blue-900 mb-2">Resumo Anual</h4>
            <div className="text-sm text-blue-800">
              <p>Total anual: {formatCurrency(editingGoals.reduce((sum, g) => sum + g.targetValue, 0))}</p>
              <p>Média mensal: {formatCurrency(editingGoals.reduce((sum, g) => sum + g.targetValue, 0) / 12)}</p>
              <p>Ano: {selectedYear}</p>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveGoals}
              disabled={loading || goalsLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading || goalsLoading ? 'Salvando...' : 'Salvar Metas'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCommissionsCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Comissões</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Faixas de Comissão</h3>
            <p className="text-gray-600">Configure as porcentagens e faixas de valor para comissões</p>
          </div>

          <div className="space-y-4 mb-6">
            {commissionTiers.map((tier, index) => (
              <div key={tier.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-3 gap-4 items-center">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      % Comissão
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={tier.percentage}
                      onChange={(e) => {
                        const newTiers = commissionTiers.map(t => 
                          t.id === tier.id 
                            ? { ...t, percentage: Number(e.target.value) }
                            : t
                        );
                        setCommissionTiers(newTiers);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Faixa de Valor
                    </label>
                    <input
                      type="text"
                      value={tier.label}
                      onChange={(e) => {
                        const newTiers = commissionTiers.map(t => 
                          t.id === tier.id 
                            ? { ...t, label: e.target.value }
                            : t
                        );
                        setCommissionTiers(newTiers);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0 - 600k"
                    />
                  </div>

                  <div className="flex justify-end">
                    {commissionTiers.length > 1 && (
                      <button
                        onClick={() => removeCommissionTier(tier.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addCommissionTier}
            className="w-full mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Faixa</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveCommissions}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Comissões'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmployeesCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Funcionários</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <EmployeeManagement />
        </div>
      </div>
    </div>
  );

  const renderUsersCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-7xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Gerenciar Usuários</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <UserManagement />
        </div>
      </div>
    </div>
  );

  const renderPerformanceCard = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Configurar Performance Semanal</h2>
          <button
            onClick={() => setActiveCard(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Métricas de Performance</h3>
            <p className="text-gray-600">Configure as métricas e seus pesos para avaliação semanal</p>
          </div>

          <div className="space-y-4 mb-6">
            {weeklyMetrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-4 gap-4 items-center">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Métrica
                    </label>
                    <input
                      type="text"
                      value={metric.name}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m => 
                          m.id === metric.id 
                            ? { ...m, name: e.target.value }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pontos
                    </label>
                    <input
                      type="number"
                      value={metric.points}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m => 
                          m.id === metric.id 
                            ? { ...m, points: Number(e.target.value) }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Função
                    </label>
                    <select
                      value={metric.role}
                      onChange={(e) => {
                        const newMetrics = weeklyMetrics.map(m => 
                          m.id === metric.id 
                            ? { ...m, role: e.target.value as 'Closer' | 'SDR' | 'Both' }
                            : m
                        );
                        setWeeklyMetrics(newMetrics);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Closer">Closer</option>
                      <option value="SDR">SDR</option>
                      <option value="Both">Ambos</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => removeWeeklyMetric(metric.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addWeeklyMetric}
            className="w-full mb-6 border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Nova Métrica</span>
          </button>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h4 className="font-medium text-green-900 mb-2">Resumo das Métricas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm text-green-800">
              <div>
                <p><strong>Closers:</strong> {weeklyMetrics.filter(m => m.role === 'Closer' || m.role === 'Both').length} métricas</p>
                <p><strong>SDRs:</strong> {weeklyMetrics.filter(m => m.role === 'SDR' || m.role === 'Both').length} métricas</p>
              </div>
              <div>
                <p><strong>Total de pontos possíveis (Closer):</strong> {weeklyMetrics.filter(m => m.role === 'Closer' || m.role === 'Both').reduce((sum, m) => sum + m.points, 0)}</p>
                <p><strong>Total de pontos possíveis (SDR):</strong> {weeklyMetrics.filter(m => m.role === 'SDR' || m.role === 'Both').reduce((sum, m) => sum + m.points, 0)}</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={handleSaveMetrics}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Salvando...' : 'Salvar Métricas'}
            </button>
            <button
              onClick={() => setActiveCard(null)}
              disabled={loading}
              className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center space-x-4">
        {activeSection && (
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {activeSection ? getSectionTitle(activeSection) : 'Configurações'}
          </h1>
          <p className="text-gray-600">
            {activeSection ? getSectionDescription(activeSection) : (
              canEditSettings 
                ? 'Gerencie funcionários, usuários e configurações do sistema'
                : 'Visualize as configurações do sistema (somente leitura)'
            )}
          </p>
        </div>
      </div>

      {canViewSettings && !canEditSettings && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Modo Somente Leitura</h3>
              <p className="text-sm text-yellow-700">
                Para editar configurações, mude para o modo administrativo na barra lateral.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Budget Parameters - Available for both versions */}
      <BudgetParametersCard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Botão 1 - Meta */}
        <button
          onClick={() => canViewSettings && setActiveCard('goals')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Meta Comercial</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure as metas mensais de vendas' : 'Visualizar metas mensais'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 2 - Comissões */}
        <button
          onClick={() => canViewSettings && setActiveCard('commissions')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Comissões</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure faixas e percentuais de comissão' : 'Visualizar configurações de comissão'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 3 - Funcionários */}
        <button
          onClick={() => canViewSettings && setActiveCard('employees')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Funcionários</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Gerencie cadastro de funcionários' : 'Visualizar funcionários'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 4 - Performance Semanal */}
        <button
          onClick={() => canViewSettings && setActiveCard('performance')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Semanal</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure métricas e pesos de avaliação' : 'Visualizar métricas de performance'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 5 - Gerenciar Usuários */}
        <button
          onClick={() => canViewSettings && setActiveCard('users')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gerenciar Usuários</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure usuários e permissões' : 'Visualizar usuários'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 6 - Custos Operacionais */}
        <button
          onClick={() => canViewSettings && setActiveCard('costs')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Custos Operacionais</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure custos mensais para CAC' : 'Visualizar custos operacionais'}
              </p>
            </div>
          </div>
        </button>

        {/* Botão 7 - Parâmetros para Orçamentos */}
        <button
          onClick={() => canViewSettings && setActiveCard('budget-params')}
          className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-shadow text-left ${
            canViewSettings ? 'hover:shadow-md cursor-pointer' : 'cursor-not-allowed opacity-75'
          }`}
          disabled={!canViewSettings}
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Parâmetros para Orçamentos</h3>
              <p className="text-gray-600">
                {canEditSettings ? 'Configure cargos e escalas para orçamentos' : 'Visualizar parâmetros de orçamento'}
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Modais */}
      {activeCard === 'goals' && renderGoalsCard()}
      {activeCard === 'commissions' && renderCommissionsCard()}
      {activeCard === 'employees' && renderEmployeesCard()}
      {activeCard === 'users' && renderUsersCard()}
      {activeCard === 'performance' && renderPerformanceCard()}
      {activeCard === 'costs' && renderCostsCard()}
      {activeCard === 'budget-params' && renderBudgetParamsCard()}
    </div>
  );

  function getSectionTitle(section: string): string {
    switch (section) {
      case 'employees': return 'Gerenciar Funcionários';
      case 'users': return 'Gerenciar Usuários';
      case 'profile': return 'Configurações do Perfil';
      case 'goals': return 'Metas Mensais';
      case 'commissions': return 'Configuração de Comissões';
      case 'weekly-metrics': return 'Métricas Semanais';
      case 'operational-costs': return 'Custos Operacionais';
      case 'budget-params': return 'Parâmetros para Orçamentos';
      default: return 'Configurações';
    }
  }

  function getSectionDescription(section: string): string {
    switch (section) {
      case 'employees': return 'Adicione, edite e gerencie SDRs e Closers';
      case 'users': return 'Controle de acesso e permissões do sistema';
      case 'profile': return 'Gerencie suas informações pessoais e configurações de conta';
      case 'goals': return 'Configure metas mensais de vendas por ano';
      case 'commissions': return 'Defina escalas e percentuais de comissão';
      case 'weekly-metrics': return 'Configure pontuação e pesos das métricas semanais';
      case 'operational-costs': return 'Gerencie custos operacionais mensais';
      case 'budget-params': return 'Configure cargos e escalas utilizados nos orçamentos';
      default: return '';
    }
  }
};