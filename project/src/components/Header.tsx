import { Bell, Settings, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { session, logout } = useAuth();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Road Compliance Smart System
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {currentTime.toLocaleDateString('en-KE', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}{' '}
            • {currentTime.toLocaleTimeString('en-KE')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700">{session?.username}</p>
              <p className="text-xs text-slate-500 capitalize">{session?.role}</p>
            </div>
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <button
              onClick={logout}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
