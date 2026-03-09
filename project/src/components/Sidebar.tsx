import { LayoutDashboard, Video, Car, AlertTriangle, Bell, Image, WifiOff } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { getNotifications, getViolations } from '../lib/localDb';

export function Sidebar() {
  const { currentView, setCurrentView } = useDashboard();
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [pendingViolations, setPendingViolations] = useState(0);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    async function loadBadges() {
      try {
        const [notifications, violations] = await Promise.all([
          getNotifications(100),
          getViolations(100),
        ]);
        setUnreadAlerts(notifications.filter((n) => !n.read).length);
        setPendingViolations(violations.filter((v) => v.status === 'pending').length);
      } catch {
        // ignore
      }
    }
    loadBadges();
    const interval = setInterval(loadBadges, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const navItems = [
    { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard, badge: 0 },
    { id: 'monitoring' as const, label: 'Live Monitoring', icon: Video, badge: 0 },
    { id: 'analysis' as const, label: 'Frame Analysis', icon: Image, badge: 0 },
    { id: 'vehicles' as const, label: 'Vehicles', icon: Car, badge: 0 },
    { id: 'violations' as const, label: 'Violations', icon: AlertTriangle, badge: pendingViolations },
    { id: 'alerts' as const, label: 'Alerts', icon: Bell, badge: unreadAlerts },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight">RCSS</h1>
            <p className="text-xs text-slate-400">Road Compliance</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20 text-white' : 'bg-red-500 text-white'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700 space-y-2">
        {isOffline && (
          <div className="flex items-center gap-2 bg-amber-900/50 border border-amber-700/50 rounded-lg px-3 py-2">
            <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span className="text-xs text-amber-300 font-medium">Offline Mode</span>
          </div>
        )}
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
            <span className="text-sm font-medium">System Active</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">All data stored locally</p>
        </div>
      </div>
    </aside>
  );
}
