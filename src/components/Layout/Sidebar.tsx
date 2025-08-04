import React from 'react';
import { 
  Home, 
  FileText,
  DollarSign,
  Calendar,
  TrendingUp,
  PiggyBank,
  Users,
  Trophy,
  Award,
  Settings,
  CalendarDays,
  ClipboardList
} from 'lucide-react';
import { VersionSelector } from './VersionSelector';
import { useYear } from '../../contexts/YearContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'proposals', label: 'Propostas', icon: FileText },
  { id: 'commissions', label: 'Comissões', icon: DollarSign },
  { id: 'challenges', label: 'Desafios e Prêmios', icon: Award },
  { id: 'weekly-performance', label: 'Performance Semanal', icon: TrendingUp },
  { id: 'bonus-fund', label: 'Fundo de Bonificação', icon: PiggyBank },
  { id: 'employee-of-month', label: 'Destaque do Mês', icon: Trophy },
  { id: 'budgets', label: 'Orçamentos', icon: ClipboardList },
  { id: 'settings', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { selectedYear, setSelectedYear, availableYears } = useYear();
  const [hasNewChallenge, setHasNewChallenge] = React.useState(false);
  
  // Verificar se há desafio novo criado nas últimas 24 horas
  React.useEffect(() => {
    const checkNewChallenge = () => {
      const newChallengeTimestamp = localStorage.getItem('newChallengeCreatedAt');
      
      if (!newChallengeTimestamp) {
        setHasNewChallenge(false);
        return;
      }
      
      const createdAt = new Date(newChallengeTimestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      
      if (hoursDiff >= 24) {
        // Remove do localStorage se passou de 24 horas
        localStorage.removeItem('newChallengeCreatedAt');
        setHasNewChallenge(false);
      } else {
        setHasNewChallenge(true);
      }
    };
    
    // Verificar imediatamente
    checkNewChallenge();
    
    // Verificar a cada minuto
    const interval = setInterval(checkNewChallenge, 60000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="w-full h-full bg-white border-r border-gray-200 min-h-screen flex flex-col shadow-lg md:shadow-none">
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Grupo WWS</h1>
        </div>
        
        {/* Year Selector */}
        <div className="mt-4">
          <div className="flex items-center space-x-2 mb-2">
            <CalendarDays className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Ano:</span>
          </div>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Ano fiscal para metas e relatórios
          </p>
        </div>
      </div>
      
      <nav className="flex-1 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isNewChallenge = item.id === 'challenges' && hasNewChallenge;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <div className="flex items-center space-x-2 flex-1">
                    <span className="font-medium">{item.label}</span>
                    {isNewChallenge && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-red-500 to-pink-500 animate-pulse">
                        NOVO!
                      </span>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <VersionSelector />
    </div>
  );
};