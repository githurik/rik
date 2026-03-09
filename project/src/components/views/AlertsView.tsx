import { useEffect, useState } from 'react';
import { Bell, AlertCircle, CheckCircle, Clock, Loader, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  read: boolean;
  created_at: string;
}

export function AlertsView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'unread'>('all');

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  async function loadNotifications() {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      setNotifications((data || []) as Notification[]);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  }

  const markAsRead = async (id: string) => {
    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await supabase.from('notifications').delete().eq('id', id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'critical') return n.severity === 'critical';
    if (filter === 'high') return n.severity === 'high' || n.severity === 'critical';
    return true;
  });

  const stats = {
    total: notifications.length,
    critical: notifications.filter((n) => n.severity === 'critical').length,
    unread: notifications.filter((n) => !n.read).length,
    high: notifications.filter((n) => n.severity === 'high').length,
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'high':
        return <AlertCircle className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-2xl font-bold text-slate-800">System Notifications</h3>
        <p className="text-slate-600 mt-1">Real-time alerts from frame analysis and violations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Bell className="w-8 h-8 text-blue-600" />
            <span className="text-sm font-medium text-slate-500">Total</span>
          </div>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <span className="text-sm font-medium text-slate-500">Critical</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{stats.critical}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <span className="text-sm font-medium text-slate-500">High</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{stats.high}</p>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-8 h-8 text-yellow-600" />
            <span className="text-sm font-medium text-slate-500">Unread</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{stats.unread}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-lg font-bold text-slate-800">Notifications</h4>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Notifications</option>
              <option value="unread">Unread</option>
              <option value="critical">Critical</option>
              <option value="high">High & Critical</option>
            </select>
            <button
              onClick={loadNotifications}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Loader className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-500">No notifications</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border-2 transition-colors ${getSeverityColor(
                  notification.severity
                )} ${notification.read ? 'opacity-75' : 'font-semibold'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-1">{getSeverityIcon(notification.severity)}</div>
                    <div className="flex-1">
                      <h5 className="font-bold">{notification.title}</h5>
                      <p className="text-sm mt-1">{notification.message}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(notification.created_at).toLocaleString('en-KE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      className="p-2 hover:bg-black/10 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-bold text-blue-900 mb-2">Frame Analysis Notifications</h4>
        <p className="text-blue-800 text-sm">
          Automatic notifications are generated when violations are detected during frame analysis. Navigate to Frame Analysis to upload images or start live monitoring to detect violations in real-time.
        </p>
      </div>
    </div>
  );
}
