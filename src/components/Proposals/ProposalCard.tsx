import React from 'react';
import { useState } from 'react';
import { Calendar, DollarSign, TrendingUp, User, Clock, Edit, Save, X } from 'lucide-react';
import { Proposal } from '../../types';
import { useSupabaseQuery } from '../../hooks/useSupabase';
import { ProbabilityModal, ProbabilityScores } from './ProbabilityModal';
import { ProposalDetails } from './ProposalDetails';
import { ProposalEditModal } from './ProposalEditModal';
import { formatCurrency } from '../../utils/formatCurrency';
import { displayDate, formatDateForInput } from '../../utils/dateUtils';
import { StatusDropdown } from './StatusDropdown';

interface ProposalCardProps {
  proposal: Proposal;
  onUpdateProbability?: (proposalId: string, scores: ProbabilityScores) => void;
  onUpdateProposal?: (updatedProposal: Proposal) => void;
  readOnly?: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ 
  proposal, 
  onUpdateProbability,
  onUpdateProposal,
  readOnly = false
}) => {
  const { data } = useSupabaseQuery('employees');
  const employees = Array.isArray(data) ? data : [];
  const [showProbabilityModal, setShowProbabilityModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingValue, setEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState(proposal.monthlyValue.toString());
  const [editingDate, setEditingDate] = useState(false);
  const [tempDate, setTempDate] = useState(formatDateForInput(proposal.createdAt));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Fechado': return 'bg-green-100 text-green-800';
      case 'Negociação': return 'bg-blue-100 text-blue-800';
      case 'Proposta': return 'bg-yellow-100 text-yellow-800';
      case 'Perdido': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProbabilityDisplay = (probabilityScores?: ProbabilityScores) => {
    if (!probabilityScores) {
      return { level: 'Não avaliada', color: 'text-gray-500', bgColor: 'bg-gray-100 border-gray-300' };
    }
    
    // Cada critério vale de 1 a 3 pontos (8 critérios = máximo 24 pontos)
    const total = Object.values(probabilityScores).reduce((sum, score) => sum + score, 0);
    
    if (total < 12) return { level: 'Baixa', color: 'text-red-600', bgColor: 'bg-red-100 border-red-300' };
    if (total <= 18) return { level: 'Média', color: 'text-yellow-600', bgColor: 'bg-yellow-100 border-yellow-300' };
    return { level: 'Alta', color: 'text-green-600', bgColor: 'bg-green-100 border-green-300' };
  };

  const closer = employees.find(emp => emp.id === proposal.closerId);
  const sdr = proposal.sdrId ? employees.find(emp => emp.id === proposal.sdrId) : null;
  const probabilityDisplay = getProbabilityDisplay(proposal.probabilityScores);

  const handleProbabilityUpdate = (scores: ProbabilityScores) => {
    const total = Object.values(scores).reduce((sum, score) => sum + score, 0);
    console.log('Atualizando probabilidade no card:', { scores, total });
    
    // Chamar função de atualização do componente pai
    if (onUpdateProbability) {
      onUpdateProbability(proposal.id, scores);
    }
    
    // Mostrar mensagem de sucesso
    const probabilityLevel = total < 12 ? 'Baixa' : total <= 18 ? 'Média' : 'Alta';
    alert(`✅ Avaliação salva com sucesso!\n\n📊 Pontuação: ${total}/24\n🎯 Probabilidade: ${probabilityLevel}\n\n🔄 Atualizando toda a tela...`);
  };

  const handleProposalUpdate = (updatedProposal: Proposal) => {
    if (onUpdateProposal) {
      onUpdateProposal(updatedProposal);
    }
  };

  const handleValueEdit = () => {
    setEditingValue(true);
    setTempValue(proposal.monthlyValue.toString());
  };

  const handleValueSave = () => {
    const newValue = parseFloat(tempValue) || 0;
    if (newValue !== proposal.monthlyValue) {
      // Recalcular valores baseados no novo valor mensal
      const totalValue = newValue * proposal.months;
      
      // Recalcular comissão baseada no novo valor
      let rate = 0.4; // 0.4% default
      if (newValue >= 100000) {
        rate = 1.2;
      } else if (newValue >= 50000) {
        rate = 0.8;
      }
      
      const commission = (totalValue * rate) / 100;
      
      const updatedProposal: Proposal = {
        ...proposal,
        monthlyValue: newValue,
        totalValue,
        commission,
        commissionRate: rate,
        updatedAt: new Date().toISOString()
      };
      
      handleProposalUpdate(updatedProposal);
    }
    setEditingValue(false);
  };

  const handleValueCancel = () => {
    setEditingValue(false);
    setTempValue(proposal.monthlyValue.toString());
  };

  const handleDateEdit = () => {
    setEditingDate(true);
    setTempDate(proposal.createdAt.split('T')[0]);
  };

  const handleDateSave = () => {
    const newDate = tempDate;
    if (newDate !== formatDateForInput(proposal.createdAt)) {
      const updatedProposal: Proposal = {
        ...proposal,
        createdAt: newDate,
        updatedAt: new Date().toISOString() // Isso será tratado no backend
      };
      
      handleProposalUpdate(updatedProposal);
    }
    setEditingDate(false);
  };

  const handleDateCancel = () => {
    setEditingDate(false);
    setTempDate(formatDateForInput(proposal.createdAt));
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        {/* Header com títulos */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-1 md:gap-4 mb-2 md:mb-4 text-xs md:text-sm font-medium text-gray-500 border-b border-gray-100 pb-1 md:pb-2">
          <div className="text-xs md:text-sm">Cliente</div>
          <div className="text-center text-xs md:text-sm hidden md:block">Data de Inclusão</div>
          <div className="text-center text-xs md:text-sm">Valor Mensal</div>
          <div className="text-center text-xs md:text-sm">Probabilidade</div>
          <div className="text-center text-xs md:text-sm">Status</div>
        </div>
        
        {/* Content em Grid */}
        <div className="grid grid-cols-4 md:grid-cols-5 gap-1 md:gap-4 items-center">
          {/* Company Name - Clickable */}
          <div>
            <button
              onClick={() => setShowDetailsModal(true)}
             className="text-xs md:text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline text-left break-words whitespace-normal md:truncate leading-tight"
            >
              {proposal.client}
            </button>
          </div>
          
          {/* Creation Date - Editable */}
          <div className="text-center hidden md:block">
            {editingDate ? (
              <div className="flex items-center justify-center space-x-1">
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-32 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleDateSave();
                    if (e.key === 'Escape') handleDateCancel();
                  }}
                />
                <button
                  onClick={handleDateSave}
                  className="p-1 text-green-600 hover:text-green-800"
                  title="Salvar"
                >
                  <Save className="w-3 h-3" />
                </button>
                <button
                  onClick={handleDateCancel}
                  className="p-1 text-red-600 hover:text-red-800"
                  title="Cancelar"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleDateEdit}
                className="group flex items-center justify-center space-x-1 hover:bg-blue-50 rounded px-2 py-1 transition-colors"
                title="Clique para editar"
              >
                <span className="text-sm font-medium text-gray-900">
                  {displayDate(proposal.createdAt)}
                </span>
                <Edit className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          
          {/* Monthly Value - Editable */}
          <div className="text-center">
            {editingValue && !readOnly ? (
              <div className="flex items-center justify-center space-x-1">
                <input
                  type="number"
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  className="w-12 md:w-24 px-1 md:px-2 py-1 text-xs md:text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleValueSave();
                    if (e.key === 'Escape') handleValueCancel();
                  }}
                />
                <button
                  onClick={handleValueSave}
                  className="p-0.5 md:p-1 text-green-600 hover:text-green-800"
                  title="Salvar"
                >
                  <Save className="w-2.5 md:w-3 h-2.5 md:h-3" />
                </button>
                <button
                  onClick={handleValueCancel}
                  className="p-0.5 md:p-1 text-red-600 hover:text-red-800"
                  title="Cancelar"
                >
                  <X className="w-2.5 md:w-3 h-2.5 md:h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleValueEdit}
                className={`group flex items-center justify-center space-x-1 rounded px-1 md:px-2 py-1 transition-colors ${
                  readOnly ? 'cursor-default' : 'hover:bg-blue-50'
                }`}
                title="Clique para editar"
                disabled={readOnly}
              >
                <span className="text-xs md:text-sm font-bold text-gray-900 truncate">{formatCurrency(proposal.monthlyValue)}</span>
                {!readOnly && (
                  <Edit className="w-2.5 md:w-3 h-2.5 md:h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            )}
          </div>
          
          {/* Probability - Clickable */}
          <div className="text-center">
            <button
              onClick={() => !readOnly && setShowProbabilityModal(true)}
              className={`inline-flex px-1 md:px-3 py-0.5 md:py-1 rounded-full text-xs md:text-sm font-medium border hover:opacity-80 transition-opacity ${probabilityDisplay.bgColor} ${probabilityDisplay.color} border-current`}
              title={readOnly ? "Somente leitura" : "Clique para avaliar probabilidade"}
              disabled={readOnly}
            >
              {probabilityDisplay.level}
            </button>
          </div>
          
          {/* Status and Edit Button */}
          <div className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-3">
            <StatusDropdown
              currentStatus={proposal.status}
              proposalId={proposal.id}
              proposalClient={proposal.client}
              onStatusChange={onUpdateProposal ? () => {
                // Recarregar dados
                window.location.reload();
              } : () => {}}
              readOnly={readOnly}
            />
            {!readOnly ? (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-1 md:px-3 py-0.5 md:py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                Editar
              </button>
            ) : (
              <span className="px-2 md:px-3 py-1 bg-gray-300 text-gray-500 rounded-lg text-xs font-medium">
                Somente Leitura
              </span>
            )}
          </div>
        </div>
      </div>

      {!readOnly && <ProbabilityModal
        isOpen={showProbabilityModal}
        onClose={() => setShowProbabilityModal(false)}
        onSave={handleProbabilityUpdate}
        currentScores={proposal.probabilityScores}
        clientName={proposal.client}
      />}

      <ProposalDetails
        proposal={proposal}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        onEdit={!readOnly ? () => {
          setShowDetailsModal(false);
          setShowEditModal(true);
        } : undefined}
        onUpdateProbability={!readOnly ? handleProbabilityUpdate : undefined}
        readOnly={readOnly}
      />

      {!readOnly && <ProposalEditModal
        proposal={proposal}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={handleProposalUpdate}
        onDelete={() => {
          // Recarregar dados após exclusão
          window.location.reload();
        }}
      />}
    </>
  );
};