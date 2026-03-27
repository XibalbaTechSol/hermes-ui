import React, { useState } from 'react';
import AppLayout from './components/layout/AppLayout';
import ChatView from './components/views/ChatView';
import MCPView from './components/views/MCPView';
import LogView from './components/views/LogView';
import DashboardView from './components/views/DashboardView';
import SubagentsView from './components/views/SubagentsView';
import SettingsView from './components/views/SettingsView';
import GraphView from './components/views/GraphView';
import CommandsView from './components/views/CommandsView';
import GatewayView from './components/views/GatewayView';
import SkillsView from './components/views/SkillsView';

type NavItem = 'chat' | 'mcp' | 'logs' | 'dashboard' | 'subagents' | 'settings' | 'graph' | 'commands' | 'gateway' | 'skills';

const HermesApp: React.FC = () => {
  const [activeView, setActiveView] = useState<NavItem>('dashboard');

  const renderView = () => {
    switch (activeView) {
      case 'chat':
        return <ChatView />;
      case 'skills':
        return <SkillsView />;
      case 'gateway':
        return <GatewayView />;
      case 'mcp':
        return <MCPView />;
      case 'logs':
        return <LogView />;
      case 'dashboard':
        return <DashboardView />;
      case 'subagents':
        return <SubagentsView />;
      case 'settings':
        return <SettingsView />;
      case 'graph':
        return <GraphView />;
      case 'commands':
        return <CommandsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppLayout activeView={activeView} setActiveView={setActiveView}>
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderView()}
      </div>
    </AppLayout>
  );
};

export default HermesApp;
