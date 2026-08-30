import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { ToastContainer } from './components/layout/ToastContainer';
import { AuthGate } from './auth/AuthGate';

// Screens
import { ResumenEjecutivoScreen } from './components/screens/ResumenEjecutivoScreen';
import { DecisionesScreen } from './components/screens/DecisionesScreen';
import { EquipoIAScreen } from './components/screens/EquipoIAScreen';
import { ConversacionesScreen } from './components/screens/ConversacionesScreen';
import { TareasScreen } from './components/screens/TareasScreen';
import { ProyectosScreen } from './components/screens/ProyectosScreen';
import { OperacionesWispScreen } from './components/screens/OperacionesWispScreen';
import { NugaCoreScreen } from './components/screens/NugaCoreScreen';
import { MarketingScreen } from './components/screens/MarketingScreen';
import { AdministracionScreen } from './components/screens/AdministracionScreen';
import { EntregablesScreen } from './components/screens/EntregablesScreen';
import { AuditoriaScreen } from './components/screens/AuditoriaScreen';
import { ConfiguracionScreen } from './components/screens/ConfiguracionScreen';

// Modals
import { DecisionDetailModal } from './components/modals/DecisionDetailModal';
import { NotificationCenterModal } from './components/modals/NotificationCenterModal';
import { NewTaskModal } from './components/modals/NewTaskModal';
import { NewIncidentModal } from './components/modals/NewIncidentModal';
import { NewCampaignModal } from './components/modals/NewCampaignModal';
import { NewAdminItemModal } from './components/modals/NewAdminItemModal';
import { MediaViewerModal } from './components/modals/MediaViewerModal';

const MainLayout: React.FC = () => {
  const { currentScreen, isNotificationCenterOpen, setIsNotificationCenterOpen } = useApp();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'resumen':
        return <ResumenEjecutivoScreen />;
      case 'decisiones':
        return <DecisionesScreen />;
      case 'equipo-ia':
        return <EquipoIAScreen />;
      case 'conversaciones':
        return <ConversacionesScreen />;
      case 'tareas':
        return <TareasScreen />;
      case 'proyectos':
        return <ProyectosScreen />;
      case 'operaciones-wisp':
        return <OperacionesWispScreen />;
      case 'nugacore':
        return <NugaCoreScreen />;
      case 'marketing':
        return <MarketingScreen />;
      case 'administracion':
        return <AdministracionScreen />;
      case 'entregables':
        return <EntregablesScreen />;
      case 'auditoria':
        return <AuditoriaScreen />;
      case 'configuracion':
        return <ConfiguracionScreen />;
      default:
        return <ResumenEjecutivoScreen />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#050B10] text-[#E0E7FF] font-sans selection:bg-blue-600 selection:text-white">
      {/* Collapsible Sidebar / Mobile Drawer */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#050B10]">
        {/* Topbar */}
        <Topbar />

        {/* Scrollable Viewport */}
        <main
          id="main-viewport"
          className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-8 py-4 sm:py-6 custom-scrollbar"
        >
          <div className="max-w-7xl mx-auto w-full">
            {renderActiveScreen()}
          </div>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <GlobalSearchModal />
      <ToastContainer />
      <NotificationCenterModal
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      <DecisionDetailModal />
      <NewTaskModal />
      <NewIncidentModal />
      <NewCampaignModal />
      <NewAdminItemModal />
      <MediaViewerModal />
    </div>
  );
};

export default function App() {
  return (
    <AuthGate>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </AuthGate>
  );
}
