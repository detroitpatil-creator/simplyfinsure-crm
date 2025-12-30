import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import Dashboard from './Dashboard';
import InsuranceCompaniesMaster from './InsuranceCompaniesMaster';
import PolicyTypeMaster from './PolicyTypeMaster';
import AgentManager from './AgentManager';
import PolicyToExcelModule from './PolicyToExcelModule';

interface DashboardLayoutProps {
  onLogout: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeContent, setActiveContent] = useState('Dashboard');

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleNavigate = (itemName: string) => {
    setActiveContent(itemName);
  };

  const getPageTitle = (content: string) => {
    switch (content) {
      case 'Dashboard':
        return 'Executive Overview';
      case 'Insurance Companies':
        return 'Manage Insurance Partners';
      case 'Policy Type':
        return 'Policy Category Directory';
      case 'Agents':
        return 'Distribution Partners';
      case 'Policy to Excel':
        return 'Policy Extraction Generator';
      default:
        return content;
    }
  };

  const sidebarWidth = isSidebarCollapsed ? '83px' : '270px';

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={toggleSidebar}
        onNavigate={handleNavigate}
      />

      <div
        className="flex-1 flex flex-col transition-all duration-300 ease-in-out"
        style={{ marginLeft: sidebarWidth }}
      >
        <Header pageTitle={getPageTitle(activeContent)} onLogout={onLogout} />

        <main className="flex-1 p-0 overflow-y-auto">
          {activeContent === 'Dashboard' && <Dashboard />}
          {activeContent === 'Insurance Companies' && <InsuranceCompaniesMaster />}
          {activeContent === 'Policy Type' && <PolicyTypeMaster />}
          {activeContent === 'Agents' && <AgentManager />}
          {activeContent === 'Policy to Excel' && <PolicyToExcelModule />}
          
          {/* Fallback for other routes */}
          {!['Dashboard', 'Insurance Companies', 'Policy Type', 'Agents', 'Policy to Excel'].includes(activeContent) && (
            <div className="flex flex-col items-center justify-center h-full p-20 text-center animate-fade-in">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <span className="text-4xl grayscale opacity-30">📊</span>
              </div>
              <h2 className="text-2xl font-black text-slate-800 mb-2">Module Integration</h2>
              <p className="text-slate-500 font-medium max-w-sm">The <b>{activeContent}</b> module is currently being connected to the secure reporting engine.</p>
              <button 
                onClick={() => handleNavigate('Dashboard')}
                className="mt-10 px-8 py-3 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Return to Command Center
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;