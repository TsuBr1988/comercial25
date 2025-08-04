import React from 'react';
import { CommissionDetailModal } from '../Commissions/CommissionDetailModal';
import { DollarSign, CheckCircle, Users, TrendingUp, Info, X } from 'lucide-react';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate } from '../../utils/dateUtils';

interface CommissionDetail {
  proposalId: string;
  client: string;
  totalValue: number;
  commissionRate: number;
  commissionValue: number;
  status: string;
  closingDate?: string;
  createdAt: string;
}

interface PersonCommissionData {
  employeeId: string;
  name: string;
  role: string;
  avatar?: string;
  totalCommission: number;
  proposals: CommissionDetail[];
}

export const GuaranteedCommissions: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = React.useState<PersonCommissionData | null>(null);
  const [showBreakdownModal, setShowBreakdownModal] = React.useState<string | null>(null);
  const { data: proposals = [], loading: proposalsLoading } = useSupabaseQuery('proposals');
  const { data: employees = [], loading: employeesLoading } = useSupabaseQuery('employees');
  
  if (proposalsLoading || employeesLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }
  
  // Filtrar propostas fechadas do mês atual
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const closedProposalsThisMonth = proposals.filter(proposal => {
    if (proposal.status !== 'Fechado') return false;
    
    // APENAS usar data de fechamento - se não tiver, não considerar
    if (!proposal.closing_date) return false;
    
    const closingDate = new Date(proposal.closing_date);
    return closingDate.getMonth() === currentMonth && closingDate.getFullYear() === currentYear;
  });
  
  // Calcular valor total fechado no mês
  const totalClosedValue = closedProposalsThisMonth.reduce(
    (sum, proposal) => sum + Number(proposal.total_value || 0), 0
  );
  
  // Determinar taxa de comissão baseada no volume total
  const getCommissionRate = (totalValue: number) => {
    if (totalValue <= 600000) return 0.4;
    if (totalValue <= 1200000) return 0.8;
    return 1.2;
  };
  
  const commissionRate = getCommissionRate(totalClosedValue);
  
  // Calcular comissões por funcionário
  const calculateEmployeeCommissions = () => {
    const commissionsByEmployee: { [key: string]: { name: string, role: string, closerCommission: number, sdrCommission: number, proposals: number } } = {};
    
    closedProposalsThisMonth.forEach(proposal => {
      const proposalCommission = Number(proposal.commission || 0);
      
      // Comissão do Closer
      if (proposal.closer_id) {
        const closer = employees.find(emp => emp.id === proposal.closer_id);
        if (closer) {
          if (!commissionsByEmployee[proposal.closer_id]) {
            commissionsByEmployee[proposal.closer_id] = {
              name: closer.name,
              role: closer.role,
              closerCommission: 0,
              sdrCommission: 0,
              proposals: 0
            };
          }
          commissionsByEmployee[proposal.closer_id].closerCommission += proposalCommission;
          commissionsByEmployee[proposal.closer_id].proposals += 1;
        }
      }
      
      // Comissão do SDR (mesma taxa que o closer)
      if (proposal.sdr_id) {
        const sdr = employees.find(emp => emp.id === proposal.sdr_id);
        if (sdr) {
          if (!commissionsByEmployee[proposal.sdr_id]) {
            commissionsByEmployee[proposal.sdr_id] = {
              name: sdr.name,
              role: sdr.role,
              closerCommission: 0,
              sdrCommission: 0,
              proposals: 0
            };
          }
          commissionsByEmployee[proposal.sdr_id].sdrCommission += proposalCommission;
        }
      }
    });
    
    return commissionsByEmployee;
  };
  
  // Função para preparar dados da pessoa para o modal
  const preparePersonData = (employeeId: string): PersonCommissionData | null => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return null;

    const employeeProposals = closedProposalsThisMonth.filter(p => 
      p.closer_id === employeeId || p.sdr_id === employeeId
    );

    const proposalDetails: CommissionDetail[] = employeeProposals.map(proposal => {
      const commissionValue = Number(proposal.commission || 0);
      
      return {
        proposalId: proposal.id,
        client: proposal.client,
        totalValue: proposal.total_value || 0,
        commissionRate: proposal.commission_rate || commissionRate,
        commissionValue,
        status: proposal.status,
        closingDate: proposal.closing_date,
        createdAt: proposal.created_at
      };
    });

    const employeeCommissionData = employeeCommissions[employeeId];
    const totalCommission = employeeCommissionData ? 
      employeeCommissionData.closerCommission + employeeCommissionData.sdrCommission : 0;

    return {
      employeeId,
      name: employee.name,
      role: employee.role,
      avatar: employee.avatar,
      totalCommission,
      proposals: proposalDetails
    };
  };

  const handlePersonClick = (employeeId: string) => {
    const personData = preparePersonData(employeeId);
    if (personData) {
      setSelectedPerson(personData);
    }
  };

  const employeeCommissions = calculateEmployeeCommissions();
  const totalGuaranteedCommissions = Object.values(employeeCommissions
  ).reduce(
    (sum, emp) => sum + emp.closerCommission + emp.sdrCommission, 0
  );

  const getRateColor = (rate: number) => {
    if (rate === 0.4) return 'text-red-600';
    if (rate === 0.8) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRateBgColor = (rate: number) => {
    if (rate === 0.4) return 'bg-red-50 border-red-200';
    if (rate === 0.8) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const BreakdownModal: React.FC<{ type: string; onClose: () => void }> = ({ type, onClose }) => {
    const renderContent = () => {
      switch (type) {
        case 'total-guaranteed':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição das Comissões Garantidas</h3>
              
              {/* Mostrar contratos fechados primeiro */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-blue-900 mb-3">Contratos Fechados Este Mês ({closedProposalsThisMonth.length})</h4>
                <div className="space-y-3">
                  {closedProposalsThisMonth.map(contract => {
                    const contractCommission = (Number(contract.total_value || 0) * commissionRate) / 100;
                    const closingDate = contract.closing_date ? new Date(contract.closing_date) : new Date(contract.created_at);
                    
                    return (
                      <div key={contract.id} className="bg-white rounded-lg p-3 border border-blue-200">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h5 className="font-medium text-gray-900">{contract.client}</h5>
                            <div className="text-sm text-gray-600">
                              Fechado em: {displayDate(contract.closing_date)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              {formatCurrency(contractCommission)}
                            </div>
                            <div className="text-xs text-gray-500">comissão total</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                          <div>
                            <span>Valor Global:</span>
                            <div className="font-medium text-blue-600">{formatCurrency(contract.total_value)}</div>
                          </div>
                          <div>
                            <span>Taxa:</span>
                            <div className="font-medium">{commissionRate}%</div>
                          </div>
                          <div>
                            <span>Mensal:</span>
                            <div className="font-medium">{formatCurrency(contract.monthly_value)} × {contract.months}m</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Distribuição por funcionário */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 mt-6 mb-3">Distribuição por Funcionário</h4>
                {Object.keys(employeeCommissions).length > 0 ? (
                  Object.entries(employeeCommissions).map(([employeeId, data]) => (
                    <div key={employeeId} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{data.name}</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(data.closerCommission + data.sdrCommission)}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {data.closerCommission > 0 && (
                          <div className="flex justify-between">
                            <span>Como Closer ({data.proposals} contratos)</span>
                            <span>{formatCurrency(data.closerCommission)}</span>
                          </div>
                        )}
                        {data.sdrCommission > 0 && (
                          <div className="flex justify-between">
                            <span>Como SDR ({commissionRate}% do valor)</span>
                            <span>{formatCurrency(data.sdrCommission)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <div className="text-sm">Nenhuma comissão calculada</div>
                    <div className="text-xs mt-1">
                      Verifique se existem contratos fechados este mês
                    </div>
                  </div>
                )}
              </div>
              
              {/* Resumo final */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {formatCurrency(totalClosedValue)}
                    </div>
                    <div className="text-gray-600">Volume Fechado</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {commissionRate}%
                    </div>
                    <div className="text-gray-600">Taxa Aplicada</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-green-600">
                      {formatCurrency(totalGuaranteedCommissions)}
                    </div>
                    <div className="text-gray-600">Total Comissões</div>
                  </div>
                </div>
                <div className="text-center mt-3 text-xs text-green-700">
                  <strong>Fórmula:</strong> Valor Fechado × {commissionRate}% = Total de Comissões
                </div>
              </div>
              
              <div className="border-t pt-3">
                <div className="flex justify-between font-bold">
                  <span>Total Garantido Final</span>
                  <span className="text-green-600">{formatCurrency(totalGuaranteedCommissions)}</span>
                </div>
              </div>
            </div>
          );
        case 'closed-value':
          return (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Composição do Valor Fechado</h3>
              <div className="space-y-2">
                {closedProposalsThisMonth.map(proposal => (
                  <div key={proposal.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{proposal.client}</span>
                      <div className="text-sm text-gray-600">
                        Fechado em: {displayDate(proposal.closing_date) || 'Data não informada'}
                      </div>
                    </div>
                    <span className="font-bold text-green-600">
                      {formatCurrency(proposal.total_value)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-bold">
                    <span>Total Fechado</span>
                    <span className="text-green-600">{formatCurrency(totalClosedValue)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        default:
          return (
            <div className="text-center py-8">
              <div className="text-gray-500">
                <div className="text-lg mb-2">🔍 Conteúdo não encontrado</div>
                <div className="text-sm">Tipo de detalhamento: {type}</div>
              </div>
            </div>
          );
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Detalhamento</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            {renderContent()}
          </div>
        </div>
      </div>
    );
  };
  return (
    <>
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span>Comissões Garantidas do Mês</span>
          </h3>
          <p className="text-sm text-gray-600">Baseado em contratos já fechados</p>
        </div>
        <div className="text-right">
          <button 
            onClick={() => setShowBreakdownModal('total-guaranteed')}
            className="text-2xl font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center space-x-1"
            title="Clique para ver detalhes"
          >
            {formatCurrency(totalGuaranteedCommissions)}
            <Info className="w-4 h-4 ml-1" />
          </button>
          <div className="text-sm text-gray-500">Total Garantido</div>
        </div>
      </div>

      {/* Volume e Taxa */}
      <div className={`mb-6 p-4 rounded-lg border ${getRateBgColor(commissionRate)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-gray-900">Volume Fechado no Mês</h4>
            <button 
              onClick={() => setShowBreakdownModal('closed-value')}
              className="text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
              title="Clique para ver detalhes"
            >
              {formatCurrency(totalClosedValue)}
              <Info className="w-3 h-3 ml-1" />
            </button>
          </div>
          <div className="text-right">
            <h4 className="text-sm font-semibold text-gray-900">Taxa Atual</h4>
            <p className={`text-2xl font-bold ${getRateColor(commissionRate)}`}>{commissionRate}%</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Contratos Fechados</p>
              <p className="text-xl font-bold text-gray-900">{closedProposalsThisMonth.length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Valor Fechado</p>
              <button 
                onClick={() => setShowBreakdownModal('closed-value')}
                className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer flex items-center space-x-1"
                title="Clique para ver detalhes"
              >
                {formatCurrency(totalClosedValue)}
                <Info className="w-3 h-3 ml-1" />
              </button>
            </div>
            <DollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pessoas Beneficiadas</p>
              <p className="text-xl font-bold text-gray-900">{Object.keys(employeeCommissions).length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Individual Commissions */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">Comissões por Pessoa:</h4>
        {Object.entries(employeeCommissions).length > 0 ? (
          Object.entries(employeeCommissions).map(([employeeId, data]) => (
            <div key={employeeId} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    data.role === 'Closer' ? 'bg-blue-500' : 'bg-green-500'
                  }`}>
                    <span className="text-white font-bold text-sm">
                      {data.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{data.name}</p>
                    <p className="text-sm text-gray-500">
                      {data.role} • {data.proposals > 0 ? `${data.proposals} contratos fechados` : 'SDR em contratos'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <button
                    onClick={() => handlePersonClick(employeeId)}
                    className="text-lg font-bold text-green-600 hover:text-green-700 transition-colors cursor-pointer flex items-center space-x-1"
                    title="Clique para ver detalhes das propostas"
                  >
                    {formatCurrency(data.closerCommission + data.sdrCommission)}
                    <Info className="w-3 h-3 ml-1" />
                  </button>
                  <div className="text-xs text-gray-500">
                    {data.closerCommission > 0 && `Closer: ${formatCurrency(data.closerCommission)}`}
                    {data.closerCommission > 0 && data.sdrCommission > 0 && ' • '}
                    {data.sdrCommission > 0 && `SDR: ${formatCurrency(data.sdrCommission)}`}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum contrato fechado este mês</p>
            <p className="text-sm text-gray-400">As comissões aparecerão quando contratos forem fechados</p>
          </div>
        )}
      </div>

      {/* Rate Scale */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="text-sm font-medium text-blue-900 mb-3">Escala de Comissões</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          <div className={`text-center p-2 rounded ${commissionRate === 0.4 ? 'bg-red-100 border border-red-300' : 'bg-white'}`}>
            <div className="font-medium text-red-800">0,4%</div>
            <div className="text-red-600">Até R$ 600 mil</div>
          </div>
          <div className={`text-center p-2 rounded ${commissionRate === 0.8 ? 'bg-yellow-100 border border-yellow-300' : 'bg-white'}`}>
            <div className="font-medium text-yellow-800">0,8%</div>
            <div className="text-yellow-600">R$ 600 mil - R$ 1,2 mi</div>
          </div>
          <div className={`text-center p-2 rounded ${commissionRate === 1.2 ? 'bg-green-100 border border-green-300' : 'bg-white'}`}>
            <div className="font-medium text-green-800">1,2%</div>
            <div className="text-green-600">Acima de R$ 1,2 mi</div>
          </div>
        </div>
      </div>
    </div>
    
    {showBreakdownModal && (
      <BreakdownModal 
        type={showBreakdownModal} 
        onClose={() => setShowBreakdownModal(null)} 
      />
    )}
    
    {/* Commission Detail Modal */}
    <CommissionDetailModal
      isOpen={!!selectedPerson}
      onClose={() => setSelectedPerson(null)}
      person={selectedPerson}
    />
    </>
  );
};