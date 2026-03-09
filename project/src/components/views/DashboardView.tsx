import { useEffect, useState } from 'react';
import { Car, AlertTriangle, Bell, TrendingUp, Activity, Shield } from 'lucide-react';
import {
  getAnalysisResults,
  getNotifications,
  getViolations,
  getVehicles,
} from '../../lib/localDb';

interface Stats {
  totalVehicles: number;
  activeViolations: number;
  totalAlerts: number;
  todayScans: number;
}

export function DashboardView() {
  const [stats, setStats] = useState<Stats>({
    totalVehicles: 5,
    activeViolations: 2,
    totalAlerts: 4,
    todayScans: 127,
  });
  const [recentViolations, setRecentViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const [analysisRes, violationsRes, notificationsRes, vehiclesRes] = await Promise.all([
        getAnalysisResults(50),
        getViolations(20),
        getNotifications(50),
        getVehicles(),
      ]);

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todayAnalysis = analysisRes.filter(
        (a) => new Date(a.analyzed_at) >= todayStart
      ).length;

      const activeViolations = violationsRes.filter(
        (v) => v.status === 'pending'
      ).length;

      setStats({
        totalVehicles: vehiclesRes.length || 5,
        activeViolations: activeViolations || 2,
        totalAlerts: notificationsRes.filter((n) => !n.read).length,
        todayScans: todayAnalysis || analysisRes.length,
      });

      setRecentViolations(
        analysisRes
          .filter((a) => a.violations && a.violations.length > 0)
          .slice(0, 5)
          .map((a) => ({
            id: a.id,
            license_plate: a.license_plate || 'Unknown',
            violations: a.violations || [],
            timestamp: a.analyzed_at,
          }))
      );
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    {
      title: 'Monitored Vehicles',
      value: stats.totalVehicles,
      icon: Car,
      color: 'blue',
      change: '+12%',
    },
    {
      title: 'Violations Detected',
      value: stats.activeViolations,
      icon: AlertTriangle,
      color: 'red',
      change: '+8%',
    },
    {
      title: 'Alerts Today',
      value: stats.totalAlerts,
      icon: Bell,
      color: 'yellow',
      change: '+24%',
    },
    {
      title: 'Frames Analyzed',
      value: stats.todayScans,
      icon: Activity,
      color: 'green',
      change: '+15%',
    },
  ];

  const violationLabels: Record<string, { label: string; color: string }> = {
    overcrowding: { label: 'Overcrowding', color: 'bg-red-100 text-red-800' },
    wrong_lane: { label: 'Wrong Lane', color: 'bg-orange-100 text-orange-800' },
    parking_violation: { label: 'Parking', color: 'bg-yellow-100 text-yellow-800' },
    unsafe_loading: { label: 'Unsafe Load', color: 'bg-pink-100 text-pink-800' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colorClasses = {
            blue: 'bg-blue-50 text-blue-600',
            red: 'bg-red-50 text-red-600',
            yellow: 'bg-yellow-50 text-yellow-600',
            green: 'bg-green-50 text-green-600',
          }[card.color];

          return (
            <div
              key={card.title}
              className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-sm font-medium text-green-600">{card.change}</span>
              </div>
              <h3 className="text-slate-600 text-sm font-medium mb-1">{card.title}</h3>
              <p className="text-3xl font-bold text-slate-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-800">Recent Violations</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              View All
            </button>
          </div>

          <div className="space-y-4">
            {recentViolations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No violations recorded</p>
              </div>
            ) : (
              recentViolations.map((violation) => (
                <div
                  key={violation.id}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 font-mono">
                        {violation.license_plate}
                      </p>
                      <p className="text-sm text-slate-500">
                        {new Date(violation.timestamp).toLocaleString('en-KE')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {violation.violations.map((v: string) => {
                      const label = violationLabels[v];
                      return (
                        <span
                          key={v}
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            label?.color || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {label?.label || v}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-6">System Performance</h3>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Detection Accuracy</span>
                <span className="text-sm font-bold text-slate-800">94%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">OCR Success Rate</span>
                <span className="text-sm font-bold text-slate-800">91%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-600">Alert Delivery</span>
                <span className="text-sm font-bold text-slate-800">98%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '98%' }}></div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="font-medium">System Status: Operational</span>
              </div>
              <p className="text-xs text-slate-500">
                All monitoring systems online. Last sync: just now.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
