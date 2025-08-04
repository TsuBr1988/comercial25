import React, { useState } from 'react';
import { Calendar, TrendingUp, Save, RotateCcw, X } from 'lucide-react';
import { useSupabaseQuery, useSupabaseInsert, useSupabaseUpdate } from '../../hooks/useSupabase';
import { WeeklyData } from '../../types';
import { WeeklyChart } from './WeeklyChart';
import { supabase } from '../../lib/supabase';
import { useSystemVersion } from '../../contexts/SystemVersionContext';
import { useYear } from '../../contexts/YearContext';
import { formatTimestampForDb, displayDate, getCurrentDateForInput, isValidDate } from '../../utils/dateUtils';

// Métricas por função
const CLOSER_METRICS = [
  { id: 'pontosEducacao', name: 'Pontos de educação', points: 1 },
  { id: 'propostasApresentadas', name: 'Propostas apresentadas', points: 1 },
  { id: 'contratoAssinado', name: 'Contrato assinado', points: 1 }
];

const SDR_METRICS = [
  { id: 'pontosEducacao', name: 'Pontos de educação', points: 1 },
  { id: 'mql', name: 'MQL', points: 1 },
  { id: 'visitasAgendadas', name: 'Visitas agendadas', points: 1 }
];

// Gerar datas das sextas-feiras das últimas 12 semanas (base)
const generateBaseFridays = () => {
  const weeks = [];
  
  // Encontrar a sexta-feira mais recente (ou hoje se hoje for sexta)
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Domingo, 1 = Segunda, ..., 5 = Sexta, 6 = Sábado
  
  // Calcular quantos dias precisamos voltar para chegar na sexta mais recente
  const daysToLastFriday = currentDay >= 5 ? currentDay - 5 : currentDay + 2;
  
  const lastFriday = new Date(today);
  lastFriday.setDate(today.getDate() - daysToLastFriday);
  
  // Gerar as últimas 12 sextas-feiras (incluindo a mais recente)
  for (let i = 11; i >= 0; i--) {
    const friday = new Date(lastFriday);
    friday.setDate(lastFriday.getDate() - (i * 7)); // Subtrair 7 dias para cada semana anterior
    weeks.push(friday.toISOString().split('T')[0]);
  }
  
  return weeks;
};

// Combinar sextas-feiras automáticas com datas customizadas do banco
const generateAllWeeks = (weeklyPerformanceData: any[], selectedYear: number) => {
  // 1. Gerar sextas-feiras base
  const baseFridays = generateBaseFridays();
  
  // 2. Extrair todas as datas únicas do banco (filtradas pelo ano)
  const allDatesFromDB = weeklyPerformanceData
    .map(record => record.week_ending_date)
    .filter(date => {
      const dateYear = new Date(date).getFullYear();
      return dateYear === selectedYear;
    });
  
  // 3. Combinar todas as datas (base + customizadas)
  const allDates = [...new Set([...baseFridays, ...allDatesFromDB])];
  
  // 4. Ordenar cronologicamente (mais antiga para mais recente)
  return allDates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
};

export const WeeklyPerformance: React.FC = () => {
  const { selectedYear } = useYear();
  const [weeks, setWeeks] = useState<string[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyData[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddDayModal, setShowAddDayModal] = useState(false);
  const [newDayDate, setNewDayDate] = useState('');
  const [addDayError, setAddDayError] = useState('');
  
  const { canEdit, canView } = useSystemVersion();
  const canEditPerformance = canEdit('weekly-performance');
  const canViewPerformance = canView('weekly-performance');
  
  // Otimizar query de funcionários
  const { data: employees = [], loading } = useSupabaseQuery('employees', {
    select: 'id, name, avatar, role',
    orderBy: { column: 'name', ascending: true }
  });
  
  // Otimizar query de performance
  const { data: weeklyPerformanceDB = [], loading: performanceLoading, refetch: refetchPerformance } = useSupabaseQuery('weekly_performance', {
    select: 'employee_id, week_ending_date, tarefas, pontos_educacao, propostas_apresentadas, contrato_assinado, mql, visitas_agendadas, total_points',
    orderBy: { column: 'week_ending_date', ascending: false }
  });
  
  const { insert: insertWeeklyPerformance, upsert: upsertWeeklyPerformance } = useSupabaseInsert('weekly_performance');
  const { update: updateWeeklyPerformance } = useSupabaseUpdate('weekly_performance');

  // Atualizar weeks quando dados do banco ou ano mudarem
  React.useEffect(() => {
    if (weeklyPerformanceDB.length >= 0) { // >= 0 para executar mesmo sem dados
      const allWeeks = generateAllWeeks(weeklyPerformanceDB, selectedYear);
      console.log('🔄 Atualizando weeks com dados do banco:', {
        baseFridays: generateBaseFridays().length,
        datesFromDB: weeklyPerformanceDB
          .filter(record => new Date(record.week_ending_date).getFullYear() === selectedYear)
          .length,
        totalWeeks: allWeeks.length,
        selectedYear,
        allWeeks
      });
      setWeeks(allWeeks);
    }
  }, [weeklyPerformanceDB, selectedYear]);

  // Carregar dados do banco quando disponível
  React.useEffect(() => {
    if (weeklyPerformanceDB.length > 0 && employees.length > 0) {
      // Filtrar dados do ano selecionado
      const yearFilteredData = weeklyPerformanceDB.filter(dbRecord => {
        const weekDate = new Date(dbRecord.week_ending_date);
        return weekDate.getFullYear() === selectedYear;
      });
      
      const formattedData: WeeklyData[] = yearFilteredData.map(dbRecord => ({
        employeeId: dbRecord.employee_id,
        weekEndingDate: dbRecord.week_ending_date,
        metrics: {
          tarefas: dbRecord.tarefas || 0,
          pontosEducacao: dbRecord.pontos_educacao || 0,
          propostasApresentadas: dbRecord.propostas_apresentadas || 0,
          contratoAssinado: dbRecord.contrato_assinado || 0,
          mql: dbRecord.mql || 0,
          visitasAgendadas: dbRecord.visitas_agendadas || 0,
        },
        totalPoints: dbRecord.total_points || 0
      }));
      setWeeklyData(formattedData);
    }
  }, [weeklyPerformanceDB, employees, selectedYear]); // Adicionar selectedYear como dependência

  if (loading || performanceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Filtrar funcionários por função (excluir Admin)
  const closers = employees.filter(emp => emp.role === 'Closer');
  const sdrs = employees.filter(emp => emp.role === 'SDR');

  if (closers.length === 0 && sdrs.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
        <p className="text-gray-500">Cadastre Closers e SDRs na aba "Funcionários" para acompanhar a performance semanal</p>
      </div>
    );
  }

  const calculateTotalPoints = (metrics: any, employeeRole: string) => {
    const roleMetrics = employeeRole === 'Closer' ? CLOSER_METRICS : SDR_METRICS;
    return roleMetrics.reduce((total, metric) => {
      const value = metrics[metric.id] || 0;
      return total + (value * metric.points);
    }, 0);
  };

  const getEmployeeWeekData = (employeeId: string, week: string): WeeklyData | null => {
    return weeklyData.find(data => data.employeeId === employeeId && data.weekEndingDate === week) || null;
  };

  const updateMetric = (employeeId: string, week: string, metricId: string, value: number, employeeRole: string) => {
    setWeeklyData(prev => {
      const existingIndex = prev.findIndex(data => 
        data.employeeId === employeeId && data.weekEndingDate === week
      );

      // Inicializar métricas baseado na função
      const roleMetrics = employeeRole === 'Closer' ? CLOSER_METRICS : SDR_METRICS;
      const initialMetrics: any = {};
      roleMetrics.forEach(metric => {
        initialMetrics[metric.id] = 0;
      });

      const newMetrics = {
        ...initialMetrics,
        ...(existingIndex >= 0 ? prev[existingIndex].metrics : {}),
        [metricId]: value
      };

      const newData: WeeklyData = {
        employeeId,
        weekEndingDate: week,
        metrics: newMetrics,
        totalPoints: calculateTotalPoints(newMetrics, employeeRole)
      };

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = newData;
        return updated;
      } else {
        return [...prev, newData];
      }
    });
    
    setHasChanges(true);
  };

  const handleCellChange = (employeeId: string, week: string, metricId: string, value: string, employeeRole: string) => {
    const numValue = parseInt(value) || 0;
    updateMetric(employeeId, week, metricId, numValue, employeeRole);
    setHasChanges(true);
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    
    try {
      console.log('Salvando dados de performance semanal...', weeklyData);
      
      // Processar cada registro de performance
      for (const data of weeklyData) {
        // Preparar dados para o banco
        const dbData = {
          employee_id: data.employeeId,
          week_ending_date: data.weekEndingDate, // Usar data exata sem formatação
          tarefas: data.metrics.tarefas || 0,
          pontos_educacao: data.metrics.pontosEducacao || 0,
          propostas_apresentadas: data.metrics.propostasApresentadas || 0,
          contrato_assinado: data.metrics.contratoAssinado || 0,
          mql: data.metrics.mql || 0,
          visitas_agendadas: data.metrics.visitasAgendadas || 0,
          // total_points será calculado automaticamente pelo trigger no banco
        };

        console.log('Fazendo upsert para:', data.employeeId, 'Data original:', data.weekEndingDate, 'Dados:', dbData);
        
        const { error: upsertError } = await supabase
          .from('weekly_performance')
          .upsert(dbData, { 
            onConflict: 'employee_id,week_ending_date' 
          });

        if (upsertError) {
          console.error('Erro ao fazer upsert da performance:', upsertError);
          throw upsertError;
        }
      }

      // Recarregar dados do banco
      await refetchPerformance();
      
      console.log('Todos os dados salvos com sucesso!');
      setIsSaving(false);
      setHasChanges(false);
      alert('Todas as alterações foram salvas com sucesso!');
      
    } catch (error) {
      console.error('Erro ao salvar dados:', error);
      setIsSaving(false);
      
      let errorMessage = 'Erro desconhecido ao salvar dados.';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as any).message;
      }
      
      alert(`Erro ao salvar dados: ${errorMessage}`);
    }
  };

  const handleResetChanges = () => {
    if (confirm('Tem certeza que deseja descartar todas as alterações não salvas?')) {
      // Recarregar dados originais do banco
      refetchPerformance();
      setHasChanges(false);
    }
  };

  const handleAddDay = () => {
    setShowAddDayModal(true);
    setNewDayDate('');
    setAddDayError('');
  };

  const validateAndAddDay = () => {
    if (!newDayDate) {
      setAddDayError('Por favor, selecione uma data');
      return;
    }

    if (!isValidDate(newDayDate)) {
      setAddDayError('Data inválida');
      return;
    }

    const selectedDate = new Date(newDayDate);

    // Verificar se o dia já existe
    if (weeks.includes(newDayDate)) {
      setAddDayError('Esta data já existe na tabela');
      return;
    }

    // Verificar se é do ano selecionado
    if (selectedDate.getFullYear() !== selectedYear) {
      setAddDayError(`Por favor, selecione uma data de ${selectedYear}`);
      return;
    }

    // Adicionar nova data e ordenar (mais recente no final)
    const newDays = [...weeks, newDayDate]
      .filter((date, index, arr) => arr.indexOf(date) === index) // Remove duplicatas
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()); // Ordena cronologicamente
    
    setWeeks(newDays);
    setShowAddDayModal(false);
    setNewDayDate('');
    setAddDayError('');
    
    console.log('📅 Nova data adicionada EXATAMENTE como inserida:', {
      dataInserida: newDayDate,
      dataFormatada: displayDate(newDayDate),
      totalDatas: newDays.length,
      proximaAcao: 'Inserir dados e salvar'
    });
    
    alert(`✅ Data adicionada: ${displayDate(newDayDate)}\n\n📋 PRÓXIMOS PASSOS:\n1. Insira os dados de performance\n2. Clique em "Salvar Todas as Alterações"\n3. A data ${newDayDate} será salva EXATAMENTE como inserida\n\n⚠️ GARANTIA: Sem alteração automática de datas!`);
  };

  const handleRemoveDay = (dayToRemove: string) => {
    const confirmMessage = `Tem certeza que deseja remover o dia ${new Date(dayToRemove).toLocaleDateString('pt-BR')}?\n\nEsta ação irá:\n• Remover a coluna da tabela\n• Manter os dados no banco (não serão excluídos)\n• Ocultar o dia da visualização atual\n\nPara excluir permanentemente os dados, use a função de exclusão no banco.`;
    
    if (confirm(confirmMessage)) {
      const newDays = weeks.filter(day => day !== dayToRemove);
      setWeeks(newDays);
      
      // Remover dados do dia do estado local
      const newWeeklyData = weeklyData.filter(data => data.weekEndingDate !== dayToRemove);
      setWeeklyData(newWeeklyData);
      
      alert('Dia removido da visualização. Os dados no banco foram preservados.');
    }
  };

  const formatDate = (dateString: string) => {
    return displayDate(dateString, 'pt-BR').split('/').slice(0, 2).join('/'); // DD/MM apenas
  };

  const getEmployeeMonthlyTotal = (employeeId: string) => {
    const currentMonth = new Date().getMonth();
    const currentYear = selectedYear;
    
    return weeklyData
      .filter(data => {
        const dataDate = new Date(data.weekEndingDate);
        return data.employeeId === employeeId && 
               dataDate.getMonth() === currentMonth && 
               dataDate.getFullYear() === currentYear;
      })
      .reduce((total, data) => total + data.totalPoints, 0);
  };

  const getMonthlyLeader = () => {
    const allEmployees = [...closers, ...sdrs];
    const monthlyTotals = allEmployees.map(employee => ({
      employee,
      total: getEmployeeMonthlyTotal(employee.id)
    }));

    return monthlyTotals.reduce((leader, current) => 
      current.total > leader.total ? current : leader
    );
  };

  const monthlyLeader = getMonthlyLeader();

  const renderEmployeeSection = (employeeList: any[], sectionTitle: string, metrics: any[], sectionColor: string) => {
    if (employeeList.length === 0) return null;

    return (
      <React.Fragment>
        {/* Section Header */}
        <tr className={`${sectionColor} border-t-2 border-gray-300`}>
          <td colSpan={weeks.length + 3} className={`px-6 py-4 ${sectionColor}`}>
            <h3 className="text-lg font-bold text-gray-900">{sectionTitle}</h3>
          </td>
        </tr>

        {employeeList.map(employee => (
          <React.Fragment key={employee.id}>
            {/* Total Points Row */}
            <tr className="bg-yellow-50">
              <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-yellow-50 z-10">
                <div className="flex items-center">
                  <img
                    src={employee.avatar}
                    alt={employee.name}
                    className="w-8 h-8 rounded-full mr-3"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.role}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  Pontuação total
                </span>
              </td>
              {weeks.map(week => {
                const data = getEmployeeWeekData(employee.id, week);
                return (
                  <td key={week} className="px-4 py-4 text-center">
                    <span className="text-lg font-bold text-yellow-600">
                      {data?.totalPoints || 0}
                    </span>
                  </td>
                );
              })}
              <td className="px-6 py-4 text-center">
                <span className="text-xl font-bold text-green-600">
                  {getEmployeeMonthlyTotal(employee.id)}
                </span>
              </td>
            </tr>
            
            {/* Metric Rows */}
            {metrics.map(metric => (
              <tr key={`${employee.id}-${metric.id}`} className="hover:bg-gray-50">
                <td className="px-6 py-3 whitespace-nowrap sticky left-0 bg-white z-10"></td>
                <td className="px-6 py-3 whitespace-nowrap">
                  <span className="text-sm text-gray-900">{metric.name}</span>
                </td>
                {weeks.map(week => {
                  const data = getEmployeeWeekData(employee.id, week);
                  const value = data?.metrics[metric.id as keyof typeof data.metrics] || 0;
                  
                  return (
                    <td key={week} className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={value}
                        onChange={(e) => canEditPerformance && handleCellChange(employee.id, week, metric.id, e.target.value, employee.role)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center hover:border-blue-400 transition-colors"
                        min="0"
                        placeholder="0"
                        disabled={!canEditPerformance}
                      />
                    </td>
                  );
                })}
                <td className="px-6 py-3 text-center">
                  <span className="text-sm font-medium text-gray-900">
                    {weeklyData
                      .filter(data => {
                        const dataDate = new Date(data.weekEndingDate);
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        return data.employeeId === employee.id && 
                               dataDate.getMonth() === currentMonth && 
                               dataDate.getFullYear() === currentYear;
                      })
                      .reduce((total, data) => total + (data.metrics[metric.id as keyof typeof data.metrics] || 0), 0)
                    }
                  </span>
                </td>
              </tr>
            ))}
          </React.Fragment>
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Semanal {selectedYear}</h1>
          <p className="text-gray-600">
            {canViewPerformance && canEditPerformance 
              ? `Acompanhe a performance detalhada por função e semana para ${selectedYear}`
              : canViewPerformance
              ? `Visualize a performance detalhada por função e semana para ${selectedYear} (somente leitura)`
              : `Acesso restrito à performance semanal`
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {canViewPerformance && canEditPerformance && (
            <button
              onClick={handleAddDay}
              className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>adicionar dia</span>
            </button>
          )}
          {canViewPerformance && hasChanges && canEditPerformance && (
            <div className="flex items-center space-x-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span>Alterações não salvas</span>
            </div>
          )}
          {canViewPerformance && !canEditPerformance && (
            <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Modo Somente Leitura</span>
            </div>
          )}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <div className="text-sm font-medium text-green-800">Líder do Mês</div>
                <div className="text-lg font-bold text-green-900">
                  {monthlyLeader.employee.name} - {monthlyLeader.total} pts
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Legend */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-4">Indicadores do Mês Atual ({selectedYear})</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Closers Section */}
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-3">Closers - Semana Atual</h4>
            <div className="grid grid-cols-2 gap-2">
              {closers.map(closer => {
                // Calcular métricas da semana atual
                const currentWeek = weeks[weeks.length - 1]; // Última semana
                const weekData = getEmployeeWeekData(closer.id, currentWeek);
                const propostas = weekData?.metrics.propostasApresentadas || 0;
                const contratos = weekData?.metrics.contratoAssinado || 0;
                
                return (
                  <React.Fragment key={closer.id}>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">{closer.name}</div>
                      <div className="text-sm font-medium text-gray-900">Propostas apresentadas</div>
                      <div className="text-2xl font-bold text-blue-600">{propostas}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">{closer.name}</div>
                      <div className="text-sm font-medium text-gray-900">Contrato assinado</div>
                      <div className="text-2xl font-bold text-blue-600">{contratos}</div>
                    </div>
                  </React.Fragment>
                );
              })}
              {closers.length === 0 && (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  Nenhum Closer cadastrado
                </div>
              )}
            </div>
          </div>
          
          {/* SDRs Section */}
          <div>
            <h4 className="text-sm font-medium text-green-900 mb-3">SDRs - Mês Atual</h4>
            <div className="grid grid-cols-2 gap-2">
              {sdrs.map(sdr => {
                // Calcular métricas do mês atual
                const currentMonth = new Date().getMonth();
                const currentYear = selectedYear;
                
                const monthlyMQL = weeklyData
                  .filter(data => {
                    const dataDate = new Date(data.weekEndingDate);
                    return data.employeeId === sdr.id && 
                           dataDate.getMonth() === currentMonth && 
                           dataDate.getFullYear() === currentYear;
                  })
                  .reduce((total, data) => total + (data.metrics.mql || 0), 0);
                
                const monthlyVisitas = weeklyData
                  .filter(data => {
                    const dataDate = new Date(data.weekEndingDate);
                    return data.employeeId === sdr.id && 
                           dataDate.getMonth() === currentMonth && 
                           dataDate.getFullYear() === currentYear;
                  })
                  .reduce((total, data) => total + (data.metrics.visitasAgendadas || 0), 0);
                
                return (
                  <React.Fragment key={sdr.id}>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">{sdr.name}</div>
                      <div className="text-sm font-medium text-gray-900">MQL do mês</div>
                      <div className="text-2xl font-bold text-green-600">{monthlyMQL}</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-200">
                      <div className="text-xs font-medium text-gray-500 mb-1">{sdr.name}</div>
                      <div className="text-sm font-medium text-gray-900">Visitas agendadas</div>
                      <div className="text-2xl font-bold text-green-600">{monthlyVisitas}</div>
                    </div>
                  </React.Fragment>
                );
              })}
              {sdrs.length === 0 && (
                <div className="col-span-2 text-center py-4 text-gray-500">
                  Nenhum SDR cadastrado
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Performance Chart */}
      <WeeklyChart weeklyData={weeklyData} weeks={weeks} employees={[...closers, ...sdrs]} />

      {/* Performance Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Tabela de Performance por Função ({selectedYear})</h2>
            <div className="text-sm text-gray-600">
              📅 {weeks.length} datas • 
              🤖 {generateBaseFridays().filter(date => new Date(date).getFullYear() === selectedYear).length} sextas automáticas • 
              ➕ {weeks.length - generateBaseFridays().filter(date => new Date(date).getFullYear() === selectedYear).length} datas customizadas
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto max-h-[80vh] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                  Funcionário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Métrica
                </th>
                {weeks.map(week => (
                  <th key={week} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] bg-gray-50">
                    <div className="flex flex-col items-center space-y-1">
                      <span>{formatDate(week)}</span>
                      {canEditPerformance && (
                        <button
                          onClick={() => handleRemoveDay(week)}
                          className="text-xs text-red-500 hover:text-red-700 transition-colors"
                          title="Remover este dia"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </th>
                ))}
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                  Total Mês
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* Closers Section */}
              {renderEmployeeSection(closers, 'CLOSERS', CLOSER_METRICS, 'bg-blue-50')}
              
              {/* SDRs Section */}
              {renderEmployeeSection(sdrs, 'SDRs', SDR_METRICS, 'bg-green-50')}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Controls */}
      <div className={`border rounded-xl p-6 ${
        !canEditPerformance ? 'bg-blue-50 border-blue-200' :
        hasChanges ? 'bg-orange-50 border-orange-200' : 'bg-green-50 border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              !canEditPerformance ? 'bg-blue-500' :
              hasChanges ? 'bg-orange-500 animate-pulse' : 'bg-green-500'
            }`}></div>
            <div>
              <h3 className={`text-lg font-semibold ${
                !canEditPerformance ? 'text-blue-900' :
                hasChanges ? 'text-orange-900' : 'text-green-900'
              }`}>
                {!canEditPerformance ? 'Modo Somente Leitura' :
                 hasChanges ? 'Alterações Pendentes' : 'Dados Salvos'}
              </h3>
              <p className={`text-sm ${
                !canEditPerformance ? 'text-blue-700' :
                hasChanges ? 'text-orange-700' : 'text-green-700'
              }`}>
                {!canEditPerformance ? 'Para editar, mude para o modo administrativo' :
                 hasChanges ? 'Clique em "Salvar Todas as Alterações" para persistir no banco' : 'Todos os dados estão sincronizados'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {hasChanges && canEditPerformance ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleResetChanges}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Descartar</span>
                </button>
                <button
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Salvando...' : 'Salvar Todas as Alterações'}</span>
                </button>
              </div>
            ) : canEditPerformance ? (
              <div className="text-sm text-green-700">
                ✅ Pontuação atualizada em tempo real<br/>
                📊 Gráfico sincronizado automaticamente<br/>
                💾 Dados persistidos no banco
              </div>
            ) : (
              <div className="text-sm text-blue-700">
                👁️ Visualização dos dados<br/>
                📊 Gráfico atualizado automaticamente<br/>
                🔒 Edição requer modo administrativo
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Day Modal */}
      {showAddDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Adicionar Nova Data</h3>
              <button
                onClick={() => setShowAddDayModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione a data
                </label>
                <input
                  type="date"
                  value={newDayDate}
                  onChange={(e) => {
                    setNewDayDate(e.target.value);
                    setAddDayError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
                {addDayError && (
                  <p className="mt-1 text-sm text-red-600">{addDayError}</p>
                )}
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAddDayModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={validateAndAddDay}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};