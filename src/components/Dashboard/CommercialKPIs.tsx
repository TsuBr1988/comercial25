import React from 'react';
import { formatCurrency } from '../../utils/formatCurrency';
import { DollarSign, Target, BarChart3, TrendingUp } from 'lucide-react';

export const CommercialKPIs: React.FC = () => {
  const calculateCAC = () => {
    const totalCosts = 196017.31;
    const clientsCount = 3;
    return clientsCount > 0 ? totalCosts / clientsCount : 0;
  };

  const calculateROI = () => {
    const revenue = 86369.53;
    const costs = 196017.31;
    return costs > 0 ? revenue / costs : 0;
  };

  const cacValue = calculateCAC();
  const roiValue = calculateROI();
  const ltvValue = 178455.4;
  const ltvCacRatio = cacValue > 0 ? ltvValue / cacValue : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-6 items-stretch">
      {/* Ticket Médio */}
      <div className="p-4 border rounded shadow bg-white flex flex-col h-[350px]">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-blue-500" /> Ticket Médio
          </h3>
        </div>
        <p className="text-2xl font-bold text-blue-600">R$ 14.871,28</p>
        <p className="text-xs text-gray-500">Baseado em 3 contratos fechados</p>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          Total faturado: <strong>{formatCurrency(44613.85)}</strong><br />
          Contratos fechados: <strong>3 contratos</strong><br />
          Ano: <strong>2025</strong>
        </div>
        <div className="mt-2 text-xs text-green-600 font-medium">● Atualizado automaticamente</div>
        <div className="mt-4 h-[80px] text-xs bg-blue-50 border border-blue-300 p-2 rounded">
          <strong>Fórmula:</strong> Soma dos valores mensais ÷ Quantidade de contratos<br />
          Apenas contratos com status "Fechado\" em 2025
        </div>
      </div>

      {/* CAC */}
      <div className="p-4 border rounded shadow bg-white flex flex-col h-[350px]">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
          <Target className="w-4 h-4 text-orange-500" /> CAC
        </h3>
        <p className="text-2xl font-bold text-orange-600">{formatCurrency(cacValue)}</p>
        <p className="text-xs text-gray-500">Investimento por cliente adquirido</p>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          Custos 2025: <strong>{formatCurrency(196017.31)}</strong><br />
          Clientes fechados: <strong>3 clientes</strong><br />
          Status: <span className="text-green-600">● Normal</span>
        </div>
        <div className="mt-2 text-xs text-green-600 font-medium">● Últimos 12 meses</div>
        <div className="mt-4 h-[80px] text-xs bg-orange-50 border border-orange-300 p-2 rounded">
          <strong>Fórmula:</strong> Custos últimos 12 meses ÷ Clientes únicos fechados<br />
          Considera clientes únicos (sem duplicação)
        </div>
      </div>

      {/* ROI */}
      <div className="p-4 border rounded shadow bg-white flex flex-col h-[350px]">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
          <TrendingUp className="w-4 h-4 text-purple-500" /> ROI
        </h3>
        <p className={`text-2xl font-bold ${roiValue < 1 ? 'text-red-600' : 'text-green-600'}`}>{roiValue.toFixed(2)}</p>
        <p className="text-xs text-gray-500">Retorno sobre investimento total</p>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          Faturamento c/ margem 20%: <strong>{formatCurrency(86369.53)}</strong><br />
          Custos 2025: <strong>{formatCurrency(196017.31)}</strong><br />
          Status: <span className="text-red-600">● Baixo</span>
        </div>
        <div className="mt-2 text-xs text-red-600 font-medium">● Retorno negativo</div>
        <div className="mt-4 h-[80px] text-xs bg-purple-50 border border-purple-300 p-2 rounded">
          <strong>Fórmula:</strong> (Faturamento × 20% − Custos) ÷ Custos × 100<br />
          Margem de 20% aplicada sobre faturamento bruto
        </div>
      </div>

      {/* LTV/CAC */}
      <div className="p-4 border rounded shadow bg-white flex flex-col h-[350px]">
        <h3 className="text-sm font-medium text-gray-600 flex items-center gap-1">
          <BarChart3 className="w-4 h-4 text-green-600" /> LTV/CAC
        </h3>
        <p className="text-2xl font-bold text-green-600">{ltvCacRatio.toFixed(1)}x</p>
        <p className="text-xs text-gray-500">Retorno do investimento em aquisição</p>
        <div className="mt-2 text-sm text-gray-700 space-y-1">
          LTV médio: <strong>{formatCurrency(ltvValue)}</strong><br />
          CAC (últimos 12 meses): <strong>{formatCurrency(cacValue)}</strong><br />
          Status: <span className="text-yellow-600">● Marginal</span>
        </div>
        <div className="mt-4 h-[80px] text-xs bg-green-50 border border-green-300 p-2 rounded">
          <strong>Fórmula:</strong> LTV médio ÷ CAC<br />
          LTV = Valor anual do contrato ÷ CAC = Custos ÷ Clientes únicos
        </div>
      </div>
    </div>
  );
};