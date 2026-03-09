import { LayoutDashboard, Video, Car, AlertTriangle, Bell, Image } from 'lucide-react';
import { useDashboard } from '../contexts/DashboardContext';

export function Sidebar() {
  const { currentView, setCurrentView } = useDashboard();

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring' as const, label: 'Live Monitoring', icon: Video },
    { id: 'analysis' as const, label: 'Frame Analysis', icon: Image },
    { id: 'vehicles' as const, label: 'Vehicles', icon: Car },
    { id: 'violations' as const, label: 'Violations', icon: AlertTriangle },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg">RCSS</h1>
            <p className="text-xs text-slate-400">Road Compliance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">System Active</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
