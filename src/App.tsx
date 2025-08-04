import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Proposals } from './components/Proposals/Proposals';
import { Commissions } from './components/Commissions/Commissions';
import { WeeklyPerformance } from './components/WeeklyPerformance/WeeklyPerformance';
import { BonusFund } from './components/BonusFund/BonusFund';
import { EmployeeManagement } from './components/Employees/EmployeeManagement';
import { EmployeeOfMonth } from './components/Gamification/EmployeeOfMonth';
import { UserManagement } from './components/UserManagement/UserManagement';
import { Settings } from './components/Settings/Settings';
import { Challenges } from './components/Challenges/Challenges';
import { BudgetPage } from './components/Budgets/BudgetPage';
import { useSupabaseQuery } from './hooks/useSupabase';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Buscar dados de performance semanal para passar para o componente EmployeeOfMonth
  const { data: weeklyPerformanceData = [] } = useSupabaseQuery('weekly_performance', {
    // Force refresh when key changes
    orderBy: { column: 'created_at', ascending: false }
  });

  // Function to refresh all data across the app
  const refreshAllData = () => {
    console.log('Refreshing all app data...');
    setRefreshKey(prev => prev + 1);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    closeSidebar(); // Fechar sidebar ao selecionar uma aba
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard key={`dashboard-${refreshKey}`} />;
      case 'proposals':
        return <Proposals key={`proposals-${refreshKey}`} onDataChange={refreshAllData} />;
      case 'commissions':
        return <Commissions key={`commissions-${refreshKey}`} />;
      case 'weekly-performance':
        return <WeeklyPerformance />;
      case 'bonus-fund':
        return <BonusFund key={`bonus-fund-${refreshKey}`} />;
      case 'employee-of-month':
        return <EmployeeOfMonth />;
      case 'challenges':
        return <Challenges key={`challenges-${refreshKey}`} />;
      case 'budgets':
        return <BudgetPage key={`budgets-${refreshKey}`} />;
      case 'settings':
        return <Settings />;
      default:
        return <Proposals key={`proposals-${refreshKey}`} onDataChange={refreshAllData} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Mobile Menu Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
      >
        {isSidebarOpen ? (
          <X className="w-6 h-6 text-gray-600" />
        ) : (
          <Menu className="w-6 h-6 text-gray-600" />
        )}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:z-auto
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 z-30 bg-black bg-opacity-50" 
          onClick={closeSidebar}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:ml-0 pt-16 md:pt-0">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;