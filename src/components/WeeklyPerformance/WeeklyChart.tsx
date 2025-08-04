import React from 'react';
import { TrendingUp } from 'lucide-react';
import { WeeklyData } from '../../types';

interface WeeklyChartProps {
  weeklyData: WeeklyData[];
  weeks: string[];
  employees: any[];
}

export const WeeklyChart: React.FC<WeeklyChartProps> = ({ weeklyData, weeks, employees }) => {
  const getEmployeeColor = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500', 
      'bg-purple-500',
      'bg-orange-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-teal-500'
    ];
    return colors[index % colors.length];
  };

  const getEmployeeLineColor = (index: number) => {
    const colors = [
      '#3B82F6', // blue-500
      '#10B981', // green-500
      '#8B5CF6', // purple-500
      '#F59E0B', // orange-500
      '#EF4444', // red-500
      '#6366F1', // indigo-500
      '#EC4899', // pink-500
      '#14B8A6'  // teal-500
    ];
    return colors[index % colors.length];
  };
  const getEmployeeWeekPoints = (employeeId: string, week: string) => {
    const data = weeklyData.find(d => d.employeeId === employeeId && d.weekEndingDate === week);
    return data?.totalPoints || 0;
  };

  const maxPoints = Math.max(
    ...employees.map(emp => 
      Math.max(...weeks.map(week => getEmployeeWeekPoints(emp.id, week)))
    ),
    10 // Maximum scale of 10 for better visualization
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  // Create scales
  const xScale = (weekIndex: number) => (weekIndex / (weeks.length - 1)) * innerWidth;
  const yScale = (points: number) => innerHeight - (points / maxPoints) * innerHeight;

  // Generate path for each employee
  const generatePath = (employeeId: string) => {
    const points = weeks.map((week, index) => {
      const x = xScale(index);
      const y = yScale(getEmployeeWeekPoints(employeeId, week));
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
    return points;
  };
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <span>Evolução Semanal de Pontos</span>
          </h3>
          <p className="text-sm text-gray-600">Gráfico de linhas mostrando a evolução de cada funcionário</p>
        </div>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3">
          {employees.map((employee, index) => (
            <div key={employee.id} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: getEmployeeLineColor(index) }}
              ></div>
              <span className="text-sm text-gray-700">{employee.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line Chart */}
      <div className="relative flex justify-center">
        <svg width={chartWidth} height={chartHeight} className="border border-gray-200 rounded-lg">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="30" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 30" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Y-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={chartHeight - padding.bottom} 
            stroke="#6b7280" 
            strokeWidth="2"
          />
          
          {/* X-axis */}
          <line 
            x1={padding.left} 
            y1={chartHeight - padding.bottom} 
            x2={chartWidth - padding.right} 
            y2={chartHeight - padding.bottom} 
            stroke="#6b7280" 
            strokeWidth="2"
          />
          
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + ratio * innerHeight;
            const value = Math.round(maxPoints * (1 - ratio));
            return (
              <g key={ratio}>
                <line x1={padding.left - 5} y1={y} x2={padding.left} y2={y} stroke="#6b7280" />
                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="12" fill="#6b7280">
                  {value}
                </text>
              </g>
            );
          })}
          
          {/* X-axis labels */}
          {weeks.map((week, index) => {
            const x = padding.left + xScale(index);
            const weekDate = new Date(week);
            const dayOfMonth = weekDate.getDate();
            const shouldShowLabel = [1, 5, 10, 15, 20, 25, 30].includes(dayOfMonth);
            
            // Only show labels for specific days (01, 05, 10, 15, 20, 25, 30) to avoid cluttered x-axis
            if (!shouldShowLabel) {
              return (
                <g key={week}>
                  <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 5} stroke="#6b7280" />
                </g>
              );
            }
            
            return (
              <g key={week}>
                <line x1={x} y1={chartHeight - padding.bottom} x2={x} y2={chartHeight - padding.bottom + 5} stroke="#6b7280" />
                <text 
                  x={x} 
                  y={chartHeight - padding.bottom + 20} 
                  textAnchor="middle" 
                  fontSize="10" 
                  fill="#6b7280"
                  transform={`rotate(-45 ${x} ${chartHeight - padding.bottom + 20})`}
                >
                  {formatDate(week)}
                </text>
              </g>
            );
          })}
          
          {/* Employee lines */}
          {employees.map((employee, index) => (
            <g key={employee.id}>
              {/* Line */}
              <path
                d={generatePath(employee.id)}
                fill="none"
                stroke={getEmployeeLineColor(index)}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                transform={`translate(${padding.left}, ${padding.top})`}
              />
              
              {/* Data points */}
              {weeks.map((week, weekIndex) => {
                const points = getEmployeeWeekPoints(employee.id, week);
                const x = padding.left + xScale(weekIndex);
                const y = padding.top + yScale(points);
                
                return (
                  <circle
                    key={`${employee.id}-${week}`}
                    cx={x}
                    cy={y}
                    r="4"
                    fill={getEmployeeLineColor(index)}
                    stroke="white"
                    strokeWidth="2"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${employee.name}: ${points} pontos`}</title>
                  </circle>
                );
              })}
            </g>
          ))}
        </svg>
      </div>
      
      {/* Chart Info */}
      <div className="mt-4 text-center">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">📈 Gráfico de Linhas:</span> Evolução temporal
          </div>
          <div>
            <span className="font-medium">🔄 Atualização:</span> Tempo real
          </div>
          <div>
            <span className="font-medium">💾 Auto-save:</span> Alterações salvas automaticamente
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {employees.reduce((total, emp) => 
              total + weeks.reduce((weekTotal, week) => 
                weekTotal + getEmployeeWeekPoints(emp.id, week), 0
              ), 0
            )}
          </div>
          <div className="text-sm text-gray-600">Total de Pontos</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {Math.round(
              employees.reduce((total, emp) => 
                total + weeks.reduce((weekTotal, week) => 
                  weekTotal + getEmployeeWeekPoints(emp.id, week), 0
                ), 0
              ) / employees.length
            )}
          </div>
          <div className="text-sm text-gray-600">Média por Pessoa</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.max(...employees.map(emp => 
              weeks.reduce((total, week) => 
                total + getEmployeeWeekPoints(emp.id, week), 0
              )
            ))}
          </div>
          <div className="text-sm text-gray-600">Maior Pontuação</div>
        </div>
      </div>
    </div>
  );
};