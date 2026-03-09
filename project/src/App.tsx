import { useEffect, useState } from 'react';
import { DashboardProvider, useDashboard } from './contexts/DashboardContext';
import { useAuth } from './contexts/AuthContext';
import { LoginPage } from './components/LoginPage';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/views/DashboardView';
import { MonitoringView } from './components/views/MonitoringView';
import { AnalysisView } from './components/views/AnalysisView';
import { VehiclesView } from './components/views/VehiclesView';
import { ViolationsView } from './components/views/ViolationsView';
import { AlertsView } from './components/views/AlertsView';
import { initializeDB } from './lib/localDb';
import { seedInitialData } from './lib/seedData';

function AppContent() {
  const { currentView } = useDashboard();

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-8">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'monitoring' && <MonitoringView />}
          {currentView === 'analysis' && <AnalysisView />}
          {currentView === 'vehicles' && <VehiclesView />}
          {currentView === 'violations' && <ViolationsView />}
          {currentView === 'alerts' && <AlertsView />}
        </main>
      </div>
    </div>
  );
}

function AppWithAuth() {
  const { session, loading } = useAuth();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    initializeDB()
      .then(() => seedInitialData())
      .then(() => setDbReady(true))
      .catch((error) => {
        console.error('Failed to initialize database:', error);
        setDbReady(true);
      });
  }, []);

  if (loading || !dbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Initializing...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  return (
    <DashboardProvider>
      <AppContent />
    </DashboardProvider>
  );
}

export default AppWithAuth;
