import React from 'react';
import { Trophy, Star, Target, Calendar, CheckCircle, FileText, Handshake, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { useYear } from '../../contexts/YearContext';

interface GamePoints {
  tasks: number;
  meetings: number;
  proposals: number;
  closedDeals: number;
  total: number;
}

interface EmployeeScore {
  employee: any;
  points: GamePoints;
  rank: number;
}

export const EmployeeOfMonth: React.FC = () => {
  const { selectedYear } = useYear();
  // Otimizar query de funcionários
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees', {
    select: 'id, name, avatar, role, department',
    orderBy: { column: 'name', ascending: true }
  });
  
  // Otimizar query de performance
  const { data: weeklyPerformanceData = [], loading: performanceLoading } = useSupabaseQuery('weekly_performance', {
    select: 'employee_id, week_ending_date, total_points, tarefas, propostas_apresentadas, contrato_assinado, mql, visitas_agendadas',
    orderBy: { column: 'week_ending_date', ascending: false }
  });

  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [historyStartIndex, setHistoryStartIndex] = React.useState(0);

  const selectedMonth = selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  if (employeesLoading || performanceLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum funcionário cadastrado</h3>
        <p className="text-gray-500">Cadastre funcionários na aba "Funcionários" para ver o ranking mensal</p>
      </div>
    );
  }

  // Calculate monthly totals from weekly performance data
  const calculateMonthlyTotals = (targetDate: Date) => {
    // Garantir que estamos sempre calculando para o ano selecionado
    const adjustedDate = new Date(selectedYear, targetDate.getMonth(), 1);
    const monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    const employeeScores: { [key: string]: GamePoints } = {};

    // Initialize all employees with zero scores
    employees.forEach(employee => {
      employeeScores[employee.id] = {
        tasks: 0,
        meetings: 0,
        proposals: 0,
        closedDeals: 0,
        total: 0
      };
    });

    // Sum up weekly performance data for current month
    weeklyPerformanceData.forEach(weekData => {
      const weekDate = new Date(weekData.week_ending_date);
      
      // Check if this week is in the current month
      if (weekDate >= monthStart && weekDate <= monthEnd) {
        if (employeeScores[weekData.employee_id]) {
          const employee = employees.find(emp => emp.id === weekData.employee_id);
          
          if (employee?.role === 'Closer') {
            // Closer metrics
            employeeScores[weekData.employee_id].tasks += weekData.tarefas || 0;
            employeeScores[weekData.employee_id].proposals += weekData.propostas_apresentadas || 0;
            employeeScores[weekData.employee_id].closedDeals += weekData.contrato_assinado || 0;
          } else if (employee?.role === 'SDR') {
            // SDR metrics - mapping to similar categories
            employeeScores[weekData.employee_id].tasks += weekData.tarefas || 0;
            employeeScores[weekData.employee_id].meetings += weekData.mql || 0;
            employeeScores[weekData.employee_id].proposals += weekData.visitas_agendadas || 0;
            employeeScores[weekData.employee_id].closedDeals += 0; // SDRs don't close deals directly
          }
          
          // Use the calculated total_points from the database
          employeeScores[weekData.employee_id].total += weekData.total_points || 0;
        }
      }
    });

    return employeeScores;
  };

  const monthlyScores = calculateMonthlyTotals(selectedDate);

  // Generate scoring data based on real performance data
  const generateScoring = (): EmployeeScore[] => {
    return employees.map(employee => {
      const scores = monthlyScores[employee.id] || {
        tasks: 0,
        meetings: 0,
        proposals: 0,
        closedDeals: 0,
        total: 0
      };

      return {
        employee,
        points: scores,
        rank: 1 // Will be set after sorting
      };
    }).sort((a, b) => b.points.total - a.points.total)
      .map((score, index) => ({ ...score, rank: index + 1 }));
  };

  // Get available months from performance data
  const getAvailableMonths = () => {
    const months = new Set<string>();
    weeklyPerformanceData.forEach(weekData => {
      const date = new Date(weekData.week_ending_date);
      // Apenas meses do ano selecionado
      if (date.getFullYear() === selectedYear) {
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        months.add(monthKey);
      }
    });
    
    return Array.from(months)
      .map(monthKey => {
        const [year, month] = monthKey.split('-');
        return new Date(parseInt(year), parseInt(month), 1);
      })
      .sort((a, b) => b.getTime() - a.getTime()); // Most recent first
  };

  const availableMonths = getAvailableMonths();

  // Generate historical winners
  const getHistoricalWinners = () => {
    return availableMonths.map(monthDate => {
      const monthScores = calculateMonthlyTotals(monthDate);
      const monthScoring = employees.map(employee => {
        const scores = monthScores[employee.id] || {
          tasks: 0,
          meetings: 0,
          proposals: 0,
          closedDeals: 0,
          total: 0
        };

        return {
          employee,
          points: scores,
          rank: 1
        };
      }).sort((a, b) => b.points.total - a.points.total);

      return {
        month: monthDate,
        winner: monthScoring[0] || null,
        monthLabel: monthDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
      };
    });
  };

  const historicalWinners = getHistoricalWinners();
  const visibleHistory = historicalWinners.slice(historyStartIndex, historyStartIndex + 4);

  const scoring = generateScoring();
  const winner = scoring[0] || {
    employee: { name: 'Nenhum funcionário', avatar: '', position: '', id: '0' },
    points: { tasks: 0, meetings: 0, proposals: 0, closedDeals: 0, total: 0 },
    rank: 1
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2: return <Star className="w-6 h-6 text-gray-400" />;
      case 3: return <Target className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold">{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600';
      case 2: return 'from-gray-300 to-gray-500';
      case 3: return 'from-amber-400 to-amber-600';
      default: return 'from-gray-200 to-gray-400';
    }
  };

  const hasPerformanceData = weeklyPerformanceData.length > 0;

  const handlePreviousMonth = () => {
    const currentIndex = availableMonths.findIndex(
      month => month.getTime() === selectedDate.getTime()
    );
    if (currentIndex < availableMonths.length - 1) {
      setSelectedDate(availableMonths[currentIndex + 1]);
    }
  };

  const handleNextMonth = () => {
    const currentIndex = availableMonths.findIndex(
      month => month.getTime() === selectedDate.getTime()
    );
    if (currentIndex > 0) {
      setSelectedDate(availableMonths[currentIndex - 1]);
    }
  };

  const handleHistoryPrevious = () => {
    if (historyStartIndex > 0) {
      setHistoryStartIndex(historyStartIndex - 1);
    }
  };

  const handleHistoryNext = () => {
    if (historyStartIndex < historicalWinners.length - 4) {
      setHistoryStartIndex(historyStartIndex + 1);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Month Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Selecionar Mês ({selectedYear})</h2>
            <p className="text-gray-600">Escolha o mês para ver o destaque</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={handlePreviousMonth}
              disabled={availableMonths.findIndex(m => m.getTime() === selectedDate.getTime()) >= availableMonths.length - 1}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="text-center min-w-[200px]">
              <div className="text-xl font-bold text-gray-900 capitalize">{selectedMonth}</div>
              <div className="text-sm text-gray-500">
                {availableMonths.findIndex(m => m.getTime() === selectedDate.getTime()) + 1} de {availableMonths.length} meses
              </div>
            </div>
            
            <button
              onClick={handleNextMonth}
              disabled={availableMonths.findIndex(m => m.getTime() === selectedDate.getTime()) <= 0}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {!hasPerformanceData && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold text-blue-900">Dados de Performance Necessários</h3>
              <p className="text-blue-800">
                Para ver o ranking do mês, adicione dados na aba "Performance Semanal". 
                Os pontos serão calculados automaticamente baseados nas métricas inseridas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Winner Highlight */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-xl p-8">
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">Destaque do Mês</h2>
          </div>
          <p className="text-gray-600 capitalize">{selectedMonth}</p>
        </div>

        <div className="flex items-center justify-center space-x-6 mb-6">
          <div className="text-center">
            <div className="relative">
              <img
                src={winner.employee.avatar || 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop'}
                alt={winner.employee.name}
                className="w-24 h-24 rounded-full border-4 border-yellow-400 shadow-lg"
              />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mt-3">{winner.employee.name}</h3>
            <p className="text-gray-600">{winner.employee.role} • {winner.employee.department}</p>
          </div>
          
          <div className="text-center">
            <div className="text-4xl font-bold text-yellow-600 mb-2">
              {winner.points.total}
            </div>
            <div className="text-gray-600">pontos totais</div>
            <div className="text-sm text-gray-500 mt-1">
              {hasPerformanceData ? 'Baseado na performance semanal' : 'Aguardando dados de performance'}
            </div>
          </div>
        </div>

        {/* Winner's Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Propostas Apresentadas (Closer) */}
          <div className="bg-white rounded-lg p-4 text-center border border-yellow-200">
            <FileText className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {winner.employee.role === 'Closer' ? winner.points.proposals : '—'}
            </div>
            <div className="text-sm text-gray-600">Propostas Apresentadas</div>
            <div className="text-xs text-gray-500 mt-1">(Closers)</div>
          </div>
          
          {/* Card 2: Contrato Assinado (Closer) */}
          <div className="bg-white rounded-lg p-4 text-center border border-yellow-200">
            <Handshake className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {winner.employee.role === 'Closer' ? winner.points.closedDeals : '—'}
            </div>
            <div className="text-sm text-gray-600">Contrato Assinado</div>
            <div className="text-xs text-gray-500 mt-1">(Closers)</div>
          </div>
          
          {/* Card 3: MQL (SDR) */}
          <div className="bg-white rounded-lg p-4 text-center border border-yellow-200">
            <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {winner.employee.role === 'SDR' ? winner.points.meetings : '—'}
            </div>
            <div className="text-sm text-gray-600">MQL</div>
            <div className="text-xs text-gray-500 mt-1">(SDRs)</div>
          </div>
          
          {/* Card 4: Visitas Agendadas (SDR) */}
          <div className="bg-white rounded-lg p-4 text-center border border-yellow-200">
            <Calendar className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-lg font-bold text-gray-900">
              {winner.employee.role === 'SDR' ? winner.points.proposals : '—'}
            </div>
            <div className="text-sm text-gray-600">Visitas Agendadas</div>
            <div className="text-xs text-gray-500 mt-1">(SDRs)</div>
          </div>
        </div>
      </div>

      {/* Full Ranking */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ranking Completo - {selectedMonth} {selectedYear}</h3>
        
        <div className="space-y-4">
          {scoring.map((score) => (
            <div key={score.employee.id} className="flex items-center space-x-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${getRankColor(score.rank)} flex items-center justify-center`}>
                {getRankIcon(score.rank)}
              </div>
              
              <img
                src={score.employee.avatar}
                alt={score.employee.name}
                className="w-12 h-12 rounded-full"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-lg font-medium text-gray-900">{score.employee.name}</h4>
                  <span className="text-sm text-gray-500">#{score.rank}</span>
                </div>
                <p className="text-sm text-gray-600">{score.employee.role} • {score.employee.department}</p>
                
                {/* Mini score breakdown */}
                <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                  <span>{score.points.tasks} tarefas</span>
                  <span>{score.points.meetings} conexões</span>
                  <span>{score.points.proposals} propostas</span>
                  <span>{score.points.closedDeals} fechamentos</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-gray-900">{score.points.total}</div>
                <div className="text-sm text-gray-500">pontos</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Winners */}
      {historicalWinners.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Histórico de Destaques</h3>
              <p className="text-gray-600">Vencedores dos meses anteriores</p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleHistoryPrevious}
                disabled={historyStartIndex <= 0}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-500">
                {historyStartIndex + 1}-{Math.min(historyStartIndex + 4, historicalWinners.length)} de {historicalWinners.length}
              </span>
              <button
                onClick={handleHistoryNext}
                disabled={historyStartIndex >= historicalWinners.length - 4}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {visibleHistory.map((monthData, index) => (
              <div 
                key={monthData.month.getTime()} 
                className={`border-2 rounded-xl p-4 transition-all cursor-pointer ${
                  monthData.month.getTime() === selectedDate.getTime()
                    ? 'border-yellow-400 bg-yellow-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedDate(monthData.month)}
              >
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-600 mb-2 capitalize">
                    {monthData.monthLabel}
                  </div>
                  
                  {monthData.winner ? (
                    <>
                      <div className="relative mb-3">
                        <img
                          src={monthData.winner.employee.avatar}
                          alt={monthData.winner.employee.name}
                          className="w-12 h-12 rounded-full mx-auto border-2 border-yellow-400"
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                          <Trophy className="w-3 h-3 text-white" />
                        </div>
                      </div>
                      
                      <div className="text-sm font-bold text-gray-900 mb-1">
                        {monthData.winner.employee.name}
                      </div>
                      
                      <div className="text-xs text-gray-600 mb-2">
                        {monthData.winner.employee.role}
                      </div>
                      
                      <div className="text-lg font-bold text-yellow-600">
                        {monthData.winner.points.total}
                      </div>
                      <div className="text-xs text-gray-500">pontos</div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-2 flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-gray-400" />
                      </div>
                      <div className="text-sm text-gray-500">Sem dados</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Data Source Info */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-green-900 mb-4">Como Funciona o Ranking</h3>
        <div className="space-y-2 text-green-800">
          <p>• <strong>Dados em tempo real:</strong> Baseado na aba "Performance Semanal"</p>
          <p>• <strong>Cálculo automático:</strong> Soma todas as semanas do mês selecionado</p>
          <p>• <strong>Pesos aplicados:</strong> Cada métrica tem seu multiplicador específico</p>
          <p>• <strong>Atualização automática:</strong> Ranking muda conforme você adiciona dados semanais</p>
          <p>• <strong>Período ativo:</strong> {selectedMonth} {selectedYear}</p>
        </div>
      </div>
    </div>
  );
};