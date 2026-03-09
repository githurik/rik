import { createContext, useContext, useState, ReactNode } from 'react';

type View = 'dashboard' | 'monitoring' | 'vehicles' | 'violations' | 'alerts' | 'analysis';

interface DashboardContextType {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  return (
    <DashboardContext.Provider value={{ currentView, setCurrentView }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
